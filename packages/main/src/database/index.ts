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
import { SupplierManager } from "./managers/supplierManager.js";
import { TimeTrackingManager } from "./managers/timeTrackingManager.js";
import { AuditManager } from "./managers/auditManager.js";
import { TimeTrackingReportManager } from "./managers/timeTrackingReportManager.js";
import { SettingsManager } from "./managers/settingsManager.js";
import { initializeDrizzle } from "./drizzle.js";
import { getDatabaseInfo } from "./utils/dbInfo.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let dbManagerInstance: DBManager | null = null;
let managersInstance: DatabaseManagers | null = null;

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
  suppliers: SupplierManager;
  timeTracking: TimeTrackingManager;
  audit: AuditManager;
  timeTrackingReports: TimeTrackingReportManager;
  settings: SettingsManager;

  getDatabaseInfo: () => {
    path: string;
    mode: "development" | "production";
    exists: boolean;
    size?: number;
  };

  emptyAllTables(): Promise<any>;
}
export async function getDatabase(): Promise<DatabaseManagers> {
  if (managersInstance) {
    return managersInstance;
  }

  // Initialize database
  dbManagerInstance = new DBManager();
  await dbManagerInstance.initialize();

  const db = dbManagerInstance.getDb();

  // Initialize Drizzle ORM
  const drizzle = initializeDrizzle(db);

  // Load dependencies
  const bcrypt = require("bcryptjs");
  const { v4: uuidv4 } = require("uuid");

  // Seed database with default data if needed
  const { seedDefaultData } = await import("./seed.js");
  const schema = await import("./schema.js");
  try {
    await seedDefaultData(drizzle, schema);
  } catch (error) {
    console.error("Error seeding database:", error);
    // Don't throw - allow app to continue even if seeding fails
  }

  const bcryptWrapper = {
    hash: bcrypt.hash,
    compare: bcrypt.compare,
  };

  const uuid = { v4: uuidv4 };

  // Create all manager instances with drizzle support
  const users = new UserManager(drizzle, bcryptWrapper, uuid);
  const businesses = new BusinessManager(drizzle, uuid);
  const sessions = new SessionManager(drizzle, uuid);
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
  const suppliers = new SupplierManager(drizzle, uuid);
  const timeTracking = new TimeTrackingManager(drizzle, uuid);
  const audit = new AuditManager(drizzle, uuid);
  const timeTrackingReports = new TimeTrackingReportManager(drizzle);
  const settings = new SettingsManager(drizzle);

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
    suppliers,
    timeTracking,
    audit,
    timeTrackingReports,
    settings,

    // Database info methods
    getDatabaseInfo: () => {
      if (!dbManagerInstance) {
        throw new Error("Database not initialized");
      }
      const dbPath = dbManagerInstance.getDatabasePath();
      return getDatabaseInfo(dbPath);
    },
    emptyAllTables: async () => {
      throw new Error(
        "emptyAllTables not yet implemented in modular architecture"
      );
    },
  };

  return managersInstance as DatabaseManagers;
}

export function closeDatabase(): void {
  if (dbManagerInstance) {
    dbManagerInstance.close();
    dbManagerInstance = null;
    managersInstance = null;
  }
}

// Keep old function name for backward compatibility
export async function initializeDatabase(): Promise<DatabaseManagers> {
  return getDatabase();
}

// Re-export types for convenience
export type {
  User,
  Permission,
  Business,
  Session,
  Product,
  Modifier,
  ModifierOption,
  Category,
  StockAdjustment,
  Schedule,
  Shift,
  Transaction,
  TransactionItem,
  RefundItem,
  AppliedModifier,
  CashDrawerCount,
  ShiftReport,
  PrintJob,
  PrintJobRetry,
} from "../../../../types/database.d.ts";
