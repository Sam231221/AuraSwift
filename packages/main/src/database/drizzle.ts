/**
 * Drizzle ORM Integration for AuraSwift
 *
 * This module initializes Drizzle ORM with the existing better-sqlite3 connection.
 * It allows gradual migration from raw SQL to type-safe Drizzle queries.
 *
 * @see /packages/main/src/database/docs/07_DRIZZLE_ORM_INTEGRATION.md
 */

import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import type Database from "better-sqlite3";
import * as schema from "./schema.js";

let drizzleInstance: BetterSQLite3Database<typeof schema> | null = null;

/**
 * Initialize Drizzle ORM with an existing better-sqlite3 database connection
 *
 * @param sqliteDb - Existing better-sqlite3 database instance
 * @returns Drizzle database instance with type-safe query API
 *
 * @example
 * ```typescript
 * // In DatabaseManager.initialize()
 * const Database = require("better-sqlite3");
 * this.db = new Database(dbPath);
 *
 * // Initialize Drizzle with the same connection
 * const drizzleDb = initializeDrizzle(this.db);
 * ```
 */
export function initializeDrizzle(
  sqliteDb: Database.Database
): BetterSQLite3Database<typeof schema> {
  if (!drizzleInstance) {
    drizzleInstance = drizzle(sqliteDb, { schema });
    console.log("✅ Drizzle ORM initialized");
  }
  return drizzleInstance;
}

/**
 * Get the current Drizzle instance
 * Throws an error if Drizzle hasn't been initialized yet
 */
export function getDrizzle(): BetterSQLite3Database<typeof schema> {
  if (!drizzleInstance) {
    throw new Error(
      "Drizzle ORM not initialized. Call initializeDrizzle() first."
    );
  }
  return drizzleInstance;
}

/**
 * Reset Drizzle instance (useful for testing or reconnecting)
 */
export function resetDrizzle(): void {
  drizzleInstance = null;
}

// Re-export schema for convenience
export { schema };
export type DrizzleDB = BetterSQLite3Database<typeof schema>;
