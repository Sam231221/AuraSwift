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
import { SettingsManager } from "./utils/settingsManager.js";
import { initializeDrizzle } from "./drizzle.js";
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
  cashDrawer: CashDrawerManager;
  reports: ReportManager;
  auditLogs: AuditLogManager;
  settings: SettingsManager;
}

export async function initializeDatabase(): Promise<DatabaseManagers> {
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

  const bcryptWrapper = {
    hash: bcrypt.hash,
    compare: bcrypt.compare,
  };

  const uuid = { v4: uuidv4 };

  // Create all manager instances with drizzle support
  const users = new UserManager(db, drizzle, bcryptWrapper, uuid);
  const businesses = new BusinessManager(db, drizzle, uuid);
  const sessions = new SessionManager(db, drizzle, uuid);
  const products = new ProductManager(db, drizzle, uuid);
  const categories = new CategoryManager(db, drizzle, uuid);
  const inventory = new InventoryManager(db, drizzle, uuid);
  const schedules = new ScheduleManager(db, drizzle, uuid);
  const shifts = new ShiftManager(db, drizzle, uuid);
  const transactions = new TransactionManager(db, drizzle, uuid);
  const cashDrawer = new CashDrawerManager(db, drizzle, uuid);
  const reports = new ReportManager(db, drizzle);
  const auditLogs = new AuditLogManager(db, drizzle, uuid);
  const settings = new SettingsManager(db);

  // Create default admin user if needed
  await users.createDefaultAdmin();

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
    cashDrawer,
    reports,
    auditLogs,
    settings,
  };

  return managersInstance;
}

export function getDatabaseManagers(): DatabaseManagers {
  if (!managersInstance) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return managersInstance;
}

export function closeDatabase(): void {
  if (dbManagerInstance) {
    dbManagerInstance.close();
    dbManagerInstance = null;
    managersInstance = null;
  }
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
