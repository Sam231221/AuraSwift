/**
 * Database Migrations Registry
 *
 * This file defines all database migrations for AuraSwift.
 * Migrations are tracked using SQLite's PRAGMA user_version.
 *
 * IMPORTANT:
 * - The base schema is created by initializeTables() in db-manager.ts
 * - Version 0 represents the baseline schema (all tables created)
 * - Historical migrations (v1: business fields, v2: discount fields) are
 *   already included in the baseline schema
 * - Future migrations start from version 1 onwards
 *
 * Migration Guidelines:
 * 1. Each migration must have a unique version number (sequential)
 * 2. Each migration must have an up() function that applies changes
 * 3. Never modify existing migrations - only add new ones
 * 4. Test migrations thoroughly before committing
 * 5. Migrations run automatically on app startup if needed
 *
 * To add a new migration:
 * 1. Add a new migration object to the MIGRATIONS array
 * 2. Increment the version number
 * 3. Implement the up() function with SQL changes
 * 4. Add clear name and description
 */

import type { Database } from "better-sqlite3";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export interface Migration {
  version: number;
  name: string;
  description: string;
  up: (db: Database) => void;
}

/**
 * All registered migrations
 *
 * Version 0 (implicit): Baseline schema created by initializeTables()
 * - All core tables (users, businesses, products, transactions, etc.)
 * - Historical fields already included (business address/phone/vat, discount fields)
 *
 * Future migrations will start from version 1
 */
