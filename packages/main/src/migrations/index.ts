/**
 * Database Migration System for AuraSwift
 *
 * This system handles incremental database schema changes across versions.
 * Each migration is versioned and can be applied/rolled back safely.
 *
 * Key Features:
 * - Version tracking using SQLite's PRAGMA user_version
 * - Transactional migrations (all or nothing)
 * - Idempotent migrations (safe to run multiple times)
 * - Automatic backup before migrations
 * - Rollback support for failed migrations
 *
 * Best Practices:
 * 1. Never modify existing migrations
 * 2. Always increment version numbers
 * 3. Test migrations on backup data first
 * 4. Keep migrations small and focused
 * 5. Add proper error handling
 */

import type Database from "better-sqlite3";
import { app } from "electron";
import path from "path";
import fs from "fs";

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

/**
 * All database migrations in chronological order
 * IMPORTANT: Never modify existing migrations, only add new ones
 */
export const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    up: (db) => {
      // This is the baseline schema from v1.0.4
      // Already handled by initializeTables(), just mark as migrated
      console.log("   ℹ️ Baseline schema already exists");
    },
  },
  {
    version: 2,
    name: "add_business_contact_fields",
    up: (db) => {
      console.log("   🔄 Adding address, phone, vatNumber to businesses...");

      // Check if columns exist before adding
      const tableInfo = db.pragma("table_info(businesses)") as Array<{
        name: string;
      }>;
      const columnNames = tableInfo.map((col) => col.name);

      if (!columnNames.includes("address")) {
        db.exec(`ALTER TABLE businesses ADD COLUMN address TEXT DEFAULT '';`);
        console.log("      ✅ Added 'address' column");
      }

      if (!columnNames.includes("phone")) {
        db.exec(`ALTER TABLE businesses ADD COLUMN phone TEXT DEFAULT '';`);
        console.log("      ✅ Added 'phone' column");
      }

      if (!columnNames.includes("vatNumber")) {
        db.exec(`ALTER TABLE businesses ADD COLUMN vatNumber TEXT DEFAULT '';`);
        console.log("      ✅ Added 'vatNumber' column");
      }
    },
    down: (db) => {
      // SQLite doesn't support DROP COLUMN easily, so we skip rollback
      console.log("   ⚠️ Rollback not supported for this migration");
    },
  },
  {
    version: 3,
    name: "add_categories_parent_id",
    up: (db) => {
      console.log("   🔄 Adding parentId to categories...");

      const tableInfo = db.pragma("table_info(categories)") as Array<{
        name: string;
      }>;
      const columnNames = tableInfo.map((col) => col.name);

      if (!columnNames.includes("parentId")) {
        db.exec(`ALTER TABLE categories ADD COLUMN parentId TEXT;`);
        console.log("      ✅ Added 'parentId' column");
      }
    },
  },
  {
    version: 4,
    name: "add_categories_unique_constraint",
    up: (db) => {
      console.log("   🔄 Adding UNIQUE constraint to categories...");

      // Check if constraint already exists
      const tableSql = db
        .prepare(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name='categories'"
        )
        .get() as { sql: string } | undefined;

      if (
        tableSql &&
        tableSql.sql.includes("UNIQUE") &&
        tableSql.sql.includes("name")
      ) {
        console.log("      ℹ️ UNIQUE constraint already exists");
        return;
      }

      // Find and resolve duplicates
      const duplicates = db
        .prepare(
          `
          SELECT name, businessId, GROUP_CONCAT(id) as ids, COUNT(*) as count
          FROM categories
          GROUP BY name, businessId
          HAVING COUNT(*) > 1
        `
        )
        .all() as Array<{
        name: string;
        businessId: string;
        ids: string;
        count: number;
      }>;

      if (duplicates.length > 0) {
        console.log(`      📝 Resolving ${duplicates.length} duplicate(s)...`);

        for (const dup of duplicates) {
          const categoryIds = dup.ids.split(",");
          for (let i = 1; i < categoryIds.length; i++) {
            const newName = `${dup.name} (${i + 1})`;
            db.prepare(
              "UPDATE categories SET name = ?, updatedAt = datetime('now') WHERE id = ?"
            ).run(newName, categoryIds[i]);
            console.log(`         ✅ Renamed "${dup.name}" → "${newName}"`);
          }
        }
      }

      // Recreate table with UNIQUE constraint
      db.exec("PRAGMA foreign_keys = OFF;");

      db.exec(`
        CREATE TABLE categories_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          parentId TEXT,
          description TEXT,
          businessId TEXT NOT NULL,
          isActive BOOLEAN DEFAULT 1,
          sortOrder INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (businessId) REFERENCES businesses (id),
          FOREIGN KEY (parentId) REFERENCES categories_new (id) ON DELETE SET NULL,
          UNIQUE(name, businessId)
        )
      `);

      db.exec(`
        INSERT INTO categories_new (id, name, parentId, description, businessId, isActive, sortOrder, createdAt, updatedAt)
        SELECT 
          id, name, parentId, description, businessId, 
          COALESCE(isActive, 1), 
          COALESCE(sortOrder, 0), 
          COALESCE(createdAt, datetime('now')), 
          COALESCE(updatedAt, datetime('now'))
        FROM categories
      `);

      db.exec("DROP TABLE categories;");
      db.exec("ALTER TABLE categories_new RENAME TO categories;");
      db.exec("PRAGMA foreign_keys = ON;");

      console.log("      ✅ UNIQUE constraint added");
    },
  },
  // Add future migrations here
  // Example:
  // {
  //   version: 5,
  //   name: "add_products_barcode",
  //   up: (db) => {
  //     db.exec(`ALTER TABLE products ADD COLUMN barcode TEXT;`);
  //   },
  // },
];

