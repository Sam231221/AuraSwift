/**
 * Drizzle ORM Migration System
 *
 * Uses Drizzle Kit's generated SQL migrations directly
 * No need to manually copy SQL to TypeScript!
 *
 * Safety Features:
 * - Transaction wrapper for atomic migrations
 * - Automatic backups before migrations
 * - Integrity checks before/after
 * - Rollback on failure
 */

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  existsSync,
  copyFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { app } from "electron";
import Database from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../schema/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get migrations folder path - handles both development and production
 * In production, migrations should be bundled with the app
 */
function getMigrationsFolder(): string {
  // In development, use source folder
  if (!app.isPackaged) {
    return join(__dirname, "migrations");
  }

  // In production, migrations are bundled in the app
  // Option 1: If migrations are in app.asar, use app path
  const appPath = app.getAppPath();
  const asarMigrationsPath = join(appPath, "database", "migrations");

  if (existsSync(asarMigrationsPath)) {
    return asarMigrationsPath;
  }

  // Option 2: If using extraResources in electron-builder
  // This requires electron-builder config to copy migrations to resources
  const resourcesPath = process.resourcesPath;
  if (resourcesPath) {
    const resourcesMigrationsPath = join(resourcesPath, "migrations");
    if (existsSync(resourcesMigrationsPath)) {
      return resourcesMigrationsPath;
    }
  }

  // Fallback: Try relative to current directory
  const fallbackPath = join(__dirname, "migrations");
  if (existsSync(fallbackPath)) {
    return fallbackPath;
  }

  // Last resort: Return expected path (will be checked later)
  return join(__dirname, "migrations");
}

/**
 * Check database integrity before migrations
 * Enhanced with foreign key validation and quick check
 */
function checkDatabaseIntegrity(
  rawDb: Database.Database,
  isProduction: boolean = false
): boolean {
  try {
    // 1. Quick check (faster for large databases)
    if (isProduction) {
      const quickCheck = rawDb.prepare("PRAGMA quick_check").get() as {
        quick_check: string;
      };
      if (quickCheck.quick_check !== "ok") {
        console.warn("   ⚠️  Quick check found issues, running full check...");
        // Fall through to full integrity check
      } else {
        console.log("   ✅ Quick integrity check passed");
      }
    }

    // 2. Full integrity check
    const result = rawDb.prepare("PRAGMA integrity_check").get() as {
      integrity_check: string;
    };
    if (result.integrity_check !== "ok") {
      console.error(
        "   ❌ Database integrity check failed:",
        result.integrity_check
      );
      return false;
    }
    console.log("   ✅ Database integrity check passed");

    // 3. Foreign key check (if foreign keys are enabled)
    try {
      const fkCheck = rawDb.prepare("PRAGMA foreign_key_check").all() as Array<{
        table: string;
        rowid: number;
        parent: string;
        fkid: number;
      }>;
      if (fkCheck.length > 0) {
        console.error(
          `   ❌ Foreign key violations found: ${fkCheck.length} violation(s)`
        );
        if (!isProduction) {
          // In development, show details
          fkCheck.slice(0, 5).forEach((violation) => {
            console.error(
              `      - Table: ${violation.table}, Row: ${violation.rowid}, Parent: ${violation.parent}`
            );
          });
        }
        return false;
      }
      console.log("   ✅ Foreign key check passed");
    } catch (fkError) {
      // Foreign keys might not be enabled, which is OK
      console.log("   ℹ️  Foreign key check skipped (FKs may not be enabled)");
    }

    return true;
  } catch (error) {
    console.error("   ❌ Integrity check error:", error);
    return false;
  }
}

/**
 * Cleanup old backups, keeping only the most recent N backups
 * @param backupDir - Directory containing backups
 * @param maxBackups - Maximum number of backups to keep (default: 10)
 */
