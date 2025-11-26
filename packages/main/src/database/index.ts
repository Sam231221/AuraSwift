import { DBManager } from "./db-manager.js";
import { UserManager } from "./managers/userManager.js";
import { BusinessManager } from "./managers/businessManager.js";
import { SessionManager } from "./managers/sessionManager.js";
import { ProductManager } from "./managers/productManager.js";
import { CategoryManager } from "./managers/categoryManager.js";
import { InventoryManager } from "./managers/inventoryManager.js";
import { ScheduleManager } from "./managers/scheduleManager.js";
import { ShiftManager } from "./managers/shiftManager.js";
import { TransactionManager } from "./managers/transactionManager.js";
import { CashDrawerManager } from "./managers/cashDrawerManager.js";
import { ReportManager } from "./managers/reportManager.js";
import { AuditLogManager } from "./managers/auditLogManager.js";
import { DiscountManager } from "./managers/discountManager.js";

import { TimeTrackingManager } from "./managers/timeTrackingManager.js";
import { AuditManager } from "./managers/auditManager.js";
import { TimeTrackingReportManager } from "./managers/timeTrackingReportManager.js";
import { SettingsManager } from "./managers/settingsManager.js";
import { AgeVerificationManager } from "./managers/ageVerificationManager.js";
import { BatchManager } from "./managers/batchManager.js";
import { SupplierManager } from "./managers/supplierManager.js";
import { VatCategoryManager } from "./managers/vatCategoryManager.js";
import { ExpirySettingManager } from "./managers/expirySettingsManager.js";
import { ExpiryNotificationManager } from "./managers/expiryNotificationManager.js";
import { StockMovementManager } from "./managers/stockMovementManager.js";
import { CartManager } from "./managers/cartManager.js";
import { initializeDrizzle } from "./drizzle.js";
import { getDatabaseInfo } from "./utils/dbInfo.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import * as schema from "./schema.js";
import { seedDefaultData } from "./seed.js";

let dbManagerInstance: DBManager | null = null;
let managersInstance: DatabaseManagers | null = null;
let initializationPromise: Promise<DatabaseManagers> | null = null;

export interface DatabaseManagers {
  users: UserManager;
  businesses: BusinessManager;
  sessions: SessionManager;
  products: ProductManager;
  categories: CategoryManager;
  inventory: InventoryManager;
  schedules: ScheduleManager;
  shifts: ShiftManager;
  transactions: TransactionManager;
  cashDrawers: CashDrawerManager;
  reports: ReportManager;
  auditLogs: AuditLogManager;
  discounts: DiscountManager;

  timeTracking: TimeTrackingManager;
  audit: AuditManager;
  timeTrackingReports: TimeTrackingReportManager;
  settings: SettingsManager;
  ageVerification: AgeVerificationManager;
  batches: BatchManager;
  suppliers: SupplierManager;
  vatCategories: VatCategoryManager;
  expirySettings: ExpirySettingManager;
  expiryNotifications: ExpiryNotificationManager;
  stockMovements: StockMovementManager;
  cart: CartManager;

  getDatabaseInfo: () => {
    path: string;
    mode: "development" | "production";
    exists: boolean;
    size?: number;
  };

