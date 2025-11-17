/**
 * Seed Database Helper
 *
 * Call this from the main process after database initialization
 * to populate with default store and users.
 */

import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schemaType from "../schema/index.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getRawDatabase } from "./drizzle.js";
import type { Permission } from "./schema/common.js";

/**
 * Seed the database with default business and users
 * @param db - Drizzle database instance
 * @param schema - Database schema
 */
export async function seedDefaultData(
  db: BetterSQLite3Database<typeof schemaType>,
  schema: typeof schemaType
): Promise<void> {
  const { businesses, users, appSettings, vatCategories } = schema;

  try {
    console.log("\n🌱 Checking if seed data is needed...");

    // Check if any users exist
    const existingUsers = db.select().from(users).limit(1).all();

    if (existingUsers.length > 0) {
      console.log("⏭️  Database already seeded, skipping...");
      return;
    }

    console.log("📦 Seeding database with default data...");

    // Get raw database for transaction support
    const rawDb = getRawDatabase(db);

    // Start transaction for atomic seeding
    rawDb.prepare("BEGIN").run();

    try {
      // Generate salt and hash password and PINs
      const SALT = await bcrypt.genSalt(10);
      const PASSWORD_HASH = await bcrypt.hash("Password123!", SALT);
      const ADMIN_PIN_HASH = await bcrypt.hash("1234", SALT);
      const MANAGER_PIN_HASH = await bcrypt.hash("5678", SALT);
      const CASHIER_PIN_HASH = await bcrypt.hash("9999", SALT);

      // Use Date objects - Drizzle will convert to timestamp_ms automatically
      const now = new Date();
      const businessId = "default-business-001";
      const adminId = "default-admin-001";

      // 1. Create Default Business with temp ownerId
      console.log("🏪 Creating default business...");
      db.insert(businesses)
        .values({
          id: businessId,
          name: "Demo Store",
          ownerId: "temp-owner", // temp value, will update after admin user is created
          address: "123 Main Street, Downtown",
          phone: "+1 (555) 123-4567",
          vatNumber: "VAT-123456789",
          createdAt: now,
          updatedAt: now,
        })
        .run();
      console.log("✅ Business created: Demo Store");

      // 2. Create Admin User with businessId
      console.log("\n👥 Creating default users...");
      const adminPermissions: Permission[] = [
        "manage:users",
        "manage:inventory",
        "manage:settings",
        "read:sales",
        "write:sales",
        "read:reports",
        "view:analytics",
        "override:transactions",
      ];

      db.insert(users)
        .values({
          id: adminId,
          username: "admin",
          email: "admin@store.com",
          passwordHash: PASSWORD_HASH,
          pinHash: ADMIN_PIN_HASH,
          salt: SALT,
          firstName: "System",
          lastName: "Administrator",
          businessName: "Demo Store",
          role: "admin",
          businessId: businessId,
          permissions: adminPermissions,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          address: "",
        })
        .run();
      console.log("✅ Admin user created");
      console.log("   Username: admin");
      console.log("   Email: admin@store.com");
      console.log("   PIN: 1234");

      // 3. Update Business to set correct ownerId
      db.update(businesses)
        .set({ ownerId: adminId })
        .where(eq(businesses.id, businessId))
        .run();

      // 4. Create Manager User
      const managerPermissions: Permission[] = [
        "manage:users",
        "manage:inventory",
        "read:sales",
        "write:sales",
        "read:reports",
        "override:transactions",
      ];

      db.insert(users)
        .values({
          id: "default-manager-001",
          username: "manager",
          email: "manager@store.com",
          passwordHash: PASSWORD_HASH,
          pinHash: MANAGER_PIN_HASH,
          salt: SALT,
          firstName: "Store",
          lastName: "Manager",
          businessName: "Demo Store",
          role: "manager",
          businessId: businessId,
          permissions: managerPermissions,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          address: "",
        })
        .run();
      console.log("✅ Manager user created");
      console.log("   Username: manager");
      console.log("   Email: manager@store.com");
      console.log("   PIN: 5678");

      // 5. Create Cashier User
      const cashierPermissions: Permission[] = ["read:sales", "write:sales"];

      db.insert(users)
        .values({
          id: "default-cashier-001",
          username: "cashier",
          email: "cashier@store.com",
          passwordHash: PASSWORD_HASH,
          pinHash: CASHIER_PIN_HASH,
          salt: SALT,
          firstName: "Demo",
          lastName: "Cashier",
          businessName: "Demo Store",
          role: "cashier",
          businessId: businessId,
          permissions: cashierPermissions,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          address: "",
        })
        .run();

      console.log("✅ Cashier user created");
      console.log("   Username: cashier");
      console.log("   Email: cashier@store.com");
      console.log("   PIN: 9999");

      // 6. Create Default VAT Categories
      console.log("\n💸 Creating default VAT categories...");
      const defaultVatCategories = [
        {
          id: "vat-standard",
          name: "Standard VAT",
          ratePercent: 20.0,
          code: "STD",
          description: "Standard VAT rate",
          businessId: businessId,
          isDefault: true,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "vat-reduced",
          name: "Reduced VAT",
          ratePercent: 5.0,
          code: "RED",
          description: "Reduced VAT rate",
          businessId: businessId,
          isDefault: false,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "vat-zero",
          name: "Zero VAT",
          ratePercent: 0.0,
          code: "ZERO",
          description: "Zero VAT rate",
          businessId: businessId,
          isDefault: false,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "vat-exempt",
          name: "Exempt VAT",
          ratePercent: 0.0,
          code: "EXEMPT",
          description: "VAT Exempt",
          businessId: businessId,
          isDefault: false,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ];
      for (const vat of defaultVatCategories) {
        db.insert(vatCategories).values(vat).run();
      }
      console.log("✅ Default VAT categories created");

      // Create Default App Settings
      console.log("\n⚙️  Creating default app settings...");
      const settings = [
        { key: "first_time_setup_complete", value: "true" },
        { key: "default_currency", value: "USD" },
        { key: "tax_rate", value: "0.0" },
        { key: "receipt_footer", value: "Thank you for shopping with us!" },
      ];

      for (const setting of settings) {
        db.insert(appSettings)
          .values({
            key: setting.key,
            value: setting.value,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
      console.log("✅ App settings created");

      // Commit transaction
      rawDb.prepare("COMMIT").run();

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
      console.log("   Cashier PIN: 9999\n");
    } catch (error) {
      // Rollback on error
      try {
        rawDb.prepare("ROLLBACK").run();
      } catch (rollbackError) {
        // Ignore rollback errors (transaction might not have been started)
        console.warn(
          "⚠️  Warning: Failed to rollback transaction:",
          rollbackError
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    throw error;
  }
}
