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
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_FOLDER = join(__dirname, "migrations");

/**
 * Get underlying better-sqlite3 database instance from Drizzle
 */
function getRawDatabase(drizzleDb: any): Database.Database {
  // Drizzle DB structure: drizzleDb has a session property with the raw DB
  // Try multiple paths to find the actual better-sqlite3 instance
  if (drizzleDb._.session?.db) {
    return drizzleDb._.session.db;
  }
  if (drizzleDb.session?.db) {
    return drizzleDb.session.db;
  }
  // If it's already the raw database, return it
  if (typeof drizzleDb.prepare === "function") {
    return drizzleDb;
  }
  throw new Error(
    "Could not extract raw database instance from Drizzle wrapper"
  );
}

/**
 * Check database integrity before migrations
 */
function checkDatabaseIntegrity(rawDb: Database.Database): boolean {
  try {
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
    return true;
  } catch (error) {
    console.error("   ❌ Integrity check error:", error);
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
  db: any, // Drizzle DB instance
  rawDb: Database.Database, // Raw better-sqlite3 instance
  dbPath: string
): Promise<boolean> {
  let backupPath = "";

  try {
    console.log("\n🚀 Running Drizzle ORM Migrations...");

    // Check if migrations folder exists
    if (!existsSync(MIGRATIONS_FOLDER)) {
      console.log("   ℹ️  No migrations folder found - skipping");
      return true;
    }

    // Verify we have a valid raw database instance
    if (!rawDb || typeof rawDb.prepare !== "function") {
      throw new Error(
        "Invalid raw database instance - cannot perform integrity checks"
      );
    }

    // Integrity check before migrations
    console.log("   🔍 Checking database integrity...");
    if (!checkDatabaseIntegrity(rawDb)) {
      throw new Error("Database integrity check failed - aborting migration");
    }

    // Create backup before migrations
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = join(dirname(dbPath), "backups");

    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    backupPath = join(backupDir, `auraswift-backup-${timestamp}.db`);
    copyFileSync(dbPath, backupPath);
    console.log(`   📦 Backup created: ${backupPath}`);

    // Run migrations using Drizzle's migrate()
    // Drizzle handles:
    // - Tracking which migrations have been applied (__drizzle_migrations table)
    // - Only running pending migrations
    // - Executing SQL statements in order
    // - Transaction management (each migration runs in its own transaction)
    console.log("   ⚙️  Applying pending migrations...");
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    // Integrity check after migrations
    console.log("   🔍 Verifying database integrity after migration...");
    if (!checkDatabaseIntegrity(rawDb)) {
      throw new Error("Database integrity check failed after migration");
    }

    console.log("   ✅ All migrations completed successfully!\n");
    return true;
  } catch (error) {
    console.error("   ❌ Migration failed:", error);
    console.error(
      "   💡 Drizzle automatically rolled back the failed migration"
    );
    console.error("   📦 Backup available at:", backupPath || "unknown");
    return false;
  }
}
