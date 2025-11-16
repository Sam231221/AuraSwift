/**
 * Seed Database Helper
 *
 * Call this from the main process after database initialization
 * to populate with default store and users.
 */

import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

/**
 * Seed the database with default business and users
 * @param {any} db - Drizzle database instance
 * @param {any} schema - Database schema
 */
export async function seedDefaultData(db: any, schema: any) {
  const { businesses, users, appSettings, vatCategories } = schema;

  try {
    console.log("\n🌱 Checking if seed data is needed...");

    // Check if any users exist
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length > 0) {
      console.log("⏭️  Database already seeded, skipping...");
      return;
    }

    console.log("📦 Seeding database with default data...");

    // Generate salt and hash password and PINs
    const SALT = await bcrypt.genSalt(10);
    const PASSWORD_HASH = await bcrypt.hash("Password123!", SALT);
    const ADMIN_PIN_HASH = await bcrypt.hash("1234", SALT);
    const MANAGER_PIN_HASH = await bcrypt.hash("5678", SALT);
    const CASHIER_PIN_HASH = await bcrypt.hash("9999", SALT);

    const now = new Date().toISOString();
    const businessId = "default-business-001";
    const adminId = "default-admin-001";

    // 1. Create Default Business with temp ownerId
    console.log("🏪 Creating default business...");
    await db.insert(businesses).values({
      id: businessId,
      name: "Demo Store",
      ownerId: "temp-owner", // temp value, will update after admin user is created
      address: "123 Main Street, Downtown",
      phone: "+1 (555) 123-4567",
      vatNumber: "VAT-123456789",
      createdAt: now,
      updatedAt: now,
    });
    console.log("✅ Business created: Demo Store");

    // 2. Create Admin User with businessId
    console.log("\n👥 Creating default users...");
    await db.insert(users).values({
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
      permissions: JSON.stringify(["all"]),
      createdAt: now,
      updatedAt: now,
      isActive: true,
      address: "",
    });
    console.log("✅ Admin user created");
    console.log("   Username: admin");
    console.log("   Email: admin@store.com");
    console.log("   PIN: 1234");

    // 3. Update Business to set correct ownerId
    await db
      .update(businesses)
      .set({ ownerId: adminId })
      .where(businesses.id.eq(businessId));

    // 4. Create Manager User
    await db.insert(users).values({
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
      permissions: JSON.stringify([
        "manage_users",
        "manage_products",
        "manage_inventory",
        "view_reports",
        "manage_shifts",
        "approve_refunds",
        "manage_discounts",
      ]),
      createdAt: now,
      updatedAt: now,
      isActive: true,
      address: "",
    });
    console.log("✅ Manager user created");
    console.log("   Username: manager");
    console.log("   Email: manager@store.com");
    console.log("   PIN: 5678");

    // 5. Create Cashier User
    await db.insert(users).values({
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
      permissions: JSON.stringify([
        "create_transaction",
        "process_payment",
        "clock_in",
        "clock_out",
        "view_products",
      ]),
      createdAt: now,
      updatedAt: now,
      isActive: true,
      address: "",
    });

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
      await db.insert(vatCategories).values(vat);
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
      await db.insert(appSettings).values({
        key: setting.key,
        value: setting.value,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log("✅ App settings created");

    console.log("\n✨ Database seeded successfully!");
    console.log("\n📋 Summary:");
    console.log("   • 1 Business (Demo Store)");
    console.log("   • 3 Users (Admin, Manager, Cashier)");
    console.log("   • 4 App Settings");
    console.log("\n🔐 Login Credentials:");
    console.log("   All users: Password123!");
    console.log("   Admin PIN: 1234");
    console.log("   Manager PIN: 5678");
    console.log("   Cashier PIN: 9999\n");
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    throw error;
  }
}
