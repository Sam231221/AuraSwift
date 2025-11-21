/**
 * Database setup utilities for integration tests
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@app/main/database/schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join } from 'path';
import { existsSync, unlinkSync } from 'node:fs';

let testDB: Database.Database | null = null;
let testDrizzle: ReturnType<typeof drizzle> | null = null;

/**
 * Setup test database
 */
export async function setupTestDB(dbPath?: string): Promise<ReturnType<typeof drizzle>> {
  const dbFilePath = dbPath || join(process.cwd(), 'data', 'test-pos_system.db');
  
  // Remove existing test database if it exists
  if (existsSync(dbFilePath)) {
    unlinkSync(dbFilePath);
  }

  // Create new database
  testDB = new Database(dbFilePath);
  testDrizzle = drizzle(testDB, { schema });

  // Run migrations
  const migrationsPath = join(process.cwd(), 'packages', 'main', 'src', 'database', 'migrations');
  migrate(testDrizzle, { migrationsFolder: migrationsPath });

  return testDrizzle;
}

/**
 * Teardown test database
 */
export async function teardownTestDB(drizzle?: ReturnType<typeof drizzle>): Promise<void> {
  if (drizzle && testDB) {
    testDB.close();
    testDB = null;
    testDrizzle = null;
  }
}

/**
 * Clean test database (remove all data but keep structure)
 */
export async function cleanTestDB(drizzle: ReturnType<typeof drizzle>): Promise<void> {
  // Delete all data from tables (in reverse order of dependencies)
  const tables = [
    'transactionItems',
    'transactions',
    'cartItems',
    'cartSessions',
    'stockMovements',
    'stockAdjustments',
    'batches',
    'products',
    'categories',
    'users',
    'shifts',
    'sessions',
    // Add other tables as needed
  ];

  for (const table of tables) {
    await drizzle.execute(`DELETE FROM ${table}`);
  }
}

/**
 * Get test database instance
 */
export function getTestDB(): ReturnType<typeof drizzle> | null {
  return testDrizzle;
}

