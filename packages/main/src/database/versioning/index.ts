/**
 * Database Versioning and Migration System for AuraSwift
 * Handles schema versioning, migrations, and automatic updates
 */

import type { Database } from "better-sqlite3";
import {
  existsSync,
  copyFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { join, dirname } from "node:path";
import {
  MIGRATIONS,
  getLatestVersion,
  getPendingMigrations,
  type Migration,
} from "./migrations.js";

const MAX_BACKUPS = 10; // Keep last 10 backups

/**
 * Get the current database version
 */
export function getCurrentVersion(db: Database): number {
  const result = db.pragma("user_version", { simple: true });
  return Number(result) || 0;
}

/**
 * Set the database version
 */
export function setDatabaseVersion(db: Database, version: number): void {
  db.pragma(`user_version = ${version}`);
  console.log(`   ✅ Database version updated to ${version}`);
}

/**
 * Create a backup of the database before migrations
 */
export function createBackup(dbPath: string, currentVersion: number): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = join(dirname(dbPath), "backups");

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = join(
    backupDir,
    `auraswift-backup-v${currentVersion}-${timestamp}.db`
  );

  copyFileSync(dbPath, backupPath);
  console.log(`   📦 Backup created: ${backupPath}`);

  // Cleanup old backups
  cleanupOldBackups(backupDir);

  return backupPath;
}

/**
 * Clean up old backups, keeping only the most recent ones
 */
function cleanupOldBackups(backupDir: string): void {
  if (!existsSync(backupDir)) return;

  const backupFiles = readdirSync(backupDir)
    .filter(
      (file) => file.startsWith("auraswift-backup-") && file.endsWith(".db")
    )
    .map((file) => ({
      name: file,
      path: join(backupDir, file),
      time: statSync(join(backupDir, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time); // Sort by newest first

  if (backupFiles.length > MAX_BACKUPS) {
    const filesToDelete = backupFiles.slice(MAX_BACKUPS);
    for (const file of filesToDelete) {
      try {
        unlinkSync(file.path);
        console.log(`   🗑️  Removed old backup: ${file.name}`);
      } catch (error) {
        console.warn(`   ⚠️  Failed to delete old backup ${file.name}:`, error);
      }
    }
  }
}

/**
 * Run all pending migrations
 */
export function runMigrations(db: Database, dbPath: string): boolean {
  const currentVersion = getCurrentVersion(db);
  const latestVersion = getLatestVersion();

  console.log(`\n🔍 Database Version Check:`);
  console.log(`   Current: v${currentVersion}`);
  console.log(`   Latest:  v${latestVersion}`);

  if (currentVersion === latestVersion) {
    console.log(`   ✅ Database is up to date!`);
    return true;
  }

  if (currentVersion > latestVersion) {
    console.error(
      `   ❌ Database version (v${currentVersion}) is ahead of code version (v${latestVersion})`
    );
    console.error(
      `      This may happen if you downgraded the application. Please update to the latest version.`
    );
    return false;
  }

  const pendingMigrations = getPendingMigrations(currentVersion);

  if (pendingMigrations.length === 0) {
    console.log(`   ✅ No migrations to run`);
    return true;
  }

  console.log(`\n🚀 Running ${pendingMigrations.length} migration(s)...\n`);

  // Create backup before migrations
  try {
    createBackup(dbPath, currentVersion);
  } catch (error) {
    console.error(`   ❌ Failed to create backup:`, error);
    console.error(`      Aborting migrations for safety.`);
    return false;
  }

  // Verify integrity before migrations
  if (!verifyIntegrity(db)) {
    console.error(`   ❌ Database integrity check failed before migrations`);
    console.error(`      Aborting migrations for safety.`);
    return false;
  }

  // Run each migration in a transaction
  let successCount = 0;

  for (const migration of pendingMigrations) {
    console.log(`\n📝 Migration v${migration.version}: ${migration.name}`);
    console.log(`   ${migration.description}`);

    try {
      // Run migration in transaction
      const runMigration = db.transaction(() => {
        migration.up(db);
        setDatabaseVersion(db, migration.version);
      });

      runMigration();

      successCount++;
      console.log(
        `   ✅ Migration v${migration.version} completed successfully`
      );
    } catch (error) {
      console.error(`\n❌ Migration v${migration.version} FAILED:`, error);
      console.error(`   Database is still at version ${getCurrentVersion(db)}`);
      console.error(`   Backup available at the backup directory`);
      return false;
    }
  }

  // Verify integrity after all migrations
  if (!verifyIntegrity(db)) {
    console.error(`\n❌ Database integrity check failed after migrations`);
    console.error(`   Backup available for recovery`);
    return false;
  }

  console.log(`\n✅ All ${successCount} migration(s) completed successfully!`);
  console.log(
    `   Database updated from v${currentVersion} to v${getCurrentVersion(db)}\n`
  );

  return true;
}

/**
 * Verify database integrity
 */
export function verifyIntegrity(db: Database): boolean {
  try {
    const result = db.pragma("integrity_check", { simple: true });
    const isValid = result === "ok";

    if (isValid) {
      console.log("   ✅ Database integrity check passed");
    } else {
      console.error("   ❌ Database integrity check failed:", result);
    }

    return isValid;
  } catch (error) {
    console.error("   ❌ Database integrity check error:", error);
    return false;
  }
}

/**
 * Initialize database versioning system
 * Should be called after database connection is established
 */
export function initializeVersioning(db: Database, dbPath: string): boolean {
  console.log("\n🗄️  Initializing Database Versioning System...");

  try {
    // Run any pending migrations
    const success = runMigrations(db, dbPath);

    if (success) {
      console.log("✅ Database versioning initialized successfully\n");
    } else {
      console.error("❌ Database versioning initialization failed\n");
    }

    return success;
  } catch (error) {
    console.error("❌ Fatal error during versioning initialization:", error);
    return false;
  }
}

/**
 * Get migration history summary
 */
export function getMigrationHistory(db: Database): {
  currentVersion: number;
  latestVersion: number;
  appliedMigrations: Migration[];
  pendingMigrations: Migration[];
} {
  const currentVersion = getCurrentVersion(db);
  const latestVersion = getLatestVersion();

  const appliedMigrations = MIGRATIONS.filter(
    (m) => m.version <= currentVersion
  );
  const pendingMigrations = getPendingMigrations(currentVersion);

  return {
    currentVersion,
    latestVersion,
    appliedMigrations,
    pendingMigrations,
  };
}

/**
 * Export all versioning utilities
 */
export {
  MIGRATIONS,
  getLatestVersion,
  getPendingMigrations,
  type Migration,
} from "./migrations.js";