  emptyAllTables(): Promise<any>;
}
export async function getDatabase(): Promise<DatabaseManagers> {
  // Return existing instance if already initialized
  if (managersInstance) {
    return managersInstance;
  }

  // If initialization is in progress, wait for it to complete
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization and store the promise to prevent concurrent initializations
  initializationPromise = (async (): Promise<DatabaseManagers> => {
    // Initialize database
    dbManagerInstance = new DBManager();
    await dbManagerInstance.initialize();

    const db = dbManagerInstance.getDb();

    // Initialize Drizzle ORM
    const drizzle = initializeDrizzle(db);

    // Seed database with default data if needed
    try {
      await seedDefaultData(drizzle, schema);
    } catch (error) {
      // Provide detailed error context for seeding failures
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error("❌ Database seeding failed:");
      console.error(`   Error: ${errorMessage}`);
      if (errorStack) {
        console.error(`   Stack: ${errorStack}`);
      }
      console.error(
        "   ⚠️  Warning: Database may be partially initialized. Some default data may be missing."
      );
      console.error(
        "   💡 You may need to manually seed the database or restart the application."
      );

      // Don't throw - allow app to continue even if seeding fails
      // This is intentional for production resilience, but we log detailed context
    }

    const bcryptWrapper = {
      hash: bcrypt.hash,
      compare: bcrypt.compare,
      genSalt: bcrypt.genSalt,
    };

    const uuid = { v4: uuidv4 };

    // Create all manager instances with drizzle support
    const sessions = new SessionManager(drizzle, uuid);
    const timeTracking = new TimeTrackingManager(drizzle, uuid);
    const users = new UserManager(
      drizzle,
      bcryptWrapper,
      uuid,
      sessions,
      timeTracking
    );
    const businesses = new BusinessManager(drizzle, uuid);
    const products = new ProductManager(drizzle, uuid);
    const categories = new CategoryManager(drizzle, uuid);
    const inventory = new InventoryManager(drizzle, uuid);
    const schedules = new ScheduleManager(drizzle, uuid);
    const shifts = new ShiftManager(drizzle, uuid);
    const transactions = new TransactionManager(drizzle, uuid);
    const cashDrawers = new CashDrawerManager(drizzle, uuid);
    const reports = new ReportManager(drizzle);
    const auditLogs = new AuditLogManager(drizzle, uuid);
    const discounts = new DiscountManager(drizzle, uuid);
    const audit = new AuditManager(drizzle, uuid);
    const timeTrackingReports = new TimeTrackingReportManager(drizzle);
    const settings = new SettingsManager(drizzle);
    const ageVerification = new AgeVerificationManager(drizzle, uuid);
    const batches = new BatchManager(drizzle, uuid);
    const suppliers = new SupplierManager(drizzle, uuid);
    const vatCategories = new VatCategoryManager(drizzle, uuid);
    const expirySettings = new ExpirySettingManager(drizzle, uuid);
    const expiryNotifications = new ExpiryNotificationManager(drizzle, uuid);
    const stockMovements = new StockMovementManager(drizzle, uuid, batches);
    const cart = new CartManager(drizzle, uuid);

    managersInstance = {
      users,
      businesses,
      sessions,
      products,
      categories,
      inventory,
      schedules,
      shifts,
      transactions,
      cashDrawers,
      reports,
      auditLogs,
      discounts,

      timeTracking,
      audit,
      timeTrackingReports,
      settings,
      ageVerification,
      batches,
      suppliers,
      vatCategories,
      expirySettings,
      expiryNotifications,
      stockMovements,
      cart,

      // Database info methods
      getDatabaseInfo: () => {
        if (!dbManagerInstance) {
          throw new Error("Database not initialized");
        }
        const dbPath = dbManagerInstance.getDatabasePath();
        return getDatabaseInfo(dbPath);
      },
      emptyAllTables: async () => {
        if (!dbManagerInstance) {
          throw new Error("Database not initialized");
        }

        const rawDb = dbManagerInstance.getDb();

        try {
          console.log("🗑️  Emptying all database tables...");

          // Disable foreign key constraints temporarily for faster deletion
          rawDb.prepare("PRAGMA foreign_keys = OFF").run();

          // Delete in order: child tables first, then parent tables
          // This order respects foreign key relationships
          const tablesToEmpty = [
            // Child tables (with foreign keys) - delete first
            schema.printJobRetries,
            schema.printJobs,
            schema.attendanceReports,
            schema.shiftReports,
            schema.shiftValidationIssues,
            schema.shiftValidations,
            schema.timeCorrections,
            schema.breaks,
            schema.timeShifts,
            schema.clockEvents,
            schema.transactionItems,
            schema.transactions,
            schema.cashDrawerCounts,
            schema.shifts,
            schema.schedules,
            schema.stockMovements,
            schema.expiryNotifications,
            schema.expirySettings,
            schema.productBatches,
            schema.stockAdjustments,
            schema.suppliers,
            schema.discounts,
            schema.auditLogs,
            schema.sessions,
            // Parent tables (referenced by others) - delete last
            schema.products,
            schema.categories,
            schema.vatCategories,
            schema.users,
            schema.businesses,
            // System tables (usually keep app_settings, but empty if requested)
            schema.appSettings,
          ];

          let deletedCount = 0;
          for (const table of tablesToEmpty) {
            try {
              // Use Drizzle's delete API - delete all rows from table
              await drizzle.delete(table);
              deletedCount++;
            } catch (error) {
              // Try to get table name for error reporting
              const tableAny = table as any;
              const tableName =
                tableAny._?.name ||
                tableAny[Symbol.for("drizzle:Name")] ||
                "unknown";
              console.warn(
                `⚠️  Warning: Failed to empty table ${tableName}:`,
                error instanceof Error ? error.message : String(error)
              );
              // Continue with other tables even if one fails
            }
          }

          // Re-enable foreign key constraints
          rawDb.prepare("PRAGMA foreign_keys = ON").run();

          console.log(
            `✅ Successfully emptied ${deletedCount} of ${tablesToEmpty.length} tables`
          );
          return { deletedCount, totalTables: tablesToEmpty.length };
        } catch (error) {
          // Re-enable foreign key constraints even on error
          try {
            rawDb.prepare("PRAGMA foreign_keys = ON").run();
          } catch {
            // Ignore errors when re-enabling
          }

          const errorMessage =
            error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to empty all tables: ${errorMessage}`, {
            cause: error,
          });
        }
      },
    };

    return managersInstance as DatabaseManagers;
  })();

  return initializationPromise;
}

export function closeDatabase(): void {
  if (dbManagerInstance) {
    dbManagerInstance.close();
    dbManagerInstance = null;
    managersInstance = null;
    initializationPromise = null;
  }
}

/**
 * Backward Compatibility
 * @deprecated Use getDatabase() instead. This function is kept for backward compatibility.
 */
export async function initializeDatabase(): Promise<DatabaseManagers> {
  return getDatabase();
}

/**
 * Type Exports
 *
 * Note: Database schema types should be imported directly from "./schema.js"
 * Manager utility types should be imported directly from their respective manager files.
 *
 * This module only exports:
 * - DatabaseManagers interface (database manager instances)
 * - getDatabase() function
 * - closeDatabase() function
 * - initializeDatabase() function (deprecated)
 */

// Re-export manager utility types for convenience
// These are commonly used across the application
export type {
  RefundItem,
  TransactionWithItems,
} from "./managers/transactionManager.js";
