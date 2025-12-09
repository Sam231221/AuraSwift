/**
 * Basic Data Generator
 * Generates essential system data: business, terminal, roles, and default users
 * Previously ran automatically on app start - now manual
 */
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { PERMISSIONS } from "@app/shared/constants/permissions";
import { getLogger } from "../logger.js";

const logger = getLogger("basic-data-generator");

// Permission groups for seeding default roles
const PERMISSION_GROUPS = {
  /** All permissions - for admin/owner role */
  ADMIN: [PERMISSIONS.ALL],
  /** Manager permissions */
  MANAGER: [
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_WRITE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.TRANSACTIONS_OVERRIDE,
  ],
  /** Cashier permissions */
  CASHIER: [PERMISSIONS.SALES_READ, PERMISSIONS.SALES_WRITE],
} as const;

export interface BasicDataResult {
  businessId: string;
  terminalId: string;
  roleIds: {
    admin: string;
    manager: string;
    cashier: string;
  };
  userIds: {
    admin: string;
    manager: string;
    cashier: string;
  };
}

export class BasicDataGenerator {
  /**
   * Check if basic data already exists
   */
  static async hasBasicData(
    db: BetterSQLite3Database,
    schema: any
  ): Promise<boolean> {
    try {
      const businesses = db.select().from(schema.businesses).all();
      return businesses.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Seed basic system data (business, terminal, roles, users)
   * This is the essential data needed for the app to function
   */
  static async seedBasicData(
    db: BetterSQLite3Database,
    schema: any,
    skipIfExists: boolean = true
  ): Promise<BasicDataResult> {
    logger.info("🌱 Starting basic data seeding...");

    // Check if data already exists
    if (skipIfExists && (await this.hasBasicData(db, schema))) {
      logger.info("✅ Basic data already exists, skipping...");
      const business = db.select().from(schema.businesses).limit(1).all()[0];
      const terminal = db.select().from(schema.terminals).limit(1).all()[0];
      const roles = db.select().from(schema.roles).all();
      const users = db.select().from(schema.users).all();

      return {
        businessId: business.id,
        terminalId: terminal.id,
        roleIds: {
          admin: roles.find((r: any) => r.name === "admin")?.id || "",
          manager: roles.find((r: any) => r.name === "manager")?.id || "",
          cashier: roles.find((r: any) => r.name === "cashier")?.id || "",
        },
        userIds: {
          admin: users.find((u: any) => u.username === "MrAdmin")?.id || "",
          manager: users.find((u: any) => u.username === "MrManager")?.id || "",
          cashier: users.find((u: any) => u.username === "MrCashier")?.id || "",
        },
      };
    }

    try {
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
            permissions: PERMISSION_GROUPS.ADMIN,
            isSystemRole: true,
            isActive: true,
            shiftRequired: false,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: managerRoleId,
            name: "manager",
            displayName: "Store Manager",
            description: "Manage inventory, users, and view reports",
            businessId: businessId,
            permissions: PERMISSION_GROUPS.MANAGER,
            isSystemRole: true,
            isActive: true,
            shiftRequired: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: cashierRoleId,
            name: "cashier",
            displayName: "Cashier",
            description: "Process sales transactions",
            businessId: businessId,
            permissions: PERMISSION_GROUPS.CASHIER,
            isSystemRole: true,
            isActive: true,
            shiftRequired: true,
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
            username: "MrAdmin",
            email: "mradmin@auraswift.com",
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
            username: "MrManager",
            email: "mrmanager@auraswift.com",
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
            username: "MrCashier",
            email: "mrcashier@auraswift.com",
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
        `   📊 Found ${verifyUserRoles.length} user_roles entries for admin user`
      );

      logger.info("\n✅ Basic data seeding completed successfully!");
      logger.info("\n📋 Default Accounts Created:");
      logger.info("   👨‍💼 Admin:");
      logger.info("      Username: MrAdmin");
      logger.info("      Password: admin123");
      logger.info("      PIN: 1234");
      logger.info("\n   👔 Manager:");
      logger.info("      Username: MrManager");
      logger.info("      Password: manager123");
      logger.info("      PIN: 1234");
      logger.info("\n   💳 Cashier:");
      logger.info("      Username: MrCashier");
      logger.info("      Password: cashier123");
      logger.info("      PIN: 1234");
      logger.info("\n   🖥️  Terminal: Main Counter");
      logger.info("");

      return {
        businessId,
        terminalId,
        roleIds: {
          admin: adminRoleId,
          manager: managerRoleId,
          cashier: cashierRoleId,
        },
        userIds: {
          admin: adminUserId,
          manager: managerUserId,
          cashier: cashierUserId,
        },
      };
    } catch (error) {
      logger.error("❌ Basic data seeding failed:", error);
      throw error;
    }
  }
}
