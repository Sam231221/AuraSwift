/**
 * Database Test Utilities
 *
 * Utilities for setting up and tearing down test databases.
 * Ensures each test has a clean database state.
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

// TODO: Import actual schema from your codebase
// import * as schema from '@app/main/database/schema';
const schema = {} as any; // Placeholder until actual schema is imported

const TEST_DB_PATH = join(process.cwd(), "test-db.sqlite");

/**
 * Create a fresh test database
 */
export async function createTestDatabase() {
  // Remove existing test database if it exists
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }

  // Create new SQLite database
  const sqlite = new Database(TEST_DB_PATH);
  const db = drizzle(sqlite, { schema });

  // Run migrations or create schema
  // TODO: Import and run migrations here
  // await migrate(db, { migrationsFolder: './packages/main/src/database/migrations' });

  return { db, sqlite };
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase() {
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }
}

/**
 * Seed test database with basic data
 */
export async function seedTestDatabase(db: any) {
  // TODO: Add seed data for tests
  // Example:
  // await db.insert(schema.users).values([...testUsers]);
  // await db.insert(schema.products).values([...testProducts]);
}

/**
 * Clear all data from test database
 */
export async function clearTestDatabase(db: any) {
  // Delete in order to respect foreign key constraints
  const tables = [
    "transaction_items",
    "transactions",
    "cart_items",
    "batches",
    "products",
    "categories",
    "users",
    // Add other tables as needed
  ];

  for (const table of tables) {
    try {
      await db.run(`DELETE FROM ${table}`);
    } catch (error) {
      // Table might not exist, ignore error
    }
  }
}

/**
 * Create in-memory test database (faster for unit tests)
 */
export function createInMemoryDatabase() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}