export const MIGRATIONS: Migration[] = [
  // Add new migrations here...

  {
    version: 1,
    name: "0001_add_suppliers",
    description: "add suppliers",
    up: (db) => {
      // Check if changes already exist
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all()
        .map((t: any) => t.name);

      // Execute migration SQL
      try {
        db.exec(`
          CREATE TABLE \`suppliers\` (
          	\`id\` text PRIMARY KEY NOT NULL,
          	\`name\` text NOT NULL,
          	\`contactPerson\` text,
          	\`email\` text,
          	\`phone\` text,
          	\`address\` text,
          	\`city\` text,
          	\`country\` text,
          	\`taxId\` text,
          	\`paymentTerms\` text,
          	\`businessId\` text NOT NULL,
          	\`isActive\` integer DEFAULT true,
          	\`notes\` text,
          	\`createdAt\` text NOT NULL,
          	\`updatedAt\` text NOT NULL,
          	FOREIGN KEY (\`businessId\`) REFERENCES \`businesses\`(\`id\`) ON UPDATE no action ON DELETE no action
          );
          --> statement-breakpoint
          CREATE INDEX \`idx_suppliers_businessId\` ON \`suppliers\` (\`businessId\`);
          --> statement-breakpoint
          CREATE INDEX \`idx_suppliers_name\` ON \`suppliers\` (\`name\`);
          --> statement-breakpoint
          CREATE INDEX \`idx_suppliers_isActive\` ON \`suppliers\` (\`isActive\`);
        `);
        console.log(
          "      ✅ Migration '0001_add_suppliers.sql' applied successfully"
        );
      } catch (error: any) {
        if (error.message.includes("already exists")) {
          console.log(
            "      ℹ️  Migration '0001_add_suppliers.sql' - changes already exist"
          );
        } else {
          throw error;
        }
      }
    },
  },

  {
    version: 2,
    name: "0002_add_username_pin_auth",
    description: "Add username/PIN authentication columns to users table",
    up: (db) => {
      try {
        // Check if columns already exist
        const tableInfo = db
          .prepare("PRAGMA table_info(users)")
          .all() as Array<{
          name: string;
        }>;
        const columnNames = tableInfo.map((col) => col.name);

        const hasUsername = columnNames.includes("username");
        const hasPin = columnNames.includes("pin");

        if (!hasUsername) {
          console.log("      Adding 'username' column to users table...");
          db.exec(
            `ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT '';`
          );
        }

        if (!hasPin) {
          console.log("      Adding 'pin' column to users table...");
          db.exec(`ALTER TABLE users ADD COLUMN pin TEXT NOT NULL DEFAULT '';`);
        }

        // Create unique index on username if it doesn't exist
        const indexes = db
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='users'"
          )
          .all()
          .map((idx: any) => idx.name);

        if (!indexes.includes("users_username_unique")) {
          console.log("      Creating unique index on username...");
          db.exec(
            `CREATE UNIQUE INDEX users_username_unique ON users (username);`
          );
        }

        // Migrate existing users: set username from email and default PIN
        const usersNeedingMigration = db
          .prepare(
            "SELECT id, email, username FROM users WHERE username = '' OR username IS NULL"
          )
          .all() as Array<{ id: string; email: string; username: string }>;

        if (usersNeedingMigration.length > 0) {
          console.log(
            `      Migrating ${usersNeedingMigration.length} existing user(s)...`
          );
          const updateStmt = db.prepare(
            "UPDATE users SET username = ?, pin = ? WHERE id = ?"
          );

          for (const user of usersNeedingMigration) {
            // Generate username from email (before @ symbol) or use id
            const username = user.email
              ? user.email.split("@")[0]
              : `user_${user.id.substring(0, 8)}`;
            const pin = "1234"; // Default PIN

            updateStmt.run(username, pin, user.id);
            console.log(
              `         ✓ User ${user.id}: username set to '${username}'`
            );
          }
        }

        console.log(
          "      ✅ Migration '0002_add_username_pin_auth' applied successfully"
        );
      } catch (error: any) {
        if (
          error.message.includes("duplicate column name") ||
          error.message.includes("already exists")
        ) {
          console.log(
            "      ℹ️  Migration '0002_add_username_pin_auth' - changes already exist"
          );
        } else {
          throw error;
        }
      }
    },
  },

  {
    version: 3,
    name: "0003_create_demo_users",
    description:
      "Create default demo users (admin, john-manager, sarah-cashier, emma-cashier)",
    up: (db) => {
      try {
        // Check if demo users already exist
        const john = db
          .prepare("SELECT id FROM users WHERE username = ?")
          .get("john");
        const sarah = db
          .prepare("SELECT id FROM users WHERE username = ?")
          .get("sarah");
        const emma = db
          .prepare("SELECT id FROM users WHERE username = ?")
          .get("emma");

        // Get default business
        const defaultBusiness = db
          .prepare("SELECT id FROM businesses LIMIT 1")
          .get() as { id: string } | undefined;

        if (!defaultBusiness) {
          console.log(
            "      ℹ️  No business found, skipping demo users creation"
          );
          return;
        }

        const businessId = defaultBusiness.id;
        const bcrypt = require("bcryptjs");
        const { v4: uuidv4 } = require("uuid");
        const hashedPassword = bcrypt.hashSync("admin123", 10);
        const hashedPin = bcrypt.hashSync("1234", 10);
        const now = new Date().toISOString();

        let createdCount = 0;

        // Create john (manager) if doesn't exist
        if (!john) {
          const managerId = uuidv4();
          const managerPermissions = JSON.stringify([
            { action: "read", resource: "sales" },
            { action: "create", resource: "transactions" },
            { action: "void", resource: "transactions" },
            { action: "apply", resource: "discounts" },
            { action: "read", resource: "products" },
            { action: "update", resource: "inventory" },
            { action: "read", resource: "all_reports" },
            { action: "manage", resource: "staff_schedules" },
          ]);

          db.prepare(
            `INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive, address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            managerId,
            "john",
            hashedPin,
            "john@store.com",
            hashedPassword,
            "John",
            "Smith",
            "Default Store",
            "manager",
            businessId,
            managerPermissions,
            now,
            now,
            1,
            ""
          );
          createdCount++;
          console.log("         ✓ Created manager: john / PIN: 1234");
        }

        // Create sarah (cashier) if doesn't exist
        if (!sarah) {
          const cashierId1 = uuidv4();
          const cashierPermissions = JSON.stringify([
            { action: "read", resource: "sales" },
            { action: "create", resource: "transactions" },
            { action: "read", resource: "products" },
            { action: "read", resource: "basic_reports" },
          ]);

          db.prepare(
            `INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive, address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            cashierId1,
            "sarah",
            hashedPin,
            "sarah@store.com",
            hashedPassword,
            "Sarah",
            "Johnson",
            "Default Store",
            "cashier",
            businessId,
            cashierPermissions,
            now,
            now,
            1,
            ""
          );
          createdCount++;
          console.log("         ✓ Created cashier: sarah / PIN: 1234");
        }

        // Create emma (cashier) if doesn't exist
        if (!emma) {
          const cashierId2 = uuidv4();
          const cashierPermissions = JSON.stringify([
            { action: "read", resource: "sales" },
            { action: "create", resource: "transactions" },
            { action: "read", resource: "products" },
            { action: "read", resource: "basic_reports" },
          ]);

          db.prepare(
            `INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive, address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            cashierId2,
            "emma",
            hashedPin,
            "emma@store.com",
            hashedPassword,
            "Emma",
            "Davis",
            "Default Store",
            "cashier",
            businessId,
            cashierPermissions,
            now,
            now,
            1,
            ""
          );
          createdCount++;
          console.log("         ✓ Created cashier: emma / PIN: 1234");
        }

        if (createdCount > 0) {
          console.log(
            `      ✅ Migration '0003_create_demo_users' created ${createdCount} user(s)`
          );
        } else {
          console.log(
            "      ℹ️  Migration '0003_create_demo_users' - all demo users already exist"
          );
        }
      } catch (error: any) {
        console.error(
          "      ❌ Migration '0003_create_demo_users' failed:",
          error.message
        );
        throw error;
      }
    },
  },
];

/**
 * Get the latest migration version
 */
export function getLatestVersion(): number {
  if (MIGRATIONS.length === 0) {
    return 0; // Baseline version (schema created by initializeTables)
  }
  return Math.max(...MIGRATIONS.map((m) => m.version));
}

/**
 * Get all migrations that need to be applied
 */
export function getPendingMigrations(currentVersion: number): Migration[] {
  return MIGRATIONS.filter((m) => m.version > currentVersion).sort(
    (a, b) => a.version - b.version
  );
}

/**
 * Validate that migrations are sequential and well-formed
 */
export function validateMigrations(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (MIGRATIONS.length === 0) {
    return { valid: true, errors: [] };
  }

  // Check for duplicate versions
  const versions = MIGRATIONS.map((m) => m.version);
  const uniqueVersions = new Set(versions);
  if (versions.length !== uniqueVersions.size) {
    errors.push("Duplicate migration versions detected");
  }

  // Check that versions start from 1 (0 is implicit baseline)
  const minVersion = Math.min(...versions);
  if (minVersion < 1) {
    errors.push(
      "Migration versions must start from 1 (0 is reserved for baseline)"
    );
  }

  // Check for gaps in version numbers
  const sortedVersions = [...versions].sort((a, b) => a - b);
  for (let i = 0; i < sortedVersions.length - 1; i++) {
    if (sortedVersions[i + 1] - sortedVersions[i] > 1) {
      errors.push(
        `Gap in migration versions between ${sortedVersions[i]} and ${
          sortedVersions[i + 1]
        }`
      );
    }
  }

  // Check that all migrations have required fields
  for (const migration of MIGRATIONS) {
    if (
      !migration.version ||
      !migration.name ||
      !migration.description ||
      !migration.up
    ) {
      errors.push(
        `Migration version ${migration.version} is missing required fields`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
