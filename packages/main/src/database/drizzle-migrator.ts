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
 *
 * Migration Folder Detection:
 * - Development: Uses migrations folder relative to dist directory
 * - Production: Checks multiple locations in order:
 *   1. process.resourcesPath/migrations (electron-builder extraResources)
 *   2. __dirname/migrations (inside asar bundle)
 *   3. app.getAppPath()/node_modules/@app/main/dist/migrations
 *   4. app.getAppPath()/database/migrations (legacy)
 *
 * Expected Bundle Structure (Production):
 * - migrations/ folder should be in extraResources (electron-builder config)
 * - Or bundled in the asar archive at: node_modules/@app/main/dist/migrations/
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
import * as schema from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get migrations folder path - handles both development and production
 * In production, migrations should be bundled with the app
 */
/**
 * Get the path to the migrations folder.
 *
 * In development, migrations are in the source directory.
 * In production, checks multiple locations in order:
 * 1. process.resourcesPath/migrations (extraResources - recommended)
 * 2. __dirname/migrations (inside asar bundle)
 * 3. app.getAppPath()/node_modules/@app/main/dist/migrations
 * 4. app.getAppPath()/database/migrations (legacy)
 *
 * @returns Path to migrations folder
 * @throws Error if folder not found (in production)
 */
function getMigrationsFolder(): string {
  // In development, use source folder
  if (!app.isPackaged) {
    const devPath = join(__dirname, "migrations");
    if (!existsSync(devPath)) {
      throw new Error(
        `Development migrations folder not found: ${devPath}\n` +
          "Make sure migrations folder exists in packages/main/src/database/"
      );
    }
    return devPath;
  }

  // In production, migrations are bundled in the app
  // Try multiple locations in order of preference
  // IMPORTANT: Check extraResources FIRST (electron-builder puts them there)

  const checkedPaths: string[] = [];

  // Option 1: Check using extraResources (outside asar) - THIS IS WHERE ELECTRON-BUILDER PUTS THEM
  // This is the recommended location for electron-builder
  const resourcesPath = process.resourcesPath;
  if (resourcesPath) {
    const resourcesMigrationsPath = join(resourcesPath, "migrations");
    checkedPaths.push(
      `1. ${resourcesMigrationsPath} (extraResources - recommended)`
    );
    if (existsSync(resourcesMigrationsPath)) {
      console.log(
        `   📁 Found migrations in extraResources: ${resourcesMigrationsPath}`
      );
      return resourcesMigrationsPath;
    }
  }

  // Option 2: Check relative to current file (inside asar: node_modules/@app/main/dist/migrations)
  const distMigrationsPath = join(__dirname, "migrations");
  checkedPaths.push(`2. ${distMigrationsPath} (inside asar)`);
  if (existsSync(distMigrationsPath)) {
    console.log(`   📁 Found migrations in asar: ${distMigrationsPath}`);
    return distMigrationsPath;
  }

  // Option 3: Check in app path (if migrations are at app root)
  const appPath = app.getAppPath();
  const appMigrationsPath = join(
    appPath,
    "node_modules",
    "@app",
    "main",
    "dist",
    "migrations"
  );
  checkedPaths.push(`3. ${appMigrationsPath} (app path)`);
  if (existsSync(appMigrationsPath)) {
    console.log(`   📁 Found migrations in app path: ${appMigrationsPath}`);
    return appMigrationsPath;
  }

  // Option 4: Try app path with database subfolder (legacy)
  const asarMigrationsPath = join(appPath, "database", "migrations");
  checkedPaths.push(`4. ${asarMigrationsPath} (legacy)`);
  if (existsSync(asarMigrationsPath)) {
    console.log(
      `   📁 Found migrations in legacy location: ${asarMigrationsPath}`
    );
    return asarMigrationsPath;
  }

  // No migrations folder found - provide detailed error message
  const errorMessage =
    `Migrations folder not found in any expected location.\n\n` +
    `Checked paths (in order):\n${checkedPaths.join("\n")}\n\n` +
    `Expected Bundle Structure:\n` +
    `- Migrations should be in extraResources (recommended for electron-builder)\n` +
    `- Configure in electron-builder.mjs:\n` +
    `  extraResources: [\n` +
    `    { from: "packages/main/src/database/migrations", to: "migrations" }\n` +
    `  ]\n` +
    `- Or bundled in asar at: node_modules/@app/main/dist/migrations/\n\n` +
    `Troubleshooting:\n` +
    `- Check that migrations folder exists in source code\n` +
    `- Verify electron-builder configuration includes migrations\n` +
    `- Check that migrations are included in the build output`;

  throw new Error(errorMessage);
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
        console.warn("Quick check found issues, running full check...");
        // Fall through to full integrity check
      } else {
        console.log("Quick integrity check passed");
      }
    }

    // 2. Full integrity check
    const result = rawDb.prepare("PRAGMA integrity_check").get() as {
      integrity_check: string;
    };
    if (result.integrity_check !== "ok") {
      console.error("Database integrity check failed:", result.integrity_check);
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

    // Check if migrations folder exists (getMigrationsFolder now throws if not found)
    // But we still check here for additional diagnostics
    if (!existsSync(migrationsFolder)) {
      console.error(`   ❌ Migrations folder not found: ${migrationsFolder}`);
      console.error(
        "   💡 Make sure migrations are bundled with the app in production"
      );
      console.error(`   📍 Current __dirname: ${__dirname}`);
      console.error(
        `   📍 App path: ${
          app.isPackaged ? app.getAppPath() : "N/A (dev mode)"
        }`
      );
      console.error(`   📍 Resources path: ${process.resourcesPath || "N/A"}`);

      // Try to list what's actually in the dist directory
      if (existsSync(__dirname)) {
        try {
          const distContents = readdirSync(__dirname);
          console.error(
            `   📂 Contents of dist directory: ${distContents.join(", ")}`
          );
          if (!distContents.includes("migrations")) {
            console.error(
              "   ⚠️  'migrations' folder not found in dist directory"
            );
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error(
            `   ⚠️  Could not read dist directory: ${errorMessage}`
          );
        }
      }

      // Additional diagnostics: check resources path contents
      if (process.resourcesPath && existsSync(process.resourcesPath)) {
        try {
          const resourcesContents = readdirSync(process.resourcesPath);
          console.error(
            `   📂 Contents of resources directory: ${resourcesContents.join(
              ", "
            )}`
          );
          if (!resourcesContents.includes("migrations")) {
            console.error(
              "   ⚠️  'migrations' folder not found in resources directory"
            );
            console.error(
              "   💡 Add migrations to extraResources in electron-builder.mjs"
            );
          }
        } catch (e) {
          // Ignore - can't read resources directory
        }
      }

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
      // Checkpoint WAL to ensure all data is in the main database file
      // This is important because SQLite uses WAL mode by default, which creates
      // .db-wal and .db-shm files that aren't included in simple file copies
      try {
        rawDb.prepare("PRAGMA wal_checkpoint(TRUNCATE)").run();
        console.log("   ✅ WAL checkpoint completed - all data in main file");
      } catch (walError) {
        console.warn("   ⚠️  WAL checkpoint failed (non-fatal):", walError);
        // Continue with backup even if checkpoint fails
      }

      // Create backup
      copyFileSync(dbPath, backupPath);
      console.log(`   📦 Backup created: ${backupPath}`);

      // Verify backup was created successfully and is valid
      if (!existsSync(backupPath)) {
        throw new Error("Backup creation failed - backup file not found");
      }

      // Verify backup size matches source (if source exists)
      const sourceStats = statSync(dbPath);
      const backupStats = statSync(backupPath);

      if (sourceStats.size !== backupStats.size) {
        throw new Error(
          `Backup size mismatch: source ${sourceStats.size} bytes vs backup ${backupStats.size} bytes`
        );
      }

      console.log(
        `   ✅ Backup verified: ${(backupStats.size / 1024).toFixed(2)} KB`
      );
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
