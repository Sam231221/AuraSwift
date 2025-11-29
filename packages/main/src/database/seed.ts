/**
 * Database Seeding
 * Seeds default data for new database installations
 */

import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { PERMISSION_GROUPS } from "../constants/permissions.js";

import { getLogger } from "../utils/logger.js";
const logger = getLogger("seed");

export async function seedDefaultData(
  db: BetterSQLite3Database,
  schema: any
): Promise<void> {
  logger.info("🌱 Starting database seeding...");

  try {
    // Check if data already exists
    let existingBusinesses;
    try {
      existingBusinesses = db.select().from(schema.businesses).all();
    } catch (error) {
      // Table might not exist yet, continue with seeding
      existingBusinesses = [];
    }

    if (existingBusinesses.length > 0) {
      logger.info("✅ Database already seeded, skipping...");
      return;
    }

    const now = new Date();
    const businessId = uuidv4();
    const ownerId = uuidv4();

    // 1. Create default business
    logger.info("   📦 Creating default business...");
    db.insert(schema.businesses)
      .values({
        id: businessId,
        firstName: "Admin",
        lastName: "User",
        businessName: "AuraSwift Demo Store",
        ownerId: ownerId,
        email: "admin@auraswift.com",
        phone: "+1234567890",
        website: "https://auraswift.com",
        address: "123 Main Street",
        country: "United States",
        city: "New York",
        postalCode: "10001",
        vatNumber: "",
        businessType: "retail",
        currency: "USD",
        timezone: "America/New_York",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    // 2. Create default terminal
    logger.info("   🖥️  Creating default terminal...");
    const terminalId = uuidv4();
    db.insert(schema.terminals)
      .values({
        id: terminalId,
        business_id: businessId,
        name: "Main Counter",
        type: "pos",
        status: "active",
        device_token: uuidv4(),
        ip_address: "127.0.0.1",
        mac_address: null,
        settings: JSON.stringify({
          printer: { enabled: false },
          scanner: { enabled: false },
          scale: { enabled: false },
        }),
        last_active_at: now,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    // 3. Create default roles
    logger.info("   👔 Creating default roles...");
    const adminRoleId = uuidv4();
    const managerRoleId = uuidv4();
    const cashierRoleId = uuidv4();

    db.insert(schema.roles)
      .values([
        {
          id: adminRoleId,
          name: "admin",
          displayName: "Administrator",
          description: "Full system access with all permissions",
          businessId: businessId,
          permissions: JSON.stringify(PERMISSION_GROUPS.ADMIN),
          isSystemRole: true,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: managerRoleId,
          name: "manager",
          displayName: "Store Manager",
          description: "Manage inventory, users, and view reports",
          businessId: businessId,
          permissions: JSON.stringify(PERMISSION_GROUPS.MANAGER),
          isSystemRole: true,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: cashierRoleId,
          name: "cashier",
          displayName: "Cashier",
          description: "Process sales transactions",
          businessId: businessId,
          permissions: JSON.stringify(PERMISSION_GROUPS.CASHIER),
          isSystemRole: true,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .run();

    // 4. Create default users
    logger.info("   👤 Creating default users...");

    // Generate password hashes
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash("admin123", salt);
    const managerPasswordHash = await bcrypt.hash("manager123", salt);
    const cashierPasswordHash = await bcrypt.hash("cashier123", salt);

    // Generate PIN hashes (default PIN: 1234 for all)
    const defaultPin = "1234";
    const pinHash = await bcrypt.hash(defaultPin, salt);

    const adminUserId = ownerId; // Owner is the admin user
    const managerUserId = uuidv4();
    const cashierUserId = uuidv4();

    db.insert(schema.users)
      .values([
        {
          id: adminUserId,
          username: "admin",
          email: "admin@auraswift.com",
          passwordHash: adminPasswordHash,
          pinHash: pinHash,
          salt: salt,
          firstName: "Admin",
          lastName: "User",
          businessName: "AuraSwift Demo Store",
          businessId: businessId,
          primaryRoleId: adminRoleId,
          shiftRequired: false,
          activeRoleContext: null,
          isActive: true,
          address: "",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: managerUserId,
          username: "manager",
          email: "manager@auraswift.com",
          passwordHash: managerPasswordHash,
          pinHash: pinHash,
          salt: salt,
          firstName: "Store",
          lastName: "Manager",
          businessName: "AuraSwift Demo Store",
          businessId: businessId,
          primaryRoleId: managerRoleId,
          shiftRequired: true,
          activeRoleContext: null,
          isActive: true,
          address: "",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: cashierUserId,
          username: "cashier",
          email: "cashier@auraswift.com",
          passwordHash: cashierPasswordHash,
          pinHash: pinHash,
          salt: salt,
          firstName: "John",
          lastName: "Cashier",
          businessName: "AuraSwift Demo Store",
          businessId: businessId,
          primaryRoleId: cashierRoleId,
          shiftRequired: true,
          activeRoleContext: null,
          isActive: true,
          address: "",
          createdAt: now,
          updatedAt: now,
        },
      ])
      .run();

    // 5. Assign roles to users
    logger.info("   🔗 Assigning roles to users...");
    const adminUserRoleId = uuidv4();
    const managerUserRoleId = uuidv4();
    const cashierUserRoleId = uuidv4();

    db.insert(schema.userRoles)
      .values([
        {
          id: adminUserRoleId,
          userId: adminUserId,
          roleId: adminRoleId,
          assignedBy: adminUserId,
          assignedAt: now,
          expiresAt: null,
          isActive: true,
        },
        {
          id: managerUserRoleId,
          userId: managerUserId,
          roleId: managerRoleId,
          assignedBy: adminUserId,
          assignedAt: now,
          expiresAt: null,
          isActive: true,
        },
        {
          id: cashierUserRoleId,
          userId: cashierUserId,
          roleId: cashierRoleId,
          assignedBy: adminUserId,
          assignedAt: now,
          expiresAt: null,
          isActive: true,
        },
      ])
      .run();

    // Verify user_roles were created
    logger.info("   ✅ Verifying user_roles creation...");
    const verifyUserRoles = db
      .select()
      .from(schema.userRoles)
      .where(eq(schema.userRoles.userId, adminUserId))
      .all();
    logger.info(
      `   📊 Found ${verifyUserRoles.length} user_roles entries for admin user (${adminUserId})`
    );
    if (verifyUserRoles.length > 0) {
      logger.info(
        "   📋 Admin user_roles details:",
        JSON.stringify(
          verifyUserRoles.map((r) => ({
            id: r.id,
            userId: r.userId,
            roleId: r.roleId,
            isActive: r.isActive,
          })),
          null,
          2
        )
      );
    }

    logger.info("✅ Database seeding completed successfully!");
    logger.info("\n📋 Default Accounts Created:");
    logger.info("   👨‍💼 Admin:");
    logger.info("      Username: admin");
    logger.info("      Password: admin123");
    logger.info("      PIN: 1234");
    logger.info("\n   👔 Manager:");
    logger.info("      Username: manager");
    logger.info("      Password: manager123");
    logger.info("      PIN: 1234");
    logger.info("\n   💳 Cashier:");
    logger.info("      Username: cashier");
    logger.info("      Password: cashier123");
    logger.info("      PIN: 1234");
    logger.info("\n   🖥️  Terminal: Main Counter");
    logger.info("");
  } catch (error) {
    logger.error("❌ Database seeding failed:", error);
    throw error;
  }
}
