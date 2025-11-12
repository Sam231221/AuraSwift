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

// Hash password and PIN
const PASSWORD_HASH = bcrypt.hashSync("Password123!", 10);
const ADMIN_PIN = bcrypt.hashSync("1234", 10);
const MANAGER_PIN = bcrypt.hashSync("5678", 10);
const CASHIER_PIN = bcrypt.hashSync("9999", 10);

try {
  // Start transaction
  db.prepare("BEGIN").run();

  console.log("\n🏪 Creating default business...");

  // Create Default Business
  db.prepare(
    `
    INSERT INTO businesses (id, name, ownerId, address, phone, vatNumber, createdAt, updatedAt) 
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `
  ).run(
    "default-business-001",
    "Demo Store",
    "default-admin-001",
    "123 Main Street, Downtown",
    "+1 (555) 123-4567",
    "VAT-123456789"
  );

  console.log("✅ Business created: Demo Store");

  console.log("\n👥 Creating default users...");

  // Create Admin User
  db.prepare(
    `
    INSERT INTO users (
      id, username, email, password, pin, 
      firstName, lastName, businessName, role, 
      businessId, permissions, 
      createdAt, updatedAt, isActive, address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?)
  `
  ).run(
    "default-admin-001",
    "admin",
    "admin@store.com",
    PASSWORD_HASH,
    ADMIN_PIN,
    "System",
    "Administrator",
    "Demo Store",
    "admin",
    "default-business-001",
    JSON.stringify(["all"]),
    1,
    ""
  );

  console.log("✅ Admin user created");
  console.log("   Username: admin");
  console.log("   Email: admin@store.com");
  console.log("   PIN: 1234");
  console.log("   Password: Password123!");

  // Create Manager User
  db.prepare(
    `
    INSERT INTO users (
      id, username, email, password, pin, 
      firstName, lastName, businessName, role, 
      businessId, permissions, 
      createdAt, updatedAt, isActive, address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?)
  `
  ).run(
    "default-manager-001",
    "manager",
    "manager@store.com",
    PASSWORD_HASH,
    MANAGER_PIN,
    "Store",
    "Manager",
    "Demo Store",
    "manager",
    "default-business-001",
    JSON.stringify([
      "manage_users",
      "manage_products",
      "manage_inventory",
      "view_reports",
      "manage_shifts",
      "approve_refunds",
      "manage_discounts",
    ]),
    1,
    ""
  );

  console.log("✅ Manager user created");
  console.log("   Username: manager");
  console.log("   Email: manager@store.com");
  console.log("   PIN: 5678");
  console.log("   Password: Password123!");

  // Create Cashier User
  db.prepare(
    `
    INSERT INTO users (
      id, username, email, password, pin, 
      firstName, lastName, businessName, role, 
      businessId, permissions, 
      createdAt, updatedAt, isActive, address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?)
  `
  ).run(
    "default-cashier-001",
    "cashier",
    "cashier@store.com",
    PASSWORD_HASH,
    CASHIER_PIN,
    "Demo",
    "Cashier",
    "Demo Store",
    "cashier",
    "default-business-001",
    JSON.stringify([
      "create_transaction",
      "process_payment",
      "clock_in",
      "clock_out",
      "view_products",
    ]),
    1,
    ""
  );

  console.log("✅ Cashier user created");
  console.log("   Username: cashier");
  console.log("   Email: cashier@store.com");
  console.log("   PIN: 9999");
  console.log("   Password: Password123!");

  console.log("\n⚙️  Creating default app settings...");

  // Create Default App Settings
  const settings = [
    ["first_time_setup_complete", "true"],
    ["default_currency", "USD"],
    ["tax_rate", "0.0"],
    ["receipt_footer", "Thank you for shopping with us!"],
  ];

  const settingsStmt = db.prepare(`
    INSERT INTO app_settings (key, value, createdAt, updatedAt) 
    VALUES (?, ?, datetime('now'), datetime('now'))
  `);

  for (const [key, value] of settings) {
    settingsStmt.run(key, value);
  }

  console.log("✅ App settings created");

  // Commit transaction
  db.prepare("COMMIT").run();

  console.log("\n✨ Database seeded successfully!");
  console.log("\n📋 Summary:");
  console.log("   • 1 Business (Demo Store)");
  console.log("   • 3 Users (Admin, Manager, Cashier)");
  console.log("   • 4 App Settings");
  console.log("\n🔐 Login Credentials:");
  console.log("   All users: Password123!");
  console.log("   Admin PIN: 1234");
  console.log("   Manager PIN: 5678");
  console.log("   Cashier PIN: 9999");
} catch (error) {
  // Rollback on error
  db.prepare("ROLLBACK").run();
  console.error("\n❌ Error seeding database:", error);
  process.exit(1);
} finally {
  db.close();
}
