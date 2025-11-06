/**
 * Database Migration Definitions for AuraSwift
 * Each migration must have a unique version number and implement 'up' and optionally 'down'
 */

export interface Migration {
  version: number;
  name: string;
  description: string;
  up: (db: any) => void;
  down?: (db: any) => void;
}

/**
 * All database migrations in chronological order
 * IMPORTANT: Never modify existing migrations, only add new ones
 *
 * NOTE: The baseline schema (with all tables and columns) is created in db-manager.ts
 * This file should only contain FUTURE migrations after the initial refactor.
 */
export const MIGRATIONS: Migration[] = [
  // Add future migrations here as needed
  // When you need to change the database schema, add a new migration:
  //
  // {
  //   version: 1,
  //   name: "add_products_barcode",
  //   description: "Add barcode field to products table",
  //   up: (db) => {
  //     const tableInfo = db.pragma("table_info(products)") as Array<{ name: string }>;
  //     const columnNames = tableInfo.map((col) => col.name);
  //
  //     if (!columnNames.includes("barcode")) {
  //       db.exec(`ALTER TABLE products ADD COLUMN barcode TEXT;`);
  //       console.log("      ✅ Added 'barcode' column to products");
  //     } else {
  //       console.log("      ℹ️ Column 'barcode' already exists");
  //     }
  //   },
  // },
];

/**
 * Get the latest migration version
 */
export function getLatestVersion(): number {
  return MIGRATIONS.length > 0 ? MIGRATIONS[MIGRATIONS.length - 1].version : 0;
}

/**
 * Get migration by version
 */
export function getMigrationByVersion(version: number): Migration | undefined {
  return MIGRATIONS.find((m) => m.version === version);
}

/**
 * Get all migrations after a specific version
 */
export function getPendingMigrations(currentVersion: number): Migration[] {
  return MIGRATIONS.filter((m) => m.version > currentVersion);
}
