/**
 * Drizzle ORM Migration System
 *
 * Uses Drizzle Kit's generated SQL migrations directly
 * No need to manually copy SQL to TypeScript!
 */

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, copyFileSync, mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_FOLDER = join(__dirname, "migrations");

/**
 * Run Drizzle migrations
 * This reads .sql files from the migrations folder and applies them
 */
export async function runDrizzleMigrations(
  db: any, // Accept any Drizzle DB instance
  dbPath: string
): Promise<boolean> {
  try {
    console.log("\n🚀 Running Drizzle ORM Migrations...");

    // Check if migrations folder exists
    if (!existsSync(MIGRATIONS_FOLDER)) {
      console.log("   ℹ️  No migrations folder found - skipping");
      return true;
    }

    // Create backup before migrations
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = join(dirname(dbPath), "backups");

    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = join(backupDir, `auraswift-backup-${timestamp}.db`);
    copyFileSync(dbPath, backupPath);
    console.log(`   📦 Backup created: ${backupPath}`);

    // Run migrations using Drizzle's migrate()
    // This automatically:
    // - Tracks which migrations have been applied
    // - Only runs pending migrations
    // - Handles transactions
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    console.log("   ✅ All migrations completed successfully!\n");
    return true;
  } catch (error) {
    console.error("   ❌ Migration failed:", error);
    return false;
  }
}