/**
 * Get current database schema version
 */
export function getCurrentVersion(db: Database.Database): number {
  const result = db.pragma("user_version", { simple: true }) as number;
  return result;
}

/**
 * Set database schema version
 */
export function setVersion(db: Database.Database, version: number): void {
  db.pragma(`user_version = ${version}`);
}

/**
 * Create a backup of the database file
 */
export function createBackup(dbPath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(path.dirname(dbPath), "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(
    backupDir,
    `${path.basename(dbPath, ".db")}_v${timestamp}.db`
  );

  fs.copyFileSync(dbPath, backupPath);
  console.log(`   📦 Backup created: ${backupPath}`);

  // Keep only last 5 backups
  cleanOldBackups(backupDir, 5);

  return backupPath;
}

/**
 * Clean old backup files, keeping only the specified number
 */
function cleanOldBackups(backupDir: string, keepCount: number): void {
  try {
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith(".db"))
      .map((f) => ({
        name: f,
        path: path.join(backupDir, f),
        mtime: fs.statSync(path.join(backupDir, f)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Delete old backups
    files.slice(keepCount).forEach((file) => {
      fs.unlinkSync(file.path);
      console.log(`   🗑️ Deleted old backup: ${file.name}`);
    });
  } catch (error) {
    console.error("   ⚠️ Error cleaning old backups:", error);
  }
}

/**
 * Run all pending migrations
 */
export function runMigrations(db: Database.Database, dbPath: string): void {
  const currentVersion = getCurrentVersion(db);
  const latestVersion = migrations[migrations.length - 1]?.version || 0;

  console.log(`\n📊 Database Migration Status:`);
  console.log(`   Current version: ${currentVersion}`);
  console.log(`   Latest version: ${latestVersion}`);

  if (currentVersion >= latestVersion) {
    console.log(`   ✅ Database is up to date\n`);
    return;
  }

  console.log(
    `   🔄 Running migrations from v${currentVersion} to v${latestVersion}...\n`
  );

  // Create backup before migrations
  try {
    createBackup(dbPath);
  } catch (error) {
    console.error("   ❌ Failed to create backup:", error);
    throw new Error("Migration aborted: Could not create backup");
  }

  // Run each pending migration
  const pendingMigrations = migrations.filter(
    (m) => m.version > currentVersion
  );

  for (const migration of pendingMigrations) {
    console.log(
      `\n🔧 Applying migration v${migration.version}: ${migration.name}`
    );

    try {
      // Run migration in transaction
      db.exec("BEGIN TRANSACTION;");

      migration.up(db);

      // Update version
      setVersion(db, migration.version);

      db.exec("COMMIT;");

      console.log(
        `   ✅ Migration v${migration.version} completed successfully`
      );
    } catch (error) {
      db.exec("ROLLBACK;");

      console.error(`   ❌ Migration v${migration.version} failed:`, error);
      console.error(`   🔄 Rolled back to version ${getCurrentVersion(db)}`);

      throw new Error(
        `Migration failed at version ${migration.version}. ` +
          `Database has been rolled back. ` +
          `A backup is available if needed. ` +
          `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log(`\n✅ All migrations completed successfully!`);
  console.log(`   Database is now at version ${getCurrentVersion(db)}\n`);
}

/**
 * Rollback to a specific version (use with caution!)
 */
export function rollbackToVersion(
  db: Database.Database,
  targetVersion: number,
  dbPath: string
): void {
  const currentVersion = getCurrentVersion(db);

  if (targetVersion >= currentVersion) {
    console.log("   ℹ️ Target version is same or higher, nothing to rollback");
    return;
  }

  console.log(
    `\n⚠️ Rolling back from v${currentVersion} to v${targetVersion}...`
  );

  // Create backup before rollback
  createBackup(dbPath);

  // Get migrations to rollback (in reverse order)
  const migrationsToRollback = migrations
    .filter((m) => m.version > targetVersion && m.version <= currentVersion)
    .reverse();

  for (const migration of migrationsToRollback) {
    if (!migration.down) {
      console.error(
        `   ❌ Migration v${migration.version} has no rollback function`
      );
      throw new Error(`Cannot rollback migration v${migration.version}`);
    }

    console.log(`   🔄 Rolling back v${migration.version}: ${migration.name}`);

    try {
      db.exec("BEGIN TRANSACTION;");

      migration.down(db);

      setVersion(db, migration.version - 1);

      db.exec("COMMIT;");

      console.log(`   ✅ Rolled back v${migration.version}`);
    } catch (error) {
      db.exec("ROLLBACK;");
      console.error(`   ❌ Rollback failed:`, error);
      throw error;
    }
  }

  console.log(`\n✅ Rollback completed to version ${targetVersion}\n`);
}

/**
 * Verify database integrity after migrations
 */
export function verifyIntegrity(db: Database.Database): boolean {
  try {
    const result = db.pragma("integrity_check", { simple: true });

    if (result === "ok") {
      console.log("   ✅ Database integrity check passed");
      return true;
    } else {
      console.error("   ❌ Database integrity check failed:", result);
      return false;
    }
  } catch (error) {
    console.error("   ❌ Error checking database integrity:", error);
    return false;
  }
}