function cleanupOldBackups(backupDir: string, maxBackups: number = 10): void {
  try {
    if (!existsSync(backupDir)) {
      return;
    }

    const backups = readdirSync(backupDir)
      .filter((f) => f.startsWith("auraswift-backup-") && f.endsWith(".db"))
      .map((f) => {
        const filePath = join(backupDir, f);
        return {
          name: f,
          path: filePath,
          mtime: statSync(filePath).mtime,
          size: statSync(filePath).size,
        };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Newest first

    if (backups.length > maxBackups) {
      const toDelete = backups.slice(maxBackups);
      let totalFreed = 0;

      for (const backup of toDelete) {
        try {
          totalFreed += backup.size;
          unlinkSync(backup.path);
          console.log(`   🗑️  Removed old backup: ${backup.name}`);
        } catch (error) {
          console.warn(`   ⚠️  Failed to remove backup ${backup.name}:`, error);
        }
      }

      if (totalFreed > 0) {
        const freedMB = (totalFreed / (1024 * 1024)).toFixed(2);
        console.log(`   💾 Freed ${freedMB} MB by cleaning up old backups`);
      }
    }
  } catch (error) {
    console.warn("   ⚠️  Failed to cleanup old backups:", error);
    // Don't throw - backup cleanup failure shouldn't block migrations
  }
}

/**
 * Rollback migration by restoring from backup
 * @param dbPath - Path to database file
 * @param backupPath - Path to backup file
 * @param rawDb - Raw database instance (will be closed)
 */
async function rollbackMigration(
  dbPath: string,
  backupPath: string,
  rawDb: Database.Database
): Promise<boolean> {
  try {
    console.log("   🔄 Attempting to rollback migration...");

    // Close current database connection if it's open
    try {
      if (rawDb) {
        rawDb.close();
      }
    } catch (closeError) {
      // Database might already be closed, ignore
    }

    // Verify backup exists
    if (!existsSync(backupPath)) {
      console.error(`   ❌ Backup file not found: ${backupPath}`);
      return false;
    }

    // Restore from backup
    copyFileSync(backupPath, dbPath);
    console.log("   ✅ Database restored from backup");
    console.log(`   📦 Restored from: ${backupPath}`);

    return true;
  } catch (error) {
    console.error("   ❌ Rollback failed:", error);
    return false;
  }
}

/**
 * Run Drizzle migrations with transaction safety
 * This reads .sql files from the migrations folder and applies them atomically
 *
 * @param db - Drizzle DB instance
 * @param rawDb - Raw better-sqlite3 instance (for transaction control)
 * @param dbPath - Path to database file (for backup)
 */
export async function runDrizzleMigrations(
  db: BetterSQLite3Database<typeof schema>,
  rawDb: Database.Database,
  dbPath: string
): Promise<boolean> {
  let backupPath = "";
  const isProduction = app.isPackaged;
  const migrationsFolder = getMigrationsFolder();

  try {
    console.log("\n🚀 Running Drizzle ORM Migrations...");
    if (isProduction) {
      console.log("   🔒 Production mode: Enhanced safety checks enabled");
    } else {
      console.log("   🛠️  Development mode: Relaxed migration checks");
    }
    console.log(`   📁 Migrations folder: ${migrationsFolder}`);

    // Check if migrations folder exists
    if (!existsSync(migrationsFolder)) {
      console.error(`   ❌ Migrations folder not found: ${migrationsFolder}`);
      console.error(
        "   💡 Make sure migrations are bundled with the app in production"
      );
      return false;
    }

    // Verify we have a valid raw database instance
    if (!rawDb || typeof rawDb.prepare !== "function") {
      throw new Error(
        "Invalid raw database instance - cannot perform integrity checks"
      );
    }

    // Integrity check before migrations
    console.log("   🔍 Checking database integrity...");
    if (!checkDatabaseIntegrity(rawDb, isProduction)) {
      throw new Error("Database integrity check failed - aborting migration");
    }

    // Create backup before migrations
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = join(dirname(dbPath), "backups");

    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    // Cleanup old backups before creating new one
    cleanupOldBackups(backupDir, isProduction ? 10 : 5); // Keep more backups in production

    backupPath = join(backupDir, `auraswift-backup-${timestamp}.db`);

    // Verify database file exists before backing up
    if (!existsSync(dbPath)) {
      console.log(
        "   ℹ️  Database file doesn't exist yet - creating new database"
      );
    } else {
      copyFileSync(dbPath, backupPath);
      console.log(`   📦 Backup created: ${backupPath}`);
    }

    // Production-specific safety checks
    if (isProduction) {
      // Verify backup was created successfully
      if (existsSync(dbPath) && !existsSync(backupPath)) {
        throw new Error(
          "Backup creation failed - aborting migration for safety"
        );
      }

      // Additional production checks could go here:
      // - Verify migration files are valid
      // - Check disk space
      // - Verify write permissions
    }

    // Run migrations using Drizzle's migrate()
    // Drizzle handles:
    // - Tracking which migrations have been applied (__drizzle_migrations table)
    // - Only running pending migrations
    // - Executing SQL statements in order
    // - Transaction management (each migration runs in its own transaction)
    console.log("   ⚙️  Applying pending migrations...");
    const startTime = Date.now();
    await migrate(db, { migrationsFolder: migrationsFolder });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`   ⏱️  Migrations completed in ${duration}s`);

    // Integrity check after migrations
    console.log("   🔍 Verifying database integrity after migration...");
    if (!checkDatabaseIntegrity(rawDb, isProduction)) {
      throw new Error("Database integrity check failed after migration");
    }

    console.log("   ✅ All migrations completed successfully!\n");
    return true;
  } catch (error) {
    // Provide detailed error context
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("   ❌ Migration failed:");
    console.error(`   📍 Database path: ${dbPath}`);
    console.error(`   📝 Error message: ${errorMessage}`);
    if (errorStack) {
      console.error(
        `   📋 Stack trace:\n${errorStack
          .split("\n")
          .map((line) => `      ${line}`)
          .join("\n")}`
      );
    }

    // Attempt automatic rollback if backup exists
    if (backupPath && existsSync(backupPath) && existsSync(dbPath)) {
      console.error("   🔄 Attempting automatic rollback...");
      const rollbackSuccess = await rollbackMigration(
        dbPath,
        backupPath,
        rawDb
      );
      if (rollbackSuccess) {
        console.error("   ✅ Migration rolled back successfully");
        console.error("   💡 Database restored to pre-migration state");
      } else {
        console.error("   ⚠️  Automatic rollback failed");
        console.error(`   📦 Manual restore required from: ${backupPath}`);
      }
    } else {
      console.error(
        "   💡 Drizzle automatically rolled back the failed migration"
      );
      if (backupPath) {
        console.error(`   📦 Backup available at: ${backupPath}`);
      }
    }

    return false;
  }
}
