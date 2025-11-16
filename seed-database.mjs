/**
 * Seed Database with Default Store and Users
 *
 * Creates:
 * - 1 Default Business (Demo Store)
 * - 3 Users with different roles (Admin, Manager, Cashier)
 *
 * Usage: node seed-database.mjs
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import bcrypt from "bcryptjs";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine database path (same logic as db-manager.ts)
const isDev = process.env.NODE_ENV !== "production";
const dbPath = isDev
  ? path.join(__dirname, "data", "pos_system.db")
  : path.join(
      process.env.HOME || "",
      "Library",
      "Application Support",
      "AuraSwift",
      "pos_system.db"
    );

console.log("📦 Seeding database at:", dbPath);

const Database = require("better-sqlite3");
const db = new Database(dbPath);

// Generate salt and hash password and PINs
const SALT = bcrypt.genSaltSync(10);
const PASSWORD_HASH = bcrypt.hashSync("Password123!", SALT);
const ADMIN_PIN_HASH = bcrypt.hashSync("1234", SALT);
const MANAGER_PIN_HASH = bcrypt.hashSync("5678", SALT);
const CASHIER_PIN_HASH = bcrypt.hashSync("9999", SALT);

console.log("[DEBUG] Starting database seed script");
try {
  console.log("\n🌱 Checking if seed data is needed...");

  console.log("[DEBUG] Checking if any users exist");
  // Check if any users exist
  const existingUsers = db.prepare("SELECT COUNT(*) as count FROM users").get();

  console.log("[DEBUG] Users found:", existingUsers.count);
  if (existingUsers.count > 0) {
    console.log("⏭️  Database already seeded, skipping...");
    db.close();
    process.exit(0);
  }

  console.log("📦 Seeding database with default data...");

  console.log("[DEBUG] Disabling foreign key constraints");
  // Disable foreign key constraints temporarily
  db.prepare("PRAGMA foreign_keys = OFF").run();

  console.log("[DEBUG] Starting transaction");
  // Start transaction
  db.prepare("BEGIN").run();

  console.log("\n🏪 Creating default business with temp ownerId...");

  const now = new Date();
  const nowTs = now.getTime();
  console.log("[DEBUG] Timestamp for seed:", now);

  console.log("[DEBUG] Creating default business");
  // Create Default Business with temp ownerId
  db.prepare(
    `
    INSERT INTO businesses (id, name, ownerId, address, phone, vatNumber, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "default-business-001",
    "Demo Store",
    "temp-owner",
    "123 Main Street, Downtown",
    "+1 (555) 123-4567",
    "VAT-123456789",
    nowTs,
    nowTs
  );

  console.log("✅ Business created: Demo Store");
  console.log("\n👥 Creating default users...");

  console.log("[DEBUG] Creating admin user");
  // Create Admin User
  db.prepare(
    `
    INSERT INTO users (
      id, username, email, password_hash, pin_hash, salt,
      firstName, lastName, businessName, role, 
      businessId, permissions, 
      isActive, address, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "default-admin-001",
    "admin",
    "admin@store.com",
    PASSWORD_HASH,
    ADMIN_PIN_HASH,
    SALT,
    "System",
    "Administrator",
    "Demo Store",
    "admin",
    "default-business-001",
    JSON.stringify([
      "manage:users",
      "manage:inventory",
      "manage:settings",
      "read:sales",
      "write:sales",
      "read:reports",
      "view:analytics",
      "override:transactions",
    ]),
    1,
    "",
    nowTs,
    nowTs
  );

  console.log("✅ Admin user created");
  console.log("   Username: admin");
  console.log("   Email: admin@store.com");
  console.log("   PIN: 1234");
  console.log("   Password: Password123!");

  console.log("[DEBUG] Updating business ownerId");
  // Update Business to set correct ownerId
  db.prepare(
    `
    UPDATE businesses 
    SET ownerId = ? 
    WHERE id = ?
  `
  ).run("default-admin-001", "default-business-001");

  console.log("[DEBUG] Creating manager user");
  // Create Manager User
  db.prepare(
    `
    INSERT INTO users (
      id, username, email, password_hash, pin_hash, salt,
      firstName, lastName, businessName, role, 
      businessId, permissions, 
      isActive, address, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "default-manager-001",
    "manager",
    "manager@store.com",
    PASSWORD_HASH,
    MANAGER_PIN_HASH,
    SALT,
    "Store",
    "Manager",
    "Demo Store",
    "manager",
    "default-business-001",
    JSON.stringify([
      "manage:users",
      "manage:inventory",
      "read:sales",
      "write:sales",
      "read:reports",
      "override:transactions",
    ]),
    1,
    "",
    nowTs,
    nowTs
  );

  console.log("✅ Manager user created");
  console.log("   Username: manager");
  console.log("   Email: manager@store.com");
  console.log("   PIN: 5678");
  console.log("   Password: Password123!");

  console.log("[DEBUG] Creating cashier user");
  // Create Cashier User
  db.prepare(
    `
    INSERT INTO users (
      id, username, email, password_hash, pin_hash, salt,
      firstName, lastName, businessName, role, 
      businessId, permissions, 
      isActive, address, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    "default-cashier-001",
    "cashier",
    "cashier@store.com",
    PASSWORD_HASH,
    CASHIER_PIN_HASH,
    SALT,
    "Demo",
    "Cashier",
    "Demo Store",
    "cashier",
    "default-business-001",
    JSON.stringify(["read:sales", "write:sales"]),
    1,
    "",
    nowTs,
    nowTs
  );

  console.log("✅ Cashier user created");
  console.log("   Username: cashier");
  console.log("   Email: cashier@store.com");
  console.log("   PIN: 9999");
  console.log("   Password: Password123!");

  console.log("[DEBUG] Creating default VAT categories");
  // 6. Create Default VAT Categories
  console.log("\n💸 Creating default VAT categories...");
  const vatCategoryStmt = db.prepare(`
    INSERT INTO vat_categories (
      id, name, rate_percent, code, description, 
      business_id, is_default, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultVatCategories = [
    [
      "vat-standard",
      "Standard VAT",
      20.0,
      "STD",
      "Standard VAT rate",
      "default-business-001",
      1,
      1,
      nowTs,
      nowTs,
    ],
    [
      "vat-reduced",
      "Reduced VAT",
      5.0,
      "RED",
      "Reduced VAT rate",
      "default-business-001",
      0,
      1,
      nowTs,
      nowTs,
    ],
    [
      "vat-zero",
      "Zero VAT",
      0.0,
      "ZERO",
      "Zero VAT rate",
      "default-business-001",
      0,
      1,
      nowTs,
      nowTs,
    ],
    [
      "vat-exempt",
      "Exempt VAT",
      0.0,
      "EXEMPT",
      "VAT Exempt",
      "default-business-001",
      0,
      1,
      nowTs,
      nowTs,
    ],
  ];

  for (const vat of defaultVatCategories) {
    console.log("[DEBUG] Inserting VAT category:", vat[0]);
    vatCategoryStmt.run(...vat);
  }

  console.log("✅ Default VAT categories created");

  console.log("\n⚙️  Creating default app settings...");

  console.log("[DEBUG] Creating default app settings");
  // Create Default App Settings
  const settings = [
    ["first_time_setup_complete", "true"],
    ["default_currency", "USD"],
    ["tax_rate", "0.0"],
    ["receipt_footer", "Thank you for shopping with us!"],
  ];

  const settingsStmt = db.prepare(`
    INSERT INTO app_settings (key, value, created_at, updated_at) 
    VALUES (?, ?, ?, ?)
  `);

  for (const [key, value] of settings) {
    console.log("[DEBUG] Inserting app setting:", key);
    settingsStmt.run(key, value, nowTs, nowTs);
  }

  console.log("✅ App settings created");

  console.log("[DEBUG] Committing transaction");
  // Commit transaction
  db.prepare("COMMIT").run();

  console.log("[DEBUG] Re-enabling foreign key constraints");
  // Re-enable foreign key constraints
  db.prepare("PRAGMA foreign_keys = ON").run();

  console.log("\n✨ Database seeded successfully!");
  console.log("\n📋 Summary:");
  console.log("   • 1 Business (Demo Store)");
  console.log("   • 3 Users (Admin, Manager, Cashier)");
  console.log("   • 4 VAT Categories (Standard, Reduced, Zero, Exempt)");
  console.log("   • 4 App Settings");
  console.log("\n🔐 Login Credentials:");
  console.log("   All users: Password123!");
  console.log("   Admin PIN: 1234");
  console.log("   Manager PIN: 5678");
  console.log("   Cashier PIN: 9999");
} catch (error) {
  // Rollback on error (if transaction was started)
  try {
    db.prepare("ROLLBACK").run();
  } catch (rollbackError) {
    // Ignore rollback errors (transaction might not have been started)
  }
  console.error("\n❌ Error seeding database:", error);
  process.exit(1);
} finally {
  try {
    db.close();
  } catch (closeError) {
    // Ignore close errors (database might already be closed)
  }
}
