import { app } from "electron";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import type {
  User,
  Permission,
  Business,
  Session,
  Product,
  Modifier,
  ModifierOption,
  StockAdjustment,
  Supplier,
  Category,
  Schedule,
  Shift,
  Transaction,
  TransactionItem,
  RefundItem,
  AppliedModifier,
  CashDrawerCount,
  ShiftReport,
  ClockEvent,
  TimeShift,
  Break,
  TimeCorrection,
  AuditLog,
  AttendanceReport,
  ShiftValidation,
} from "../../../types/database.d.ts";

// Re-export types for use in other modules
export type {
  User,
  Permission,
  Business,
  Session,
  Product,
  Modifier,
  ModifierOption,
  StockAdjustment,
  Supplier,
  Category,
  Schedule,
  Shift,
  Transaction,
  TransactionItem,
  RefundItem,
  AppliedModifier,
  CashDrawerCount,
  ShiftReport,
  ClockEvent,
  TimeShift,
  Break,
  TimeCorrection,
  AuditLog,
  AttendanceReport,
  ShiftValidation,
};

import { initializeDrizzle, type DrizzleDB } from "./database/drizzle.js";
import { eq, and, like, desc, asc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "./database/schema.js";

// Import all managers
import { UserManager } from "./database/managers/userManager.js";
import { ProductManager } from "./database/managers/productManager.js";
import { TransactionManager } from "./database/managers/transactionManager.js";
import { CategoryManager } from "./database/managers/categoryManager.js";
import { ShiftManager } from "./database/managers/shiftManager.js";
import { ScheduleManager } from "./database/managers/scheduleManager.js";
import { SessionManager } from "./database/managers/sessionManager.js";
import { AuditLogManager } from "./database/managers/auditLogManager.js";
import { ReportManager } from "./database/managers/reportManager.js";
import { BusinessManager } from "./database/managers/businessManager.js";
import { CashDrawerManager } from "./database/managers/cashDrawerManager.js";
import { DiscountManager } from "./database/managers/discountManager.js";
import { InventoryManager } from "./database/managers/inventoryManager.js";
import { SupplierManager } from "./database/managers/supplierManager.js";
import { TimeTrackingManager } from "./database/managers/timeTrackingManager.js";
import { AuditManager } from "./database/managers/auditManager.js";
import { TimeTrackingReportManager } from "./database/managers/timeTrackingReportManager.js";

export class DatabaseManager {
  private db: any;
  private drizzle: DrizzleDB | null = null;
  private bcrypt: any;
  private uuid: any;
  private initialized: boolean = false;

  // Manager instances - exposed as public properties
  public users!: UserManager;
  public products!: ProductManager;
  public transactions!: TransactionManager;
  public categories!: CategoryManager;
  public shifts!: ShiftManager;
  public schedules!: ScheduleManager;
  public sessions!: SessionManager;
  public auditLogs!: AuditLogManager;
  public reports!: ReportManager;
  public businesses!: BusinessManager;
  public cashDrawers!: CashDrawerManager;
  public discounts!: DiscountManager;
  public inventory!: InventoryManager;
  public suppliers!: SupplierManager;
  public timeTracking!: TimeTrackingManager;
  public audit!: AuditManager;
  public timeTrackingReports!: TimeTrackingReportManager;

  constructor() {
    // Don't initialize here, wait for explicit initialization
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const Database = require("better-sqlite3");
      const bcrypt = require("bcryptjs");
      const { v4: uuidv4 } = require("uuid");

      // bcryptjs exports functions directly, not as an object
      this.bcrypt = {
        hash: bcrypt.hash,
        compare: bcrypt.compare,
      };
      this.uuid = { v4: uuidv4 };

      const dbPath = this.getDatabasePath();
      console.log("Database path:", dbPath);

      // Ensure the directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(dbPath);

      // Initialize Drizzle ORM with the same connection
      this.drizzle = initializeDrizzle(this.db);

      // Initialize base tables (for new databases)
      this.initializeTables();

      // Run database versioning and migrations
      const { initializeVersioning } = await import(
        "./database/versioning/index.js"
      );
      const versioningSuccess = initializeVersioning(this.db, dbPath);

      if (!versioningSuccess) {
        throw new Error("Database versioning initialization failed");
      }

      // Initialize all managers with drizzle support
      this.initializeManagers();

      this.initialized = true;
      console.log("Database initialized successfully\n");
    } catch (error) {
      console.error(" Database initialization error:", error);
      throw error;
    }
  }

  /**
   * Initialize all manager instances with Drizzle ORM support
   * Managers provide domain-separated, type-safe access to database operations
   */
  private initializeManagers(): void {
    if (!this.drizzle) {
      throw new Error("Drizzle ORM must be initialized before managers");
    }

    console.log("Initializing managers with Drizzle ORM support...");

    // Initialize each manager with both raw DB and Drizzle instance
    this.users = new UserManager(this.db, this.drizzle, this.bcrypt, this.uuid);
    this.products = new ProductManager(this.db, this.drizzle, this.uuid);
    this.transactions = new TransactionManager(
      this.db,
      this.drizzle,
      this.uuid
    );
    this.categories = new CategoryManager(this.db, this.drizzle, this.uuid);
    this.shifts = new ShiftManager(this.db, this.drizzle, this.uuid);
    this.schedules = new ScheduleManager(this.db, this.drizzle, this.uuid);
    this.sessions = new SessionManager(this.db, this.drizzle, this.uuid);
    this.auditLogs = new AuditLogManager(this.db, this.drizzle, this.uuid);
    this.reports = new ReportManager(this.db, this.drizzle);
    this.businesses = new BusinessManager(this.db, this.drizzle, this.uuid);
    this.cashDrawers = new CashDrawerManager(this.db, this.drizzle, this.uuid);
    this.discounts = new DiscountManager(this.db, this.drizzle, this.uuid);
    this.inventory = new InventoryManager(this.db, this.drizzle, this.uuid);
    this.suppliers = new SupplierManager(this.db, this.drizzle, this.uuid);
    this.timeTracking = new TimeTrackingManager(
      this.db,
      this.drizzle,
      this.uuid
    );
    this.audit = new AuditManager(this.db, this.drizzle, this.uuid);
    this.timeTrackingReports = new TimeTrackingReportManager(
      this.db,
      this.drizzle
    );

    console.log("✅ All managers initialized successfully");
  }

  private getDatabasePath(): string {
    // Multiple ways to detect development mode
    const isDev =
      process.env.NODE_ENV === "development" ||
      process.env.ELECTRON_IS_DEV === "true" ||
      !app.isPackaged;

    // Allow override via environment variable for testing
    const customDbPath = process.env.POS_DB_PATH;
    if (customDbPath) {
      console.log("Using custom database path:", customDbPath);
      return customDbPath;
    }

    if (isDev) {
      // Development: Store in project directory
      const projectRoot = path.join(__dirname, "..", "..", "..");
      const devDbPath = path.join(projectRoot, "data", "pos_system.db");
      console.log("Development mode: Using project directory for database");
      console.log("Database at:", devDbPath);
      return devDbPath;
    } else {
      // Production: Use proper user data directory based on platform
      const userDataPath = app.getPath("userData");
      const prodDbPath = path.join(userDataPath, "AuraSwift", "pos_system.db");
      console.log("Production mode: Using user data directory for database");
      console.log("Database at:", prodDbPath);
      return prodDbPath;
    }
  }

  /**
   * Get Drizzle ORM instance for type-safe queries
   * @throws Error if Drizzle hasn't been initialized
   */
  private getDrizzleInstance(): DrizzleDB {
    if (!this.drizzle) {
      throw new Error("Drizzle ORM not initialized. Call initialize() first.");
    }
    return this.drizzle;
  }

  private initializeTables() {
    // ========================================
    // FINAL SCHEMA DEFINITIONS
    // This is what fresh installations get
    // ========================================

    // First create businesses table (no foreign keys)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ownerId TEXT NOT NULL,
        address TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        vatNumber TEXT DEFAULT '',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Then create users table with foreign key to businesses
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password TEXT,
        pin TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        businessName TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('cashier', 'manager', 'admin')),
        businessId TEXT NOT NULL,
        permissions TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        address TEXT DEFAULT '',
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Categories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parentId TEXT,
        description TEXT,
        businessId TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (parentId) REFERENCES categories (id) ON DELETE SET NULL,
        UNIQUE(name, businessId)
      )
    `);

    // Ensure parentId column exists in categories table (migration for older DBs)
    try {
      this.db.exec(`ALTER TABLE categories ADD COLUMN parentId TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }

    // Migration: Add new columns to audit_logs for time tracking system
    try {
      this.db.exec(`ALTER TABLE audit_logs ADD COLUMN entityType TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }
    try {
      this.db.exec(`ALTER TABLE audit_logs ADD COLUMN entityId TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }
    try {
      this.db.exec(`ALTER TABLE audit_logs ADD COLUMN ipAddress TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }
    try {
      this.db.exec(`ALTER TABLE audit_logs ADD COLUMN terminalId TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }

    // Migration: Add username and pin columns to users table
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN username TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN pin TEXT;`);
    } catch (err) {
      // Column already exists, ignore error
    }

    // Migrate existing users: generate username from email and default PIN
    try {
      const usersNeedingMigration = this.db
        .prepare("SELECT id, email FROM users WHERE username IS NULL")
        .all();

      for (const user of usersNeedingMigration) {
        const username = user.email.split("@")[0]; // Use email prefix as username
        const pin = "1234"; // Default PIN, users should change this
        this.db
          .prepare("UPDATE users SET username = ?, pin = ? WHERE id = ?")
          .run(username, pin, user.id);
      }
    } catch (err) {
      // Migration already done or error
    }

    // Migration: Add UNIQUE constraint on (name, businessId) for categories
    // Check if the constraint already exists by trying to insert a duplicate
    try {
      const hasUniqueConstraint = this.db
        .prepare(
          `
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='categories'
      `
        )
        .get();

      // Check if UNIQUE constraint exists in table definition
      if (
        !hasUniqueConstraint?.sql?.includes("UNIQUE") ||
        !hasUniqueConstraint?.sql?.includes("name")
      ) {
        console.log(
          "🔄 Migrating categories table to add UNIQUE constraint..."
        );

        // Find and resolve duplicate category names
        const duplicates = this.db
          .prepare(
            `
          SELECT name, businessId, GROUP_CONCAT(id) as ids, COUNT(*) as count
          FROM categories
          GROUP BY name, businessId
          HAVING COUNT(*) > 1
        `
          )
          .all() as Array<{
          name: string;
          businessId: string;
          ids: string;
          count: number;
        }>;

        if (duplicates.length > 0) {
          console.log(
            `   Found ${duplicates.length} duplicate category name(s), resolving...`
          );

          // Resolve duplicates by renaming
          for (const dup of duplicates) {
            const categoryIds = dup.ids.split(",");
            // Keep first, rename others
            for (let i = 1; i < categoryIds.length; i++) {
              const newName = `${dup.name} (${i + 1})`;
              this.db
                .prepare(
                  `UPDATE categories SET name = ?, updatedAt = datetime('now') WHERE id = ?`
                )
                .run(newName, categoryIds[i]);
              console.log(
                `   Renamed duplicate category to: "${newName}" (${categoryIds[i]})`
              );
            }
          }
        }

        // Recreate table with UNIQUE constraint
        this.db.exec("PRAGMA foreign_keys = OFF;");
        this.db.exec("BEGIN TRANSACTION;");

        try {
          // Create new table with UNIQUE constraint
          this.db.exec(`
            CREATE TABLE categories_new (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              parentId TEXT,
              description TEXT,
              businessId TEXT NOT NULL,
              isActive BOOLEAN DEFAULT 1,
              sortOrder INTEGER DEFAULT 0,
              createdAt TEXT NOT NULL,
              updatedAt TEXT NOT NULL,
              FOREIGN KEY (businessId) REFERENCES businesses (id),
              FOREIGN KEY (parentId) REFERENCES categories_new (id) ON DELETE SET NULL,
              UNIQUE(name, businessId)
            )
          `);

          // Copy data
          this.db.exec(`
            INSERT INTO categories_new (id, name, parentId, description, businessId, isActive, sortOrder, createdAt, updatedAt)
            SELECT 
              id, 
              name, 
              parentId, 
              description, 
              businessId, 
              COALESCE(isActive, 1), 
              COALESCE(sortOrder, 0), 
              COALESCE(createdAt, datetime('now')), 
              COALESCE(updatedAt, datetime('now'))
            FROM categories
          `);

          // Drop old and rename new
          this.db.exec("DROP TABLE categories;");
          this.db.exec("ALTER TABLE categories_new RENAME TO categories;");

          this.db.exec("COMMIT;");
          console.log("Categories table migrated with UNIQUE constraint");
        } catch (migrationError) {
          this.db.exec("ROLLBACK;");
          console.error("Categories migration failed:", migrationError);
          throw migrationError;
        } finally {
          this.db.exec("PRAGMA foreign_keys = ON;");
        }
      }
    } catch (err) {
      console.error(
        "Error checking/migrating categories UNIQUE constraint:",
        err
      );
    }

    // Products table (includes weight-based product fields)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        costPrice REAL DEFAULT 0,
        taxRate REAL DEFAULT 0,
        sku TEXT UNIQUE NOT NULL,
        plu TEXT UNIQUE,
        image TEXT,
        category TEXT NOT NULL,
        stockLevel INTEGER DEFAULT 0,
        minStockLevel INTEGER DEFAULT 0,
        businessId TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        requiresWeight BOOLEAN DEFAULT 0,
        unit TEXT DEFAULT 'each',
        pricePerUnit REAL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (category) REFERENCES categories (id)
      )
    `);

    // Modifiers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS modifiers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('single', 'multiple')),
        required BOOLEAN DEFAULT 0,
        businessId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Modifier options table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS modifier_options (
        id TEXT PRIMARY KEY,
        modifierId TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (modifierId) REFERENCES modifiers (id) ON DELETE CASCADE
      )
    `);

    // Product modifiers relationship table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS product_modifiers (
        productId TEXT NOT NULL,
        modifierId TEXT NOT NULL,
        PRIMARY KEY (productId, modifierId),
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
        FOREIGN KEY (modifierId) REFERENCES modifiers (id) ON DELETE CASCADE
      )
    `);

    // Stock adjustments table for tracking inventory changes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('add', 'remove', 'sale', 'waste', 'adjustment')),
        quantity INTEGER NOT NULL,
        reason TEXT,
        userId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id),
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // App settings table for key-value storage (like user preferences, tokens, etc.)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Schedules table for planned staff work schedules
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        staffId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('upcoming', 'active', 'completed', 'missed')),
        assignedRegister TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (staffId) REFERENCES users (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Shifts table for actual work sessions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shifts (
        id TEXT PRIMARY KEY,
        scheduleId TEXT,
        cashierId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        status TEXT NOT NULL CHECK (status IN ('active', 'ended')),
        startingCash REAL NOT NULL,
        finalCashDrawer REAL,
        expectedCashDrawer REAL,
        cashVariance REAL,
        totalSales REAL DEFAULT 0,
        totalTransactions INTEGER DEFAULT 0,
        totalRefunds REAL DEFAULT 0,
        totalVoids REAL DEFAULT 0,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (scheduleId) REFERENCES schedules (id),
        FOREIGN KEY (cashierId) REFERENCES users (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Transactions table for sales, refunds, voids (includes refund-specific fields)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        shiftId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('sale', 'refund', 'void')),
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        paymentMethod TEXT NOT NULL CHECK (paymentMethod IN ('cash', 'card', 'mixed')),
        cashAmount REAL,
        cardAmount REAL,
        status TEXT NOT NULL CHECK (status IN ('completed', 'voided', 'pending')),
        voidReason TEXT,
        customerId TEXT,
        receiptNumber TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        originalTransactionId TEXT,
        refundReason TEXT,
        refundMethod TEXT CHECK (refundMethod IN ('original', 'store_credit', 'cash', 'card')),
        managerApprovalId TEXT,
        isPartialRefund BOOLEAN DEFAULT 0,
        discountAmount REAL DEFAULT 0,
        appliedDiscounts TEXT,
        FOREIGN KEY (shiftId) REFERENCES shifts (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (originalTransactionId) REFERENCES transactions (id),
        FOREIGN KEY (managerApprovalId) REFERENCES users (id)
      )
    `);

    // Transaction items table for individual line items (includes refund support and weight fields)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id TEXT PRIMARY KEY,
        transactionId TEXT NOT NULL,
        productId TEXT NOT NULL,
        productName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        totalPrice REAL NOT NULL,
        refundedQuantity INTEGER DEFAULT 0,
        weight REAL,
        discountAmount REAL DEFAULT 0,
        appliedDiscounts TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (transactionId) REFERENCES transactions (id),
        FOREIGN KEY (productId) REFERENCES products (id)
      )
    `);

    // Applied modifiers table for transaction item modifiers
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS applied_modifiers (
        id TEXT PRIMARY KEY,
        transactionItemId TEXT NOT NULL,
        modifierId TEXT NOT NULL,
        modifierName TEXT NOT NULL,
        optionId TEXT NOT NULL,
        optionName TEXT NOT NULL,
        price REAL NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (transactionItemId) REFERENCES transaction_items (id),
        FOREIGN KEY (modifierId) REFERENCES modifiers (id)
      )
    `);

    // Cash drawer counts table for reconciliation
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cash_drawer_counts (
        id TEXT PRIMARY KEY,
        shiftId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        countType TEXT NOT NULL CHECK (countType IN ('mid-shift', 'end-shift')),
        expectedAmount REAL NOT NULL,
        countedAmount REAL NOT NULL,
        variance REAL NOT NULL,
        notes TEXT,
        countedBy TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (shiftId) REFERENCES shifts (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (countedBy) REFERENCES users (id)
      )
    `);

    // Discounts table for managing promotional discounts
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS discounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'buy_x_get_y')),
        value REAL NOT NULL,
        businessId TEXT NOT NULL,
        applicableTo TEXT NOT NULL CHECK (applicableTo IN ('all', 'category', 'product', 'transaction')),
        categoryIds TEXT,
        productIds TEXT,
        buyQuantity INTEGER,
        getQuantity INTEGER,
        getDiscountType TEXT CHECK (getDiscountType IN ('free', 'percentage', 'fixed')),
        getDiscountValue REAL,
        minPurchaseAmount REAL,
        minQuantity INTEGER,
        maxDiscountAmount REAL,
        startDate TEXT,
        endDate TEXT,
        isActive BOOLEAN DEFAULT 1,
        usageLimit INTEGER,
        usageCount INTEGER DEFAULT 0,
        perCustomerLimit INTEGER,
        priority INTEGER DEFAULT 0,
        daysOfWeek TEXT,
        timeStart TEXT,
        timeEnd TEXT,
        requiresCouponCode BOOLEAN DEFAULT 0,
        couponCode TEXT,
        combinableWithOthers BOOLEAN DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (createdBy) REFERENCES users (id)
      )
    `);

    // Audit logs table for tracking sensitive operations and time tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT,
        resourceId TEXT,
        entityType TEXT,
        entityId TEXT,
        details TEXT,
        ipAddress TEXT,
        terminalId TEXT,
        timestamp TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Office printer print jobs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS print_jobs (
        job_id TEXT PRIMARY KEY,
        printer_name TEXT NOT NULL,
        document_path TEXT,
        document_type TEXT NOT NULL CHECK (document_type IN ('pdf', 'image', 'text', 'raw')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'printing', 'completed', 'failed', 'cancelled', 'retrying')),
        options TEXT,
        metadata TEXT,
        created_by TEXT,
        business_id TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        last_retry_at TEXT,
        retry_count INTEGER DEFAULT 0,
        progress INTEGER DEFAULT 0,
        pages_total INTEGER,
        pages_printed INTEGER,
        error TEXT,
        FOREIGN KEY (created_by) REFERENCES users (id),
        FOREIGN KEY (business_id) REFERENCES businesses (id)
      )
    `);

    // Print job retry attempts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS print_job_retries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL,
        attempt INTEGER NOT NULL,
        error TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        next_retry_at TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES print_jobs (job_id) ON DELETE CASCADE
      )
    `);

    // Clock-in/Clock-out System Tables
    // Clock events table - tracks all clock in/out events
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clock_events (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        terminalId TEXT NOT NULL,
        locationId TEXT,
        type TEXT NOT NULL CHECK (type IN ('in', 'out')),
        timestamp TEXT NOT NULL,
        method TEXT NOT NULL CHECK (method IN ('login', 'manual', 'auto', 'manager')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'disputed')) DEFAULT 'confirmed',
        geolocation TEXT,
        ipAddress TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Time shifts table - represents work shifts with clock in/out
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS time_shifts (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        businessId TEXT NOT NULL,
        clockInId TEXT NOT NULL,
        clockOutId TEXT,
        scheduleId TEXT,
        status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'pending_review')) DEFAULT 'active',
        totalHours REAL,
        regularHours REAL,
        overtimeHours REAL,
        breakDuration INTEGER,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id),
        FOREIGN KEY (clockInId) REFERENCES clock_events (id),
        FOREIGN KEY (clockOutId) REFERENCES clock_events (id),
        FOREIGN KEY (scheduleId) REFERENCES schedules (id)
      )
    `);

    // Breaks table - tracks breaks during shifts
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS breaks (
        id TEXT PRIMARY KEY,
        shiftId TEXT NOT NULL,
        userId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('meal', 'rest', 'other')) DEFAULT 'rest',
        startTime TEXT NOT NULL,
        endTime TEXT,
        duration INTEGER,
        isPaid BOOLEAN DEFAULT 0,
        status TEXT NOT NULL CHECK (status IN ('active', 'completed')) DEFAULT 'active',
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (shiftId) REFERENCES time_shifts (id),
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Time corrections table - tracks manual corrections to clock times
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS time_corrections (
        id TEXT PRIMARY KEY,
        clockEventId TEXT,
        shiftId TEXT,
        userId TEXT NOT NULL,
        correctionType TEXT NOT NULL CHECK (correctionType IN ('clock_time', 'break_time', 'manual_entry')),
        originalTime TEXT,
        correctedTime TEXT NOT NULL,
        timeDifference INTEGER NOT NULL,
        reason TEXT NOT NULL,
        requestedBy TEXT NOT NULL,
        approvedBy TEXT,
        status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (clockEventId) REFERENCES clock_events (id),
        FOREIGN KEY (shiftId) REFERENCES time_shifts (id),
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (requestedBy) REFERENCES users (id),
        FOREIGN KEY (approvedBy) REFERENCES users (id)
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);

      CREATE INDEX IF NOT EXISTS idx_categories_businessId ON categories(businessId);
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      CREATE INDEX IF NOT EXISTS idx_categories_sortOrder ON categories(sortOrder);
      
      CREATE INDEX IF NOT EXISTS idx_products_businessId ON products(businessId);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_plu ON products(plu);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_modifiers_businessId ON modifiers(businessId);
      CREATE INDEX IF NOT EXISTS idx_stock_adjustments_productId ON stock_adjustments(productId);
      CREATE INDEX IF NOT EXISTS idx_stock_adjustments_businessId ON stock_adjustments(businessId);

      -- Indexes for shift management tables
      CREATE INDEX IF NOT EXISTS idx_schedules_staffId ON schedules(staffId);
      CREATE INDEX IF NOT EXISTS idx_schedules_businessId ON schedules(businessId);
      CREATE INDEX IF NOT EXISTS idx_schedules_startTime ON schedules(startTime);
      CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

      CREATE INDEX IF NOT EXISTS idx_shifts_cashierId ON shifts(cashierId);
      CREATE INDEX IF NOT EXISTS idx_shifts_businessId ON shifts(businessId);
      CREATE INDEX IF NOT EXISTS idx_shifts_scheduleId ON shifts(scheduleId);
      CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
      CREATE INDEX IF NOT EXISTS idx_shifts_startTime ON shifts(startTime);

      CREATE INDEX IF NOT EXISTS idx_transactions_shiftId ON transactions(shiftId);
      CREATE INDEX IF NOT EXISTS idx_transactions_businessId ON transactions(businessId);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);

      CREATE INDEX IF NOT EXISTS idx_transaction_items_transactionId ON transaction_items(transactionId);
      CREATE INDEX IF NOT EXISTS idx_transaction_items_productId ON transaction_items(productId);

      CREATE INDEX IF NOT EXISTS idx_applied_modifiers_transactionItemId ON applied_modifiers(transactionItemId);
      CREATE INDEX IF NOT EXISTS idx_applied_modifiers_modifierId ON applied_modifiers(modifierId);

      CREATE INDEX IF NOT EXISTS idx_cash_drawer_counts_shiftId ON cash_drawer_counts(shiftId);
      CREATE INDEX IF NOT EXISTS idx_cash_drawer_counts_businessId ON cash_drawer_counts(businessId);
      CREATE INDEX IF NOT EXISTS idx_cash_drawer_counts_countType ON cash_drawer_counts(countType);

      CREATE INDEX IF NOT EXISTS idx_discounts_businessId ON discounts(businessId);
      CREATE INDEX IF NOT EXISTS idx_discounts_isActive ON discounts(isActive);
      CREATE INDEX IF NOT EXISTS idx_discounts_type ON discounts(type);
      CREATE INDEX IF NOT EXISTS idx_discounts_applicableTo ON discounts(applicableTo);
      CREATE INDEX IF NOT EXISTS idx_discounts_couponCode ON discounts(couponCode);
      CREATE INDEX IF NOT EXISTS idx_discounts_priority ON discounts(priority);

      CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs(userId);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      
      -- Additional indexes for refund functionality
      CREATE INDEX IF NOT EXISTS idx_transactions_originalTransactionId ON transactions(originalTransactionId);
      
      -- Indexes for print jobs
      CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_printer_name ON print_jobs(printer_name);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON print_jobs(created_at);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_business_id ON print_jobs(business_id);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_created_by ON print_jobs(created_by);
      
      CREATE INDEX IF NOT EXISTS idx_print_job_retries_job_id ON print_job_retries(job_id);
      CREATE INDEX IF NOT EXISTS idx_print_job_retries_timestamp ON print_job_retries(timestamp);

      -- Indexes for clock-in/clock-out system
      CREATE INDEX IF NOT EXISTS idx_clock_events_userId ON clock_events(userId);
      CREATE INDEX IF NOT EXISTS idx_clock_events_timestamp ON clock_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_clock_events_type ON clock_events(type);
      CREATE INDEX IF NOT EXISTS idx_clock_events_status ON clock_events(status);

      CREATE INDEX IF NOT EXISTS idx_time_shifts_userId ON time_shifts(userId);
      CREATE INDEX IF NOT EXISTS idx_time_shifts_businessId ON time_shifts(businessId);
      CREATE INDEX IF NOT EXISTS idx_time_shifts_status ON time_shifts(status);
      CREATE INDEX IF NOT EXISTS idx_time_shifts_clockInId ON time_shifts(clockInId);
      CREATE INDEX IF NOT EXISTS idx_time_shifts_clockOutId ON time_shifts(clockOutId);

      CREATE INDEX IF NOT EXISTS idx_breaks_shiftId ON breaks(shiftId);
      CREATE INDEX IF NOT EXISTS idx_breaks_userId ON breaks(userId);
      CREATE INDEX IF NOT EXISTS idx_breaks_status ON breaks(status);

      CREATE INDEX IF NOT EXISTS idx_time_corrections_userId ON time_corrections(userId);
      CREATE INDEX IF NOT EXISTS idx_time_corrections_status ON time_corrections(status);
      CREATE INDEX IF NOT EXISTS idx_time_corrections_requestedBy ON time_corrections(requestedBy);

      CREATE INDEX IF NOT EXISTS idx_audit_logs_entityType ON audit_logs(entityType);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entityId ON audit_logs(entityId);
    `);

    // Insert default admin user if no users exist
    this.createDefaultAdmin();
    // Ensure default demo users exist
    this.createDefaultDemoUsers();
  }

  /**
   * Create default demo users if they don't exist
   */
  private async createDefaultDemoUsers() {
    try {
      console.log("🔍 Checking for demo users...");
      // Check if john, sarah, emma exist
      const john = this.db
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("john");
      const sarah = this.db
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("sarah");
      const emma = this.db
        .prepare("SELECT id FROM users WHERE username = ?")
        .get("emma");

      // Get default business ID (assuming first business or admin's business)
      const defaultBusiness = this.db
        .prepare("SELECT id FROM businesses LIMIT 1")
        .get() as { id: string } | undefined;

      if (!defaultBusiness) {
        console.log(
          "❌ No default business found, skipping demo users creation"
        );
        return;
      }

      const businessId = defaultBusiness.id;
      console.log(`✓ Found business: ${businessId}`);
      const hashedPassword = await this.bcrypt.hash("admin123", 10);
      const now = new Date().toISOString();

      // Create john (manager) if doesn't exist
      if (!john) {
        console.log("   Creating manager: john");
        const managerId = this.uuid.v4();
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

        this.db
          .prepare(
            `
          INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive, address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            managerId,
            "john",
            "1234",
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
        console.log("   ✅ Created manager: john / PIN: 1234");
      }

      // Create sarah (cashier) if doesn't exist
      if (!sarah) {
        console.log("   Creating cashier: sarah");
        const cashierId1 = this.uuid.v4();
        const cashierPermissions = JSON.stringify([
          { action: "read", resource: "sales" },
          { action: "create", resource: "transactions" },
          { action: "read", resource: "products" },
          { action: "read", resource: "basic_reports" },
        ]);

        this.db
          .prepare(
            `
          INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive, address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            cashierId1,
            "sarah",
            "1234",
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
        console.log("   ✅ Created cashier: sarah / PIN: 1234");
      }

      // Create emma (cashier) if doesn't exist
      if (!emma) {
        console.log("   Creating cashier: emma");
        const cashierId2 = this.uuid.v4();
        const cashierPermissions = JSON.stringify([
          { action: "read", resource: "sales" },
          { action: "create", resource: "transactions" },
          { action: "read", resource: "products" },
          { action: "read", resource: "basic_reports" },
        ]);

        this.db
          .prepare(
            `
          INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive, address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            cashierId2,
            "emma",
            "1234",
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
        console.log("   ✅ Created cashier: emma / PIN: 1234");
      }
    } catch (error) {
      console.error("Error creating default demo users:", error);
    }
  }

  /**
   * Migration System Notes:
   *
   * This class (DatabaseManager) creates the baseline database schema.
   * The versioning system (packages/main/src/database/versioning/) handles
   * all future schema changes using SQLite's PRAGMA user_version.
   *
   * The baseline schema includes all historical changes:
   * - Business fields (address, phone, vatNumber)
   * - Discount fields (discountAmount, appliedDiscounts)
   * - All core tables and indexes
   *
   * Future migrations are defined in:
   * packages/main/src/database/versioning/migrations.ts
   */

  private async createDefaultAdmin() {
    const userCount = this.db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };

    if (userCount.count === 0) {
      const adminId = this.uuid.v4();
      const businessId = this.uuid.v4();
      const hashedPassword = await this.bcrypt.hash("admin123", 10);
      const now = new Date().toISOString();

      const adminPermissions = JSON.stringify([{ action: "*", resource: "*" }]);

      // Temporarily disable foreign key constraints
      this.db.exec("PRAGMA foreign_keys = OFF");

      try {
        // Create default business first
        this.db
          .prepare(
            `
          INSERT INTO businesses (id, name, ownerId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?)
        `
          )
          .run(businessId, "Default Store", adminId, now, now);

        // Create admin user
        this.db
          .prepare(
            `
          INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            adminId,
            "admin",
            "1234",
            "admin@store.com",
            hashedPassword,
            "Admin",
            "User",
            "Default Store",
            "admin",
            businessId,
            adminPermissions,
            now,
            now,
            1
          );

        // Create default manager user
        const managerId = this.uuid.v4();
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

        this.db
          .prepare(
            `
          INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            managerId,
            "john",
            "1234",
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
            1
          );

        // Create default cashier user 1
        const cashierId1 = this.uuid.v4();
        const cashierPermissions = JSON.stringify([
          { action: "read", resource: "sales" },
          { action: "create", resource: "transactions" },
          { action: "read", resource: "products" },
          { action: "read", resource: "basic_reports" },
        ]);

        this.db
          .prepare(
            `
          INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            cashierId1,
            "sarah",
            "1234",
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
            1
          );

        // Create default cashier user 2
        const cashierId2 = this.uuid.v4();

        this.db
          .prepare(
            `
          INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            cashierId2,
            "emma",
            "1234",
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
            1
          );

        console.log("✅ Default users created:");
        console.log("   Admin: username: admin / PIN: 1234");
        console.log("   Manager: username: john / PIN: 1234");
        console.log("   Cashier: username: sarah / PIN: 1234");
        console.log("   Cashier: username: emma / PIN: 1234");
      } finally {
        // Re-enable foreign key constraints
        this.db.exec("PRAGMA foreign_keys = ON");
      }
    }
  }

  // User management methods
  async createUser(userData: {
    username: string;
    pin: string;
    email?: string;
    password?: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
    businessId?: string;
  }): Promise<User> {
    const userId = this.uuid.v4();
    const businessId = userData.businessId || this.uuid.v4();
    const hashedPassword = userData.password
      ? await this.bcrypt.hash(userData.password, 10)
      : null;
    const now = new Date().toISOString();

    // Set permissions based on role
    let permissions: Permission[];
    switch (userData.role) {
      case "cashier":
        permissions = [
          { action: "read", resource: "sales" },
          { action: "create", resource: "transactions" },
          { action: "read", resource: "products" },
          { action: "read", resource: "basic_reports" },
        ];
        break;
      case "manager":
        permissions = [
          { action: "read", resource: "sales" },
          { action: "create", resource: "transactions" },
          { action: "void", resource: "transactions" },
          { action: "apply", resource: "discounts" },
          { action: "read", resource: "products" },
          { action: "update", resource: "inventory" },
          { action: "read", resource: "all_reports" },
          { action: "manage", resource: "staff_schedules" },
        ];
        break;
      case "admin":
        permissions = [{ action: "*", resource: "*" }];
        break;
    }

    // If businessId is provided, check that it exists
    if (userData.businessId) {
      const businessExists = this.db
        .prepare("SELECT id FROM businesses WHERE id = ?")
        .get(userData.businessId);
      if (!businessExists) {
        throw new Error("Business does not exist for provided businessId");
      }
    }

    // Temporarily disable foreign key constraints for user creation
    this.db.exec("PRAGMA foreign_keys = OFF");

    try {
      // Create business if not provided
      if (!userData.businessId) {
        this.db
          .prepare(
            `
          INSERT INTO businesses (id, name, ownerId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?)
        `
          )
          .run(businessId, userData.businessName, userId, now, now);

        // Create default categories for new business
        await this.createDefaultCategories(businessId);
      }

      // Create user
      this.db
        .prepare(
          `
        INSERT INTO users (id, username, pin, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive, address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          userId,
          userData.username,
          userData.pin,
          userData.email ?? null,
          hashedPassword,
          userData.firstName,
          userData.lastName,
          userData.businessName,
          userData.role,
          businessId,
          JSON.stringify(permissions),
          now,
          now,
          1,
          "" // Default empty address
        );
    } finally {
      // Re-enable foreign key constraints
      this.db.exec("PRAGMA foreign_keys = ON");
    }

    const user = this.getUserById(userId);
    if (!user) {
      throw new Error("User not found after creation");
    }
    return user;
  }

  getUserByEmail(email: string): User | null {
    const user = this.db
      .prepare("SELECT * FROM users WHERE email = ? AND isActive = 1")
      .get(email) as any;
    if (!user) return null;

    return {
      ...user,
      permissions: JSON.parse(user.permissions),
    };
  }

  getUserByUsername(username: string): User | null {
    const user = this.db
      .prepare("SELECT * FROM users WHERE username = ? AND isActive = 1")
      .get(username) as any;
    if (!user) return null;

    return {
      ...user,
      permissions: JSON.parse(user.permissions),
    };
  }

  getUserById(id: string): User | null {
    const user = this.db
      .prepare("SELECT * FROM users WHERE id = ? AND isActive = 1")
      .get(id) as any;
    if (!user) return null;

    return {
      ...user,
      permissions: JSON.parse(user.permissions),
    };
  }

  async authenticateUser(username: string, pin: string): Promise<User | null> {
    const user = this.getUserByUsername(username);
    if (!user) return null;

    // For PIN, we do direct comparison (PINs are stored as plain text for now)
    // If you want to hash PINs, you can use bcrypt here too
    if (user.pin !== pin) return null;

    // Return user without password and PIN
    const { password: _, pin: __, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  // Session management methods
  /**
   * Create or update a session by token. If session exists, update createdAt; else, create new session.
   * @param token Session token
   * @param value JSON string containing userId and other info
   */
  createOrUpdateSession(token: string, value: string): void {
    const session = this.getSessionByToken(token);
    if (session) {
      this.db
        .prepare(
          "UPDATE sessions SET token = ?, createdAt = datetime('now') WHERE id = ?"
        )
        .run(token, session.id);
    } else {
      const userId = JSON.parse(value).userId || "";
      // Validate user exists and is active
      const user = this.db
        .prepare("SELECT id FROM users WHERE id = ? AND isActive = 1")
        .get(userId);
      if (!user) {
        throw new Error(
          "Cannot create session: user does not exist or is not active"
        );
      }
      const sessionId = this.uuid.v4();
      const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      this.db
        .prepare(
          `INSERT INTO sessions (id, userId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?, datetime('now'))`
        )
        .run(sessionId, userId, token, expiresAt);
    }
  }

  /**
   * Get session by token
   */
  getSessionByToken(token: string): Session | null {
    const session = this.db
      .prepare(
        `SELECT * FROM sessions WHERE token = ? AND expiresAt > datetime('now')`
      )
      .get(token) as any;
    return session || null;
  }

  /**
   * Delete session by token
   */
  deleteSessionByToken(token: string): void {
    this.db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }

  createSession(userId: string, expiryDays: number = 7): Session {
    const sessionId = this.uuid.v4();
    const token = this.uuid.v4();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + expiryDays * 24 * 60 * 60 * 1000
    );

    this.db
      .prepare(
        `
      INSERT INTO sessions (id, userId, token, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(
        sessionId,
        userId,
        token,
        expiresAt.toISOString(),
        now.toISOString()
      );

    return {
      id: sessionId,
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };
  }

  deleteSession(token: string): boolean {
    const result = this.db
      .prepare("DELETE FROM sessions WHERE token = ?")
      .run(token);
    return result.changes > 0;
  }

  deleteUserSessions(userId: string): void {
    this.db.prepare("DELETE FROM sessions WHERE userId = ?").run(userId);
  }

  // Cleanup expired sessions
  cleanupExpiredSessions(): void {
    this.db
      .prepare("DELETE FROM sessions WHERE expiresAt <= datetime('now')")
      .run();
  }

  // ============================================
  // DRIZZLE ORM SESSION METHODS
  // ============================================

  /**
   * Get session by token using Drizzle ORM (type-safe)
   * Alternative to getSessionByToken() above
   */
  async getSessionByTokenDrizzle(token: string): Promise<Session | null> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const [session] = await drizzle
      .select()
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.token, token),
          drizzleSql`${schema.sessions.expiresAt} > ${now}`
        )
      )
      .limit(1);

    return session || null;
  }

  /**
   * Get all sessions for a user using Drizzle ORM (type-safe)
   * NEW method - list user sessions
   */
  async getUserSessionsDrizzle(userId: string): Promise<Session[]> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const sessions = await drizzle
      .select()
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.userId, userId),
          drizzleSql`${schema.sessions.expiresAt} > ${now}`
        )
      )
      .orderBy(desc(schema.sessions.createdAt));

    return sessions;
  }

  /**
   * Get active sessions count for a user using Drizzle ORM
   * NEW method - session monitoring
   */
  async getActiveSessionCountDrizzle(userId: string): Promise<number> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const result = await drizzle
      .select({ count: drizzleSql<number>`count(*)` })
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.userId, userId),
          drizzleSql`${schema.sessions.expiresAt} > ${now}`
        )
      );

    return result[0]?.count || 0;
  }

  /**
   * Delete session by token (Drizzle)
   * NEW method - delete specific session
   */
  deleteSessionDrizzle(token: string): boolean {
    const db = this.getDrizzleInstance();

    const result = db
      .delete(schema.sessions)
      .where(eq(schema.sessions.token, token))
      .run();

    return result.changes > 0;
  }

  /**
   * Delete all sessions for a user (Drizzle)
   * NEW method - cleanup user sessions
   */
  deleteUserSessionsDrizzle(userId: string): number {
    const db = this.getDrizzleInstance();

    const result = db
      .delete(schema.sessions)
      .where(eq(schema.sessions.userId, userId))
      .run();

    return result.changes;
  }

  /**
   * Cleanup expired sessions (Drizzle)
   * NEW method - maintenance task
   */
  cleanupExpiredSessionsDrizzle(): number {
    const db = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const result = db
      .delete(schema.sessions)
      .where(drizzleSql`${schema.sessions.expiresAt} <= ${now}`)
      .run();

    return result.changes;
  }

  // Business management methods
  getBusinessById(id: string): Business | null {
    return this.db
      .prepare("SELECT * FROM businesses WHERE id = ?")
      .get(id) as Business | null;
  }

  /**
   * Get business by ID using Drizzle ORM (type-safe)
   * Alternative to getBusinessById() above
   */
  async getBusinessByIdDrizzle(id: string): Promise<Business | null> {
    const drizzle = this.getDrizzleInstance();

    const [business] = await drizzle
      .select()
      .from(schema.businesses)
      .where(eq(schema.businesses.id, id))
      .limit(1);

    if (!business) return null;

    return {
      ...business,
      address: business.address ?? "",
      phone: business.phone ?? "",
      vatNumber: business.vatNumber ?? "",
    } as Business;
  }

  /**
   * Update business using Drizzle ORM (type-safe)
   * NEW method - update business details
   */
  async updateBusinessDrizzle(
    id: string,
    updates: Partial<{
      name: string;
      address: string;
      phone: string;
      vatNumber: string;
    }>
  ): Promise<boolean> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const result = await drizzle
      .update(schema.businesses)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(schema.businesses.id, id));

    return result.changes > 0;
  }

  getUsersByBusiness(businessId: string): User[] {
    const users = this.db
      .prepare(
        `
      SELECT * FROM users 
      WHERE businessId = ? AND isActive = 1
      ORDER BY createdAt DESC
    `
      )
      .all(businessId) as any[];

    return users.map((user) => ({
      ...user,
      permissions: JSON.parse(user.permissions),
    }));
  }

  // Update user
  updateUser(
    id: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      businessName: string;
      role: "cashier" | "manager" | "admin";
      isActive: boolean;
    }>
  ): boolean {
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(updates);
    values.push(new Date().toISOString()); // updatedAt
    values.push(id);

    const result = this.db
      .prepare(
        `
      UPDATE users 
      SET ${setClause}, updatedAt = ?
      WHERE id = ?
    `
      )
      .run(...values);

    return result.changes > 0;
  }

  // Delete user (soft delete)
  deleteUser(id: string): boolean {
    const result = this.db
      .prepare(
        `
      UPDATE users 
      SET isActive = 0, updatedAt = ?
      WHERE id = ?
    `
      )
      .run(new Date().toISOString(), id);

    return result.changes > 0;
  }

  // ============================================
  // DRIZZLE ORM TYPE-SAFE QUERY METHODS
  // These methods demonstrate gradual migration
  // from raw SQL to type-safe Drizzle queries
  // ============================================

  /**
   * Get user by email using Drizzle ORM (type-safe)
   * Alternative to getUserByEmail() above
   */
  async getUserByEmailDrizzle(email: string): Promise<User | null> {
    const drizzle = this.getDrizzleInstance();

    const [user] = await drizzle
      .select()
      .from(schema.users)
      .where(
        and(eq(schema.users.email, email), eq(schema.users.isActive, true))
      )
      .limit(1);

    if (!user) return null;

    return {
      ...user,
      email: user.email ?? undefined,
      password: user.password ?? undefined,
      username: user.username ?? user.email?.split("@")[0] ?? "",
      pin: user.pin ?? "1234",
      address: user.address ?? "",
      permissions: JSON.parse(user.permissions),
      isActive: Boolean(user.isActive),
    };
  }

  /**
   * Get user by ID using Drizzle ORM (type-safe)
   * Alternative to getUserById() above
   */
  async getUserByIdDrizzle(id: string): Promise<User | null> {
    const drizzle = this.getDrizzleInstance();

    const [user] = await drizzle
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, id), eq(schema.users.isActive, true)))
      .limit(1);

    if (!user) return null;

    return {
      ...user,
      email: user.email ?? undefined,
      password: user.password ?? undefined,
      username: user.username ?? user.email?.split("@")[0] ?? "",
      pin: user.pin ?? "1234",
      address: user.address ?? "",
      permissions: JSON.parse(user.permissions),
      isActive: Boolean(user.isActive),
    };
  }

  /**
   * Get users by business using Drizzle ORM (type-safe)
   * Alternative to getUsersByBusiness() above
   */
  async getUsersByBusinessDrizzle(businessId: string): Promise<User[]> {
    const drizzle = this.getDrizzleInstance();

    const users = await drizzle
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.businessId, businessId),
          eq(schema.users.isActive, true)
        )
      )
      .orderBy(desc(schema.users.createdAt));

    return users.map((user) => ({
      ...user,
      email: user.email ?? undefined,
      password: user.password ?? undefined,
      username: user.username ?? user.email?.split("@")[0] ?? "",
      pin: user.pin ?? "1234",
      address: user.address ?? "",
      permissions: JSON.parse(user.permissions),
      isActive: Boolean(user.isActive),
    }));
  }

  /**
   * Search users by name or email using Drizzle ORM (type-safe)
   * NEW method - demonstrates complex query building
   */
  async searchUsersDrizzle(
    businessId: string,
    searchTerm: string
  ): Promise<User[]> {
    const drizzle = this.getDrizzleInstance();
    const searchPattern = `%${searchTerm}%`;

    const users = await drizzle
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.businessId, businessId),
          eq(schema.users.isActive, true),
          drizzleSql`(
            ${schema.users.email} LIKE ${searchPattern} OR 
            ${schema.users.firstName} LIKE ${searchPattern} OR 
            ${schema.users.lastName} LIKE ${searchPattern}
          )`
        )
      )
      .orderBy(desc(schema.users.createdAt));

    return users.map((user) => ({
      ...user,
      email: user.email ?? undefined,
      password: user.password ?? undefined,
      username: user.username ?? user.email?.split("@")[0] ?? "",
      pin: user.pin ?? "1234",
      address: user.address ?? "",
      permissions: JSON.parse(user.permissions),
      isActive: Boolean(user.isActive),
    }));
  }

  /**
   * Get user with business details using Drizzle JOIN (type-safe)
   * NEW method - demonstrates JOIN queries
   */
  async getUserWithBusinessDrizzle(userId: string) {
    const drizzle = this.getDrizzleInstance();

    const [result] = await drizzle
      .select({
        user: schema.users,
        business: schema.businesses,
      })
      .from(schema.users)
      .leftJoin(
        schema.businesses,
        eq(schema.users.businessId, schema.businesses.id)
      )
      .where(and(eq(schema.users.id, userId), eq(schema.users.isActive, true)))
      .limit(1);

    if (!result) return null;

    return {
      ...result.user,
      permissions: JSON.parse(result.user.permissions),
      isActive: Boolean(result.user.isActive),
      business: result.business,
    };
  }

  /**
   * Update user using Drizzle ORM (type-safe)
   * Alternative to updateUser() above
   */
  async updateUserDrizzle(
    id: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      businessName: string;
      role: "cashier" | "manager" | "admin";
      isActive: boolean;
      address: string;
    }>
  ): Promise<boolean> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const result = await drizzle
      .update(schema.users)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(schema.users.id, id));

    return result.changes > 0;
  }

  /**
   * Delete user using Drizzle ORM (soft delete, type-safe)
   * Alternative to deleteUser() above
   */
  async deleteUserDrizzle(id: string): Promise<boolean> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const result = await drizzle
      .update(schema.users)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(eq(schema.users.id, id));

    return result.changes > 0;
  }

  /**
   * Create user with optional business creation (Drizzle)
   * Complex operation with multi-entity creation and permission setup
   * NEW method - replaces createUser()
   */
  async createUserDrizzle(userData: {
    username: string;
    pin: string;
    email?: string;
    password?: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
    businessId?: string;
  }): Promise<User> {
    const db = this.getDrizzleInstance();
    const userId = this.uuid.v4();
    const businessId = userData.businessId || this.uuid.v4();
    const hashedPassword = userData.password
      ? await this.bcrypt.hash(userData.password, 10)
      : null;
    const now = new Date().toISOString();

    // Set permissions based on role
    let permissions: Permission[];
    switch (userData.role) {
      case "cashier":
        permissions = [
          { action: "read", resource: "sales" },
          { action: "create", resource: "transactions" },
          { action: "read", resource: "products" },
          { action: "read", resource: "basic_reports" },
        ];
        break;
      case "manager":
        permissions = [
          { action: "read", resource: "sales" },
          { action: "create", resource: "transactions" },
          { action: "void", resource: "transactions" },
          { action: "apply", resource: "discounts" },
          { action: "read", resource: "products" },
          { action: "update", resource: "inventory" },
          { action: "read", resource: "all_reports" },
          { action: "manage", resource: "staff_schedules" },
        ];
        break;
      case "admin":
        permissions = [{ action: "*", resource: "*" }];
        break;
    }

    // If businessId is provided, check that it exists
    if (userData.businessId) {
      const businessExists = await db
        .select({ id: schema.businesses.id })
        .from(schema.businesses)
        .where(eq(schema.businesses.id, userData.businessId))
        .get();

      if (!businessExists) {
        throw new Error("Business does not exist for provided businessId");
      }
    }

    // Use Drizzle transaction for atomicity
    db.transaction((tx) => {
      // 1. Create business if not provided
      if (!userData.businessId) {
        tx.insert(schema.businesses)
          .values({
            id: businessId,
            name: userData.businessName,
            ownerId: userId,
            address: null,
            phone: null,
            vatNumber: null,
            createdAt: now,
            updatedAt: now,
          })
          .run();

        // Note: createDefaultCategories would need to be called separately
        // or converted to use the transaction context
      }

      // 2. Create user
      tx.insert(schema.users)
        .values({
          id: userId,
          username: userData.username,
          pin: userData.pin,
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          businessName: userData.businessName,
          role: userData.role,
          businessId,
          permissions: JSON.stringify(permissions),
          isActive: true,
          address: "",
          createdAt: now,
          updatedAt: now,
        })
        .run();
    });

    // Create default categories if new business
    if (!userData.businessId) {
      await this.createDefaultCategories(businessId);
    }

    const user = await this.getUserByIdDrizzle(userId);
    if (!user) {
      throw new Error("User not found after creation");
    }
    return user;
  }

  // Category CRUD operations

  /**
   * Create a new category
   */
  async createCategory(categoryData: {
    name: string;
    description?: string;
    businessId: string;
    sortOrder?: number;
    parentId?: string | null;
  }): Promise<Category> {
    const categoryId = this.uuid.v4();
    const now = new Date().toISOString();

    // Get the next sort order if not provided
    const nextSortOrder =
      categoryData.sortOrder !== undefined
        ? categoryData.sortOrder
        : this.getNextCategorySortOrder(categoryData.businessId);

    this.db
      .prepare(
        `
        INSERT INTO categories (id, name, parentId, description, businessId, sortOrder, createdAt, updatedAt, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        categoryId,
        categoryData.name,
        categoryData.parentId || null,
        categoryData.description || "",
        categoryData.businessId,
        nextSortOrder,
        now,
        now,
        1
      );

    return this.getCategoryById(categoryId);
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: string): Category {
    const category = this.db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(id) as Category;

    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Get all categories for a business
   */
  getCategoriesByBusiness(businessId: string): Category[] {
    // Return categories as a flat list, but you can build a tree in UI
    return this.db
      .prepare(
        "SELECT * FROM categories WHERE businessId = ? AND isActive = 1 ORDER BY sortOrder ASC, name ASC"
      )
      .all(businessId) as Category[];
  }

  /**
   * Update category
   */
  updateCategory(
    id: string,
    updates: Partial<Omit<Category, "id" | "businessId" | "createdAt">>
  ): Category {
    const now = new Date().toISOString();
    const allowedFields = [
      "name",
      "description",
      "sortOrder",
      "isActive",
      "parentId",
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return this.getCategoryById(id);
    }

    updateFields.push("updatedAt = ?");
    updateValues.push(now, id);

    this.db
      .prepare(`UPDATE categories SET ${updateFields.join(", ")} WHERE id = ?`)
      .run(...updateValues);

    return this.getCategoryById(id);
  }

  /**
   * Delete category (soft delete)
   */
  deleteCategory(id: string): boolean {
    const now = new Date().toISOString();

    // Check if category is being used by any products
    const productsUsingCategory = this.db
      .prepare(
        "SELECT COUNT(*) as count FROM products WHERE category = ? AND isActive = 1"
      )
      .get(id) as { count: number };

    if (productsUsingCategory.count > 0) {
      throw new Error(
        `Cannot delete category. ${productsUsingCategory.count} products are still using this category.`
      );
    }

    const result = this.db
      .prepare("UPDATE categories SET isActive = 0, updatedAt = ? WHERE id = ?")
      .run(now, id);

    return result.changes > 0;
  }

  // ============================================
  // DRIZZLE ORM CATEGORY METHODS
  // ============================================

  /**
   * Get category by ID using Drizzle ORM (type-safe)
   * Alternative to getCategoryById() above
   */
  async getCategoryByIdDrizzle(id: string): Promise<Category> {
    const drizzle = this.getDrizzleInstance();

    const [category] = await drizzle
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    return {
      ...category,
      isActive: Boolean(category.isActive),
    } as Category;
  }

  /**
   * Get all categories for a business using Drizzle ORM (type-safe)
   * Alternative to getCategoriesByBusiness() above
   */
  async getCategoriesByBusinessDrizzle(
    businessId: string
  ): Promise<Category[]> {
    const drizzle = this.getDrizzleInstance();

    const categories = await drizzle
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.businessId, businessId),
          eq(schema.categories.isActive, true)
        )
      )
      .orderBy(schema.categories.sortOrder, schema.categories.name);

    return categories.map((cat) => ({
      ...cat,
      isActive: Boolean(cat.isActive),
    })) as Category[];
  }

  /**
   * Search categories by name using Drizzle ORM (type-safe)
   * NEW method - search functionality
   */
  async searchCategoriesDrizzle(
    businessId: string,
    searchTerm: string
  ): Promise<Category[]> {
    const drizzle = this.getDrizzleInstance();
    const searchPattern = `%${searchTerm}%`;

    const categories = await drizzle
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.businessId, businessId),
          eq(schema.categories.isActive, true),
          drizzleSql`(
            ${schema.categories.name} LIKE ${searchPattern} OR 
            ${schema.categories.description} LIKE ${searchPattern}
          )`
        )
      )
      .orderBy(schema.categories.name);

    return categories.map((cat) => ({
      ...cat,
      isActive: Boolean(cat.isActive),
    })) as Category[];
  }

  /**
   * Get category hierarchy (parent categories with subcategories)
   * NEW method - demonstrates self-join
   */
  async getCategoryHierarchyDrizzle(businessId: string) {
    const drizzle = this.getDrizzleInstance();

    // Get all categories for the business
    const categories = await drizzle
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.businessId, businessId),
          eq(schema.categories.isActive, true)
        )
      )
      .orderBy(schema.categories.sortOrder, schema.categories.name);

    // Build hierarchy (categories with parentId null are top-level)
    const categoryMap = new Map();
    const topLevel: any[] = [];

    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
        isActive: Boolean(cat.isActive),
      });
    });

    categories.forEach((cat) => {
      const category = categoryMap.get(cat.id);
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(category);
        }
      } else {
        topLevel.push(category);
      }
    });

    return topLevel;
  }

  /**
   * Create category using Drizzle ORM (type-safe)
   * Alternative to createCategory() above
   */
  async createCategoryDrizzle(categoryData: {
    name: string;
    description?: string;
    businessId: string;
    sortOrder?: number;
    parentId?: string | null;
  }): Promise<Category> {
    const drizzle = this.getDrizzleInstance();
    const categoryId = this.uuid.v4();
    const now = new Date().toISOString();

    // Get the next sort order if not provided
    const nextSortOrder =
      categoryData.sortOrder !== undefined
        ? categoryData.sortOrder
        : this.getNextCategorySortOrder(categoryData.businessId);

    await drizzle.insert(schema.categories).values({
      id: categoryId,
      name: categoryData.name,
      parentId: categoryData.parentId || null,
      description: categoryData.description || null,
      businessId: categoryData.businessId,
      sortOrder: nextSortOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return this.getCategoryByIdDrizzle(categoryId);
  }

  /**
   * Update category using Drizzle ORM (type-safe)
   * NEW method - type-safe updates
   */
  async updateCategoryDrizzle(
    id: string,
    updates: Partial<{
      name: string;
      description: string;
      parentId: string | null;
      sortOrder: number;
      isActive: boolean;
    }>
  ): Promise<Category> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    await drizzle
      .update(schema.categories)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(schema.categories.id, id));

    return this.getCategoryByIdDrizzle(id);
  }

  /**
   * Delete category using Drizzle ORM (soft delete, type-safe)
   * NEW method - type-safe soft delete
   */
  async deleteCategoryDrizzle(id: string): Promise<boolean> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    // Check if category is being used by any products
    const productsUsingCategory = await drizzle
      .select({ count: drizzleSql<number>`COUNT(*)` })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.category, id),
          eq(schema.products.isActive, true)
        )
      );

    const count = productsUsingCategory[0]?.count || 0;
    if (count > 0) {
      throw new Error(
        `Cannot delete category. ${count} products are still using this category.`
      );
    }

    const result = await drizzle
      .update(schema.categories)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(eq(schema.categories.id, id));

    return result.changes > 0;
  }

  /**
   * Get next sort order for categories in a business
   */
  private getNextCategorySortOrder(businessId: string): number {
    const maxOrder = this.db
      .prepare(
        "SELECT MAX(sortOrder) as maxOrder FROM categories WHERE businessId = ?"
      )
      .get(businessId) as { maxOrder: number | null };

    return (maxOrder?.maxOrder || 0) + 1;
  }

  /**
   * Reorder categories
   */
  reorderCategories(businessId: string, categoryIds: string[]): void {
    const transaction = this.db.transaction(() => {
      categoryIds.forEach((categoryId, index) => {
        this.db
          .prepare(
            "UPDATE categories SET sortOrder = ?, updatedAt = ? WHERE id = ? AND businessId = ?"
          )
          .run(index + 1, new Date().toISOString(), categoryId, businessId);
      });
    });

    transaction();
  }

  /**
   * Create default categories for a new business
   */
  createDefaultCategories(businessId: string): void {
    const defaultCategories = [
      { name: "Fresh Produce", description: "Fresh fruits and vegetables" },
      {
        name: "Dairy & Eggs",
        description: "Milk, cheese, eggs, and dairy products",
      },
      {
        name: "Meat & Poultry",
        description: "Fresh meat, chicken, and seafood",
      },
      { name: "Bakery", description: "Fresh bread, pastries, and baked goods" },
      {
        name: "Frozen Foods",
        description: "Frozen meals, ice cream, and frozen vegetables",
      },
      {
        name: "Pantry Essentials",
        description: "Canned goods, pasta, rice, and cooking essentials",
      },
      {
        name: "Snacks & Confectionery",
        description: "Chips, candy, chocolates, and snacks",
      },
      {
        name: "Beverages",
        description: "Soft drinks, juices, water, and beverages",
      },
      {
        name: "Health & Beauty",
        description: "Personal care and health products",
      },
      {
        name: "Household Items",
        description: "Cleaning supplies and household necessities",
      },
    ];

    const transaction = this.db.transaction(() => {
      defaultCategories.forEach((category, index) => {
        this.createCategory({
          name: category.name,
          description: category.description,
          businessId,
          sortOrder: index + 1,
        });
      });
    });

    transaction();
  }

  // Product CRUD operations

  /**
   * Create a new product
   */
  async createProduct(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt" | "modifiers">
  ): Promise<Product> {
    const productId = this.uuid.v4();
    const now = new Date().toISOString();

    // Debug logging
    console.log("createProduct called with data:", {
      name: productData.name,
      category: productData.category,
      categoryType: typeof productData.category,
      categoryLength: productData.category ? productData.category.length : 0,
      businessId: productData.businessId,
    });

    // Validate required fields
    if (!productData.category || productData.category.trim() === "") {
      throw new Error("Category is required and cannot be empty");
    }

    const result = this.db
      .prepare(
        `
      INSERT INTO products (
        id, name, description, price, costPrice, taxRate, sku, plu, 
        image, category, stockLevel, minStockLevel, businessId, isActive, 
        requiresWeight, unit, pricePerUnit, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        productId,
        productData.name,
        productData.description,
        productData.price,
        productData.costPrice,
        productData.taxRate,
        productData.sku,
        productData.plu,
        productData.image,
        productData.category, // Use category field directly
        productData.stockLevel,
        productData.minStockLevel,
        productData.businessId,
        productData.isActive ? 1 : 0,
        productData.requiresWeight ? 1 : 0,
        productData.unit || "each",
        productData.pricePerUnit || null,
        now,
        now
      );

    if (result.changes === 0) {
      throw new Error("Failed to create product");
    }

    return this.getProductById(productId);
  }

  /**
   * Get product by ID with modifiers
   */
  getProductById(id: string): Product {
    const product = this.db
      .prepare(
        `
      SELECT * FROM products WHERE id = ? AND isActive = 1
    `
      )
      .get(id) as any;

    if (!product) {
      throw new Error("Product not found");
    }

    // Get modifiers for this product
    const modifiers = this.getProductModifiers(id);
    console.log(
      `Retrieved ${modifiers.length} modifiers for product ${id}:`,
      modifiers
    );

    return {
      ...product,
      isActive: Boolean(product.isActive),
      requiresWeight: Boolean(product.requiresWeight),
      modifiers,
    };
  }

  /**
   * Get product by PLU code
   */
  getProductByPLU(plu: string): Product {
    const product = this.db
      .prepare(
        `
      SELECT * FROM products WHERE plu = ? AND isActive = 1
    `
      )
      .get(plu) as any;

    if (!product) {
      throw new Error("Product not found");
    }

    // Get modifiers for this product
    const modifiers = this.getProductModifiers(product.id);

    return {
      ...product,
      isActive: Boolean(product.isActive),
      requiresWeight: Boolean(product.requiresWeight),
      modifiers,
    };
  }

  /**
   * Get all products for a business
   */
  getProductsByBusiness(businessId: string): Product[] {
    const products = this.db
      .prepare(
        `
      SELECT * FROM products 
      WHERE businessId = ? AND isActive = 1 
      ORDER BY name ASC
    `
      )
      .all(businessId) as any[];

    return products.map((product) => ({
      ...product,
      isActive: Boolean(product.isActive),
      requiresWeight: Boolean(product.requiresWeight),
      modifiers: this.getProductModifiers(product.id),
    }));
  }

  /**
   * Update product
   */
  async updateProduct(
    id: string,
    updates: Partial<Omit<Product, "id" | "createdAt" | "modifiers">>
  ): Promise<Product> {
    const now = new Date().toISOString();

    // Build dynamic SQL for updates
    const fields = Object.keys(updates).filter((key) => key !== "modifiers");
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => {
      const value = updates[field as keyof typeof updates];
      // Convert boolean values to integers for SQLite
      if (typeof value === "boolean") {
        return value ? 1 : 0;
      }
      // Ensure other values are primitive types
      if (value === null || value === undefined) {
        return null;
      }
      return value;
    });

    if (fields.length === 0) {
      return this.getProductById(id);
    }

    const result = this.db
      .prepare(
        `
      UPDATE products 
      SET ${setClause}, updatedAt = ?
      WHERE id = ? AND isActive = 1
    `
      )
      .run(...values, now, id);

    if (result.changes === 0) {
      throw new Error("Product not found or update failed");
    }

    return this.getProductById(id);
  }

  /**
   * Delete product (soft delete)
   */
  deleteProduct(id: string): boolean {
    const result = this.db
      .prepare(
        `
      UPDATE products 
      SET isActive = 0, updatedAt = ?
      WHERE id = ? AND isActive = 1
    `
      )
      .run(new Date().toISOString(), id);

    return result.changes > 0;
  }

  // ============================================
  // DRIZZLE ORM PRODUCT METHODS
  // ============================================

  /**
   * Get products by business using Drizzle ORM (type-safe)
   * Alternative to getProductsByBusiness() above
   */
  async getProductsByBusinessDrizzle(businessId: string): Promise<Product[]> {
    const drizzle = this.getDrizzleInstance();

    const products = await drizzle
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.businessId, businessId),
          eq(schema.products.isActive, true)
        )
      )
      .orderBy(schema.products.name);

    return products as Product[];
  }

  /**
   * Search products by name or SKU using Drizzle ORM (type-safe)
   * NEW method - demonstrates search capabilities
   */
  async searchProductsDrizzle(
    businessId: string,
    searchTerm: string
  ): Promise<Product[]> {
    const drizzle = this.getDrizzleInstance();
    const searchPattern = `%${searchTerm}%`;

    const products = await drizzle
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.businessId, businessId),
          eq(schema.products.isActive, true),
          drizzleSql`(
            ${schema.products.name} LIKE ${searchPattern} OR 
            ${schema.products.sku} LIKE ${searchPattern}
          )`
        )
      )
      .orderBy(schema.products.name);

    return products as Product[];
  }

  /**
   * Get products with category details using Drizzle JOIN (type-safe)
   * NEW method - demonstrates JOIN queries with category
   */
  async getProductsWithCategoryDrizzle(businessId: string) {
    const drizzle = this.getDrizzleInstance();

    const products = await drizzle
      .select({
        product: schema.products,
        category: schema.categories,
      })
      .from(schema.products)
      .leftJoin(
        schema.categories,
        eq(schema.products.category, schema.categories.id)
      )
      .where(
        and(
          eq(schema.products.businessId, businessId),
          eq(schema.products.isActive, true)
        )
      )
      .orderBy(schema.products.name);

    return products;
  }

  /**
   * Get low stock products using Drizzle ORM (type-safe)
   * NEW method - demonstrates conditional filtering
   */
  async getLowStockProductsDrizzle(businessId: string, threshold: number = 10) {
    const drizzle = this.getDrizzleInstance();

    const products = await drizzle
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.businessId, businessId),
          eq(schema.products.isActive, true),
          drizzleSql`${schema.products.stockLevel} <= ${threshold}`
        )
      )
      .orderBy(schema.products.stockLevel);

    return products as Product[];
  }

  /**
   * Create product using Drizzle ORM (type-safe)
   * Alternative to createProduct() above
   */
  async createProductDrizzle(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt" | "modifiers">
  ): Promise<Product> {
    const drizzle = this.getDrizzleInstance();
    const productId = this.uuid.v4();
    const now = new Date().toISOString();

    // Validate required fields
    if (!productData.category || productData.category.trim() === "") {
      throw new Error("Category is required and cannot be empty");
    }

    await drizzle.insert(schema.products).values({
      id: productId,
      name: productData.name,
      description: productData.description || null,
      price: productData.price,
      costPrice: productData.costPrice || 0,
      taxRate: productData.taxRate || 0,
      sku: productData.sku,
      plu: productData.plu || null,
      image: productData.image || null,
      category: productData.category,
      stockLevel: productData.stockLevel || 0,
      minStockLevel: productData.minStockLevel || 0,
      businessId: productData.businessId,
      isActive: productData.isActive !== false,
      requiresWeight: productData.requiresWeight || false,
      unit: productData.unit || "each",
      pricePerUnit: productData.pricePerUnit || null,
      createdAt: now,
      updatedAt: now,
    });

    // Get the product with modifiers (use raw SQL method for now)
    return this.getProductById(productId);
  }

  /**
   * Update product using Drizzle ORM (type-safe)
   * NEW method - type-safe product updates
   */
  async updateProductDrizzle(
    id: string,
    updates: Partial<
      Omit<Product, "id" | "createdAt" | "updatedAt" | "modifiers">
    >
  ): Promise<Product> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    // Build the update object, converting booleans to integers for SQLite
    const updateData: any = {
      ...updates,
      updatedAt: now,
    };

    // Ensure booleans are converted properly if present
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }
    if (updates.requiresWeight !== undefined) {
      updateData.requiresWeight = updates.requiresWeight;
    }

    await drizzle
      .update(schema.products)
      .set(updateData)
      .where(eq(schema.products.id, id));

    return this.getProductById(id);
  }

  /**
   * Delete product using Drizzle ORM (soft delete, type-safe)
   * NEW method - type-safe soft delete
   */
  async deleteProductDrizzle(id: string): Promise<boolean> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const result = await drizzle
      .update(schema.products)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(
        and(eq(schema.products.id, id), eq(schema.products.isActive, true))
      );

    return result.changes > 0;
  }

  /**
   * Create a modifier
   */
  async createModifier(
    modifierData: Omit<Modifier, "id" | "createdAt" | "updatedAt" | "options">
  ): Promise<Modifier> {
    const modifierId = this.uuid.v4();
    const now = new Date().toISOString();

    const result = this.db
      .prepare(
        `
      INSERT INTO modifiers (id, name, type, required, businessId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        modifierId,
        modifierData.name,
        modifierData.type,
        modifierData.required ? 1 : 0,
        modifierData.businessId,
        now,
        now
      );

    if (result.changes === 0) {
      throw new Error("Failed to create modifier");
    }

    return this.getModifierById(modifierId);
  }

  /**
   * Get modifier by ID with options
   */
  getModifierById(id: string): Modifier {
    const modifier = this.db
      .prepare(
        `
      SELECT * FROM modifiers WHERE id = ?
    `
      )
      .get(id) as any;

    if (!modifier) {
      throw new Error("Modifier not found");
    }

    // Get options for this modifier
    const options = this.db
      .prepare(
        `
      SELECT * FROM modifier_options WHERE modifierId = ? ORDER BY name ASC
    `
      )
      .all(id) as ModifierOption[];

    return {
      ...modifier,
      required: Boolean(modifier.required),
      options,
    };
  }

  /**
   * Create modifier option
   */
  createModifierOption(
    modifierId: string,
    optionData: Omit<ModifierOption, "id" | "createdAt">
  ): ModifierOption {
    const optionId = this.uuid.v4();
    const now = new Date().toISOString();

    const result = this.db
      .prepare(
        `
      INSERT INTO modifier_options (id, modifierId, name, price, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(optionId, modifierId, optionData.name, optionData.price, now);

    if (result.changes === 0) {
      throw new Error("Failed to create modifier option");
    }

    return {
      id: optionId,
      name: optionData.name,
      price: optionData.price,
      createdAt: now,
    };
  }

  /**
   * Get modifiers for a specific product
   */
  getProductModifiers(productId: string): Modifier[] {
    const modifiers = this.db
      .prepare(
        `
      SELECT m.* FROM modifiers m
      JOIN product_modifiers pm ON m.id = pm.modifierId
      WHERE pm.productId = ?
      ORDER BY m.name ASC
    `
      )
      .all(productId) as any[];

    return modifiers.map((modifier) => ({
      ...modifier,
      required: Boolean(modifier.required),
      options: this.db
        .prepare(
          `
        SELECT * FROM modifier_options WHERE modifierId = ? ORDER BY name ASC
      `
        )
        .all(modifier.id) as ModifierOption[],
    }));
  }

  /**
   * Add modifier to product
   */
  addModifierToProduct(productId: string, modifierId: string): void {
    this.db
      .prepare(
        `
      INSERT OR IGNORE INTO product_modifiers (productId, modifierId)
      VALUES (?, ?)
    `
      )
      .run(productId, modifierId);
  }

  /**
   * Remove modifier from product
   */
  removeModifierFromProduct(productId: string, modifierId: string): void {
    this.db
      .prepare(
        `
      DELETE FROM product_modifiers 
      WHERE productId = ? AND modifierId = ?
    `
      )
      .run(productId, modifierId);
  }

  // ============================================
  // DRIZZLE ORM MODIFIER METHODS
  // ============================================

  /**
   * Get modifier by ID using Drizzle ORM (type-safe)
   * Alternative to getModifierById() above
   */
  async getModifierByIdDrizzle(id: string): Promise<Modifier> {
    const drizzle = this.getDrizzleInstance();

    const [modifier] = await drizzle
      .select()
      .from(schema.modifiers)
      .where(eq(schema.modifiers.id, id))
      .limit(1);

    if (!modifier) {
      throw new Error("Modifier not found");
    }

    // Get options for this modifier
    const options = await drizzle
      .select()
      .from(schema.modifierOptions)
      .where(eq(schema.modifierOptions.modifierId, id))
      .orderBy(schema.modifierOptions.name);

    return {
      ...modifier,
      required: Boolean(modifier.required),
      options: options as ModifierOption[],
    };
  }

  /**
   * Get modifiers for a business using Drizzle ORM (type-safe)
   * NEW method - list all modifiers
   */
  async getModifiersByBusinessDrizzle(businessId: string): Promise<Modifier[]> {
    const drizzle = this.getDrizzleInstance();

    const modifiers = await drizzle
      .select()
      .from(schema.modifiers)
      .where(eq(schema.modifiers.businessId, businessId))
      .orderBy(schema.modifiers.name);

    // Get options for each modifier
    const modifiersWithOptions = await Promise.all(
      modifiers.map(async (modifier) => {
        const options = await drizzle
          .select()
          .from(schema.modifierOptions)
          .where(eq(schema.modifierOptions.modifierId, modifier.id))
          .orderBy(schema.modifierOptions.name);

        return {
          ...modifier,
          required: Boolean(modifier.required),
          options: options as ModifierOption[],
        };
      })
    );

    return modifiersWithOptions;
  }

  /**
   * Get modifiers for a product using Drizzle ORM (type-safe with JOIN)
   * Alternative to getProductModifiers() above
   */
  async getProductModifiersDrizzle(productId: string): Promise<Modifier[]> {
    const drizzle = this.getDrizzleInstance();

    // Get modifiers linked to this product
    const productModifiers = await drizzle
      .select({
        modifier: schema.modifiers,
      })
      .from(schema.productModifiers)
      .innerJoin(
        schema.modifiers,
        eq(schema.productModifiers.modifierId, schema.modifiers.id)
      )
      .where(eq(schema.productModifiers.productId, productId))
      .orderBy(schema.modifiers.name);

    // Get options for each modifier
    const modifiersWithOptions = await Promise.all(
      productModifiers.map(async ({ modifier }) => {
        const options = await drizzle
          .select()
          .from(schema.modifierOptions)
          .where(eq(schema.modifierOptions.modifierId, modifier.id))
          .orderBy(schema.modifierOptions.name);

        return {
          ...modifier,
          required: Boolean(modifier.required),
          options: options as ModifierOption[],
        };
      })
    );

    return modifiersWithOptions;
  }

  /**
   * Create modifier using Drizzle ORM (type-safe)
   * Alternative to createModifier() above
   */
  async createModifierDrizzle(
    modifierData: Omit<Modifier, "id" | "createdAt" | "updatedAt" | "options">
  ): Promise<Modifier> {
    const drizzle = this.getDrizzleInstance();
    const modifierId = this.uuid.v4();
    const now = new Date().toISOString();

    await drizzle.insert(schema.modifiers).values({
      id: modifierId,
      name: modifierData.name,
      type: modifierData.type,
      required: modifierData.required || false,
      businessId: modifierData.businessId,
      createdAt: now,
      updatedAt: now,
    });

    return this.getModifierByIdDrizzle(modifierId);
  }

  /**
   * Create modifier option using Drizzle ORM (type-safe)
   * NEW method - add options to modifiers
   */
  async createModifierOptionDrizzle(
    modifierId: string,
    optionData: Omit<ModifierOption, "id" | "createdAt">
  ): Promise<ModifierOption> {
    const drizzle = this.getDrizzleInstance();
    const optionId = this.uuid.v4();
    const now = new Date().toISOString();

    await drizzle.insert(schema.modifierOptions).values({
      id: optionId,
      modifierId,
      name: optionData.name,
      price: optionData.price || 0,
      createdAt: now,
    });

    const [option] = await drizzle
      .select()
      .from(schema.modifierOptions)
      .where(eq(schema.modifierOptions.id, optionId))
      .limit(1);

    return option as ModifierOption;
  }

  /**
   * Add modifier to product using Drizzle ORM (type-safe)
   * NEW method - link modifier to product
   */
  async addModifierToProductDrizzle(
    productId: string,
    modifierId: string
  ): Promise<void> {
    const drizzle = this.getDrizzleInstance();

    await drizzle.insert(schema.productModifiers).values({
      productId,
      modifierId,
    });
  }

  /**
   * Remove modifier from product using Drizzle ORM (type-safe)
   * NEW method - unlink modifier from product
   */
  async removeModifierFromProductDrizzle(
    productId: string,
    modifierId: string
  ): Promise<void> {
    const drizzle = this.getDrizzleInstance();

    await drizzle
      .delete(schema.productModifiers)
      .where(
        and(
          eq(schema.productModifiers.productId, productId),
          eq(schema.productModifiers.modifierId, modifierId)
        )
      );
  }

  /**
   * Create stock adjustment and update product stock
   */
  createStockAdjustment(
    adjustmentData: Omit<StockAdjustment, "id" | "timestamp">
  ): StockAdjustment {
    const adjustmentId = this.uuid.v4();
    const now = new Date().toISOString();

    // Start transaction
    const transaction = this.db.transaction(() => {
      // Create adjustment record
      this.db
        .prepare(
          `
        INSERT INTO stock_adjustments (id, productId, type, quantity, reason, userId, businessId, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          adjustmentId,
          adjustmentData.productId,
          adjustmentData.type,
          adjustmentData.quantity,
          adjustmentData.reason,
          adjustmentData.userId,
          adjustmentData.businessId,
          now
        );

      // Update product stock level
      const stockChange =
        adjustmentData.type === "add"
          ? adjustmentData.quantity
          : -adjustmentData.quantity;
      this.db
        .prepare(
          `
        UPDATE products 
        SET stockLevel = MAX(0, stockLevel + ?), updatedAt = ?
        WHERE id = ?
      `
        )
        .run(stockChange, now, adjustmentData.productId);
    });

    transaction();

    return {
      id: adjustmentId,
      ...adjustmentData,
      timestamp: now,
    };
  }

  /**
   * Get stock adjustments for a product
   */
  getStockAdjustments(productId: string): StockAdjustment[] {
    return this.db
      .prepare(
        `
      SELECT * FROM stock_adjustments 
      WHERE productId = ? 
      ORDER BY timestamp DESC
    `
      )
      .all(productId) as StockAdjustment[];
  }

  // ============================================
  // DRIZZLE ORM STOCK ADJUSTMENT METHODS
  // ============================================

  /**
   * Create stock adjustment using Drizzle ORM (type-safe with transaction)
   * Alternative to createStockAdjustment() above
   */
  async createStockAdjustmentDrizzle(
    adjustmentData: Omit<StockAdjustment, "id" | "timestamp">
  ): Promise<StockAdjustment> {
    const drizzle = this.getDrizzleInstance();
    const adjustmentId = this.uuid.v4();
    const now = new Date().toISOString();

    // Start transaction for atomic operation
    await drizzle.transaction(async (tx) => {
      // Create adjustment record
      await tx.insert(schema.stockAdjustments).values({
        id: adjustmentId,
        productId: adjustmentData.productId,
        type: adjustmentData.type,
        quantity: adjustmentData.quantity,
        reason: adjustmentData.reason || null,
        userId: adjustmentData.userId,
        businessId: adjustmentData.businessId,
        timestamp: now,
      });

      // Update product stock level based on adjustment type
      const currentProduct = await tx
        .select({ stockLevel: schema.products.stockLevel })
        .from(schema.products)
        .where(eq(schema.products.id, adjustmentData.productId))
        .limit(1);

      if (currentProduct.length === 0) {
        throw new Error("Product not found");
      }

      let newStockLevel = currentProduct[0].stockLevel ?? 0;
      if (adjustmentData.type === "add") {
        newStockLevel += adjustmentData.quantity;
      } else if (
        ["remove", "sale", "waste", "adjustment"].includes(adjustmentData.type)
      ) {
        newStockLevel -= adjustmentData.quantity;
      }

      // Update product stock
      await tx
        .update(schema.products)
        .set({
          stockLevel: newStockLevel,
          updatedAt: now,
        })
        .where(eq(schema.products.id, adjustmentData.productId));
    });

    // Return the created adjustment
    const [adjustment] = await drizzle
      .select()
      .from(schema.stockAdjustments)
      .where(eq(schema.stockAdjustments.id, adjustmentId))
      .limit(1);

    return adjustment as StockAdjustment;
  }

  /**
   * Get stock adjustments using Drizzle ORM (type-safe)
   * Alternative to getStockAdjustments() above
   */
  async getStockAdjustmentsDrizzle(
    productId: string
  ): Promise<StockAdjustment[]> {
    const drizzle = this.getDrizzleInstance();

    const adjustments = await drizzle
      .select()
      .from(schema.stockAdjustments)
      .where(eq(schema.stockAdjustments.productId, productId))
      .orderBy(desc(schema.stockAdjustments.timestamp));

    return adjustments as StockAdjustment[];
  }

  /**
   * Get stock adjustment history for a business using Drizzle ORM
   * NEW method - business-wide stock history
   */
  async getBusinessStockAdjustmentsDrizzle(
    businessId: string,
    limit: number = 100
  ): Promise<StockAdjustment[]> {
    const drizzle = this.getDrizzleInstance();

    const adjustments = await drizzle
      .select()
      .from(schema.stockAdjustments)
      .where(eq(schema.stockAdjustments.businessId, businessId))
      .orderBy(desc(schema.stockAdjustments.timestamp))
      .limit(limit);

    return adjustments as StockAdjustment[];
  }

  // App Settings Management (for key-value storage like auth tokens, user preferences)

  /**
   * Set a key-value pair in app settings
   */
  setSetting(key: string, value: string): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
      INSERT OR REPLACE INTO app_settings (key, value, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `
      )
      .run(key, value, now, now);
  }

  /**
   * Get a value from app settings
   */
  getSetting(key: string): string | null {
    const result = this.db
      .prepare("SELECT value FROM app_settings WHERE key = ?")
      .get(key);
    return result ? result.value : null;
  }

  /**
   * Delete a setting
   */
  deleteSetting(key: string): void {
    this.db.prepare("DELETE FROM app_settings WHERE key = ?").run(key);
  }

  /**
   * Clear all settings
   */
  clearAllSettings(): void {
    this.db.prepare("DELETE FROM app_settings").run();
  }

  // Schedule Management Methods
  createSchedule(
    schedule: Omit<Schedule, "id" | "createdAt" | "updatedAt">
  ): Schedule {
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO schedules (id, staffId, businessId, startTime, endTime, status, assignedRegister, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      schedule.staffId,
      schedule.businessId,
      schedule.startTime,
      schedule.endTime,
      schedule.status,
      schedule.assignedRegister || null,
      schedule.notes || null,
      now,
      now
    );

    return {
      ...schedule,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  getSchedulesByBusinessId(businessId: string): Schedule[] {
    const stmt = this.db.prepare(`
      SELECT * FROM schedules WHERE businessId = ? ORDER BY startTime ASC
    `);
    return stmt.all(businessId) as Schedule[];
  }

  getSchedulesByStaffId(staffId: string): Schedule[] {
    const stmt = this.db.prepare(`
      SELECT * FROM schedules WHERE staffId = ? ORDER BY startTime ASC
    `);
    return stmt.all(staffId) as Schedule[];
  }

  updateScheduleStatus(scheduleId: string, status: Schedule["status"]): void {
    const stmt = this.db.prepare(`
      UPDATE schedules SET status = ?, updatedAt = ? WHERE id = ?
    `);
    stmt.run(status, new Date().toISOString(), scheduleId);
  }

  updateSchedule(
    scheduleId: string,
    updates: Partial<
      Pick<
        Schedule,
        | "staffId"
        | "startTime"
        | "endTime"
        | "assignedRegister"
        | "notes"
        | "status"
      >
    >
  ): Schedule {
    const now = new Date().toISOString();

    // Build dynamic UPDATE query based on provided fields
    const fields = [];
    const values = [];

    if (updates.staffId !== undefined) {
      fields.push("staffId = ?");
      values.push(updates.staffId);
    }
    if (updates.startTime !== undefined) {
      fields.push("startTime = ?");
      values.push(updates.startTime);
    }
    if (updates.endTime !== undefined) {
      fields.push("endTime = ?");
      values.push(updates.endTime);
    }
    if (updates.assignedRegister !== undefined) {
      fields.push("assignedRegister = ?");
      values.push(updates.assignedRegister);
    }
    if (updates.notes !== undefined) {
      fields.push("notes = ?");
      values.push(updates.notes);
    }
    if (updates.status !== undefined) {
      fields.push("status = ?");
      values.push(updates.status);
    }

    // Always update the updatedAt timestamp
    fields.push("updatedAt = ?");
    values.push(now);
    values.push(scheduleId);

    if (fields.length === 1) {
      // Only updatedAt was added
      throw new Error("No fields to update");
    }

    const stmt = this.db.prepare(`
      UPDATE schedules SET ${fields.join(", ")} WHERE id = ?
    `);
    stmt.run(...values);

    // Return the updated schedule
    const getStmt = this.db.prepare(`
      SELECT * FROM schedules WHERE id = ?
    `);
    const updated = getStmt.get(scheduleId) as Schedule;

    if (!updated) {
      throw new Error("Schedule not found after update");
    }

    return updated;
  }

  deleteSchedule(scheduleId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM schedules WHERE id = ?
    `);
    const result = stmt.run(scheduleId);

    if (result.changes === 0) {
      throw new Error("Schedule not found");
    }
  }

  // ============================================
  // DRIZZLE ORM SCHEDULE METHODS
  // ============================================

  /**
   * Create schedule (Drizzle)
   */
  createScheduleDrizzle(
    schedule: Omit<Schedule, "id" | "createdAt" | "updatedAt">
  ): Schedule {
    const db = this.getDrizzleInstance();
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    db.insert(schema.schedules)
      .values({
        id,
        staffId: schedule.staffId,
        businessId: schedule.businessId,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        status: schedule.status,
        assignedRegister: schedule.assignedRegister ?? null,
        notes: schedule.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return {
      ...schedule,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get schedules by business ID (Drizzle)
   */
  getSchedulesByBusinessIdDrizzle(businessId: string): Schedule[] {
    const db = this.getDrizzleInstance();

    const result = db
      .select()
      .from(schema.schedules)
      .where(eq(schema.schedules.businessId, businessId))
      .orderBy(asc(schema.schedules.startTime))
      .all();

    return result.map((s) => ({
      ...s,
      assignedRegister: s.assignedRegister ?? undefined,
      notes: s.notes ?? undefined,
    }));
  }

  /**
   * Get schedules by staff ID (Drizzle)
   */
  getSchedulesByStaffIdDrizzle(staffId: string): Schedule[] {
    const db = this.getDrizzleInstance();

    const result = db
      .select()
      .from(schema.schedules)
      .where(eq(schema.schedules.staffId, staffId))
      .orderBy(asc(schema.schedules.startTime))
      .all();

    return result.map((s) => ({
      ...s,
      assignedRegister: s.assignedRegister ?? undefined,
      notes: s.notes ?? undefined,
    }));
  }

  /**
   * Update schedule status (Drizzle)
   */
  updateScheduleStatusDrizzle(
    scheduleId: string,
    status: Schedule["status"]
  ): void {
    const db = this.getDrizzleInstance();
    const now = new Date().toISOString();

    db.update(schema.schedules)
      .set({
        status,
        updatedAt: now,
      })
      .where(eq(schema.schedules.id, scheduleId))
      .run();
  }

  /**
   * Update schedule (Drizzle)
   */
  updateScheduleDrizzle(
    scheduleId: string,
    updates: Partial<
      Pick<
        Schedule,
        | "staffId"
        | "startTime"
        | "endTime"
        | "assignedRegister"
        | "notes"
        | "status"
      >
    >
  ): Schedule {
    const db = this.getDrizzleInstance();
    const now = new Date().toISOString();

    // Build update object
    const updateData: any = { updatedAt: now };

    if (updates.staffId !== undefined) updateData.staffId = updates.staffId;
    if (updates.startTime !== undefined)
      updateData.startTime = updates.startTime;
    if (updates.endTime !== undefined) updateData.endTime = updates.endTime;
    if (updates.assignedRegister !== undefined)
      updateData.assignedRegister = updates.assignedRegister ?? null;
    if (updates.notes !== undefined) updateData.notes = updates.notes ?? null;
    if (updates.status !== undefined) updateData.status = updates.status;

    if (Object.keys(updateData).length === 1) {
      throw new Error("No fields to update");
    }

    db.update(schema.schedules)
      .set(updateData)
      .where(eq(schema.schedules.id, scheduleId))
      .run();

    // Return the updated schedule
    const updated = db
      .select()
      .from(schema.schedules)
      .where(eq(schema.schedules.id, scheduleId))
      .get();

    if (!updated) {
      throw new Error("Schedule not found after update");
    }

    return {
      ...updated,
      assignedRegister: updated.assignedRegister ?? undefined,
      notes: updated.notes ?? undefined,
    };
  }

  /**
   * Delete schedule (Drizzle)
   */
  deleteScheduleDrizzle(scheduleId: string): void {
    const db = this.getDrizzleInstance();

    const result = db
      .delete(schema.schedules)
      .where(eq(schema.schedules.id, scheduleId))
      .run();

    if (result.changes === 0) {
      throw new Error("Schedule not found");
    }
  }

  // Shift Management Methods
  createShift(shift: Omit<Shift, "id" | "createdAt" | "updatedAt">): Shift {
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO shifts (
        id, scheduleId, cashierId, businessId, startTime, endTime, status, 
        startingCash, finalCashDrawer, expectedCashDrawer, cashVariance, 
        totalSales, totalTransactions, totalRefunds, totalVoids, notes, 
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      shift.scheduleId || null,
      shift.cashierId,
      shift.businessId,
      shift.startTime,
      shift.endTime || null,
      shift.status,
      shift.startingCash,
      shift.finalCashDrawer || null,
      shift.expectedCashDrawer || null,
      shift.cashVariance || null,
      shift.totalSales || 0,
      shift.totalTransactions || 0,
      shift.totalRefunds || 0,
      shift.totalVoids || 0,
      shift.notes || null,
      now,
      now
    );

    return {
      ...shift,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  getActiveShiftByCashier(cashierId: string): Shift | null {
    const stmt = this.db.prepare(`
      SELECT * FROM shifts WHERE cashierId = ? AND status = 'active' ORDER BY startTime DESC LIMIT 1
    `);
    return (stmt.get(cashierId) as Shift) || null;
  }

  // Get active shift for cashier, but only if it started today or within the last 24 hours
  // This prevents old unclosed shifts from interfering with new shifts
  getTodaysActiveShiftByCashier(cashierId: string): Shift | null {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(6, 0, 0, 0); // Consider shifts from 6 AM yesterday to account for night shifts

    const stmt = this.db.prepare(`
      SELECT * FROM shifts 
      WHERE cashierId = ? 
        AND status = 'active' 
        AND startTime >= ? 
      ORDER BY startTime DESC 
      LIMIT 1
    `);
    return (stmt.get(cashierId, yesterday.toISOString()) as Shift) || null;
  }

  // Auto-close old unclosed shifts that are more than 24 hours old
  // This should be called periodically to clean up abandoned shifts
  autoCloseOldActiveShifts(): number {
    const now = new Date();
    const nowString = now.toISOString();

    // 1. Close shifts older than 24 hours (basic cleanup)
    const basicCutoffTime = new Date(now);
    basicCutoffTime.setDate(basicCutoffTime.getDate() - 1);
    basicCutoffTime.setHours(6, 0, 0, 0);

    // 2. Get all active shifts to check individually
    const activeShiftsStmt = this.db.prepare(`
      SELECT s.*, sch.endTime as scheduledEndTime 
      FROM shifts s
      LEFT JOIN schedules sch ON s.scheduleId = sch.id
      WHERE s.status = 'active'
    `);
    const activeShifts = activeShiftsStmt.all();

    let closedCount = 0;

    for (const shift of activeShifts) {
      let shouldClose = false;
      let closeReason = "";

      const shiftStart = new Date(shift.startTime);

      // Rule 1: Close shifts older than 24 hours
      if (shiftStart < basicCutoffTime) {
        shouldClose = true;
        closeReason =
          "Auto-closed - shift was left open for more than 24 hours";
      }

      // Rule 2: Close shifts that are way past their scheduled end time
      else if (shift.scheduledEndTime) {
        const scheduledEnd = new Date(shift.scheduledEndTime);
        const hoursOverdue =
          (now.getTime() - scheduledEnd.getTime()) / (1000 * 60 * 60);

        // Close shifts that are more than 4 hours past scheduled end time
        if (hoursOverdue > 4) {
          shouldClose = true;
          closeReason = `Auto-closed - shift was ${Math.round(
            hoursOverdue
          )} hours past scheduled end time`;
        }
      }

      // Rule 3: Close shifts that started more than 16 hours ago (even without schedule)
      else {
        const hoursActive =
          (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
        if (hoursActive > 16) {
          shouldClose = true;
          closeReason = `Auto-closed - shift was active for ${Math.round(
            hoursActive
          )} hours without schedule`;
        }
      }

      if (shouldClose) {
        // Calculate estimated cash drawer based on sales
        const estimatedCash = shift.startingCash + (shift.totalSales || 0);

        const updateStmt = this.db.prepare(`
          UPDATE shifts 
          SET 
            status = 'ended',
            endTime = ?,
            finalCashDrawer = ?,
            expectedCashDrawer = ?,
            notes = COALESCE(notes || '; ', '') || ?
          WHERE id = ?
        `);

        updateStmt.run(
          nowString,
          estimatedCash,
          estimatedCash,
          closeReason,
          shift.id
        );

        closedCount++;
        console.log(`Auto-closed shift ${shift.id}: ${closeReason}`);
      }
    }

    return closedCount;
  }

  // Check for shifts that should be auto-ended today (more aggressive than the 24-hour cleanup)
  // This is called when someone tries to start a new shift or when checking active shifts
  autoEndOverdueShiftsToday(): number {
    const now = new Date();
    const nowString = now.toISOString();

    const activeShiftsStmt = this.db.prepare(`
      SELECT s.*, sch.endTime as scheduledEndTime 
      FROM shifts s
      LEFT JOIN schedules sch ON s.scheduleId = sch.id
      WHERE s.status = 'active'
        AND DATE(s.startTime) = DATE(?)
    `);
    const activeShifts = activeShiftsStmt.all(nowString);

    let closedCount = 0;

    for (const shift of activeShifts) {
      let shouldClose = false;
      let closeReason = "";

      if (shift.scheduledEndTime) {
        const scheduledEnd = new Date(shift.scheduledEndTime);
        const hoursOverdue =
          (now.getTime() - scheduledEnd.getTime()) / (1000 * 60 * 60);

        // More aggressive: Close shifts that are 2+ hours past scheduled end time
        if (hoursOverdue > 2) {
          shouldClose = true;
          closeReason = `Auto-closed - shift was ${Math.round(
            hoursOverdue
          )} hours past scheduled end time`;
        }
      } else {
        // No schedule - close if active for more than 12 hours
        const shiftStart = new Date(shift.startTime);
        const hoursActive =
          (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
        if (hoursActive > 12) {
          shouldClose = true;
          closeReason = `Auto-closed - shift was active for ${Math.round(
            hoursActive
          )} hours without schedule`;
        }
      }

      if (shouldClose) {
        const estimatedCash = shift.startingCash + (shift.totalSales || 0);

        const updateStmt = this.db.prepare(`
          UPDATE shifts 
          SET 
            status = 'ended',
            endTime = ?,
            finalCashDrawer = ?,
            expectedCashDrawer = ?,
            notes = COALESCE(notes || '; ', '') || ?
          WHERE id = ?
        `);

        updateStmt.run(
          nowString,
          estimatedCash,
          estimatedCash,
          closeReason,
          shift.id
        );

        closedCount++;
        console.log(`Auto-ended overdue shift ${shift.id}: ${closeReason}`);
      }
    }

    return closedCount;
  }

  endShift(
    shiftId: string,
    endData: {
      endTime: string;
      finalCashDrawer: number;
      expectedCashDrawer: number;
      totalSales: number;
      totalTransactions: number;
      totalRefunds: number;
      totalVoids: number;
      notes?: string;
    }
  ): void {
    const cashVariance = endData.finalCashDrawer - endData.expectedCashDrawer;

    const stmt = this.db.prepare(`
      UPDATE shifts SET 
        endTime = ?, 
        status = 'ended',
        finalCashDrawer = ?,
        expectedCashDrawer = ?,
        cashVariance = ?,
        totalSales = ?,
        totalTransactions = ?,
        totalRefunds = ?,
        totalVoids = ?,
        notes = ?,
        updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      endData.endTime,
      endData.finalCashDrawer,
      endData.expectedCashDrawer,
      cashVariance,
      endData.totalSales,
      endData.totalTransactions,
      endData.totalRefunds,
      endData.totalVoids,
      endData.notes || null,
      new Date().toISOString(),
      shiftId
    );
  }

  getShiftsByBusinessId(businessId: string): Shift[] {
    const stmt = this.db.prepare(`
      SELECT * FROM shifts WHERE businessId = ? ORDER BY startTime DESC
    `);
    return stmt.all(businessId) as Shift[];
  }

  getHourlyTransactionStats(shiftId: string): {
    lastHour: number;
    currentHour: number;
    averagePerHour: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const currentHourStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      0,
      0
    );

    // Get transactions from the last hour
    const lastHourStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM transactions 
      WHERE shiftId = ? 
        AND timestamp >= ? 
        AND timestamp <= ?
        AND status = 'completed'
    `);
    const lastHourResult = lastHourStmt.get(
      shiftId,
      oneHourAgo.toISOString(),
      now.toISOString()
    ) as { count: number };

    // Get transactions from current hour
    const currentHourStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM transactions 
      WHERE shiftId = ? 
        AND timestamp >= ?
        AND status = 'completed'
    `);
    const currentHourResult = currentHourStmt.get(
      shiftId,
      currentHourStart.toISOString()
    ) as { count: number };

    // Get shift start time for average calculation
    const shiftStmt = this.db.prepare(
      `SELECT startTime FROM shifts WHERE id = ?`
    );
    const shift = shiftStmt.get(shiftId) as { startTime: string } | undefined;

    let averagePerHour = 0;
    if (shift) {
      const shiftStart = new Date(shift.startTime);
      const hoursWorked = Math.max(
        (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60),
        0.1
      ); // Minimum 0.1 hour to avoid division by zero

      const totalTransactionsStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM transactions 
        WHERE shiftId = ? AND status = 'completed'
      `);
      const totalResult = totalTransactionsStmt.get(shiftId) as {
        count: number;
      };
      averagePerHour = totalResult.count / hoursWorked;
    }

    return {
      lastHour: lastHourResult.count,
      currentHour: currentHourResult.count,
      averagePerHour: Math.round(averagePerHour * 10) / 10, // Round to 1 decimal place
    };
  }

  getShiftById(shiftId: string): Shift | null {
    const stmt = this.db.prepare("SELECT * FROM shifts WHERE id = ?");
    return (stmt.get(shiftId) as Shift) || null;
  }

  // ============================================
  // DRIZZLE ORM SHIFT METHODS
  // ============================================

  /**
   * Get shift by ID using Drizzle ORM (type-safe)
   * Alternative to getShiftById() above
   */
  async getShiftByIdDrizzle(shiftId: string): Promise<Shift | null> {
    const drizzle = this.getDrizzleInstance();

    const [shift] = await drizzle
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shiftId))
      .limit(1);

    if (!shift) return null;

    return {
      ...shift,
      scheduleId: shift.scheduleId ?? undefined,
      endTime: shift.endTime ?? undefined,
      finalCashDrawer: shift.finalCashDrawer ?? undefined,
      expectedCashDrawer: shift.expectedCashDrawer ?? undefined,
      cashVariance: shift.cashVariance ?? undefined,
      notes: shift.notes ?? undefined,
    } as Shift;
  }

  /**
   * Get active shift by cashier using Drizzle ORM (type-safe)
   * Alternative to getActiveShiftByCashier() above
   */
  async getActiveShiftByCashierDrizzle(
    cashierId: string
  ): Promise<Shift | null> {
    const drizzle = this.getDrizzleInstance();

    const [shift] = await drizzle
      .select()
      .from(schema.shifts)
      .where(
        and(
          eq(schema.shifts.cashierId, cashierId),
          eq(schema.shifts.status, "active")
        )
      )
      .orderBy(desc(schema.shifts.startTime))
      .limit(1);

    if (!shift) return null;

    return {
      ...shift,
      scheduleId: shift.scheduleId ?? undefined,
      endTime: shift.endTime ?? undefined,
      finalCashDrawer: shift.finalCashDrawer ?? undefined,
      expectedCashDrawer: shift.expectedCashDrawer ?? undefined,
      cashVariance: shift.cashVariance ?? undefined,
      notes: shift.notes ?? undefined,
    } as Shift;
  }

  /**
   * Get shifts by business using Drizzle ORM (type-safe)
   * Alternative to getShiftsByBusinessId() above
   */
  async getShiftsByBusinessDrizzle(businessId: string): Promise<Shift[]> {
    const drizzle = this.getDrizzleInstance();

    const shifts = await drizzle
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.businessId, businessId))
      .orderBy(desc(schema.shifts.startTime));

    return shifts.map((shift) => ({
      ...shift,
      scheduleId: shift.scheduleId ?? undefined,
      endTime: shift.endTime ?? undefined,
      finalCashDrawer: shift.finalCashDrawer ?? undefined,
      expectedCashDrawer: shift.expectedCashDrawer ?? undefined,
      cashVariance: shift.cashVariance ?? undefined,
      notes: shift.notes ?? undefined,
    })) as Shift[];
  }

  /**
   * Get shifts by date range using Drizzle ORM (type-safe)
   * NEW method - date range filtering
   */
  async getShiftsByDateRangeDrizzle(
    businessId: string,
    startDate: string,
    endDate: string
  ): Promise<Shift[]> {
    const drizzle = this.getDrizzleInstance();

    const shifts = await drizzle
      .select()
      .from(schema.shifts)
      .where(
        and(
          eq(schema.shifts.businessId, businessId),
          drizzleSql`${schema.shifts.startTime} >= ${startDate}`,
          drizzleSql`${schema.shifts.startTime} <= ${endDate}`
        )
      )
      .orderBy(desc(schema.shifts.startTime));

    return shifts.map((shift) => ({
      ...shift,
      scheduleId: shift.scheduleId ?? undefined,
      endTime: shift.endTime ?? undefined,
      finalCashDrawer: shift.finalCashDrawer ?? undefined,
      expectedCashDrawer: shift.expectedCashDrawer ?? undefined,
      cashVariance: shift.cashVariance ?? undefined,
      notes: shift.notes ?? undefined,
    })) as Shift[];
  }

  /**
   * Get shift statistics using Drizzle ORM (type-safe)
   * NEW method - shift analytics
   */
  async getShiftStatsDrizzle(shiftId: string) {
    const drizzle = this.getDrizzleInstance();

    // Get shift details
    const [shift] = await drizzle
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shiftId))
      .limit(1);

    if (!shift) return null;

    // Get transaction count and totals
    const stats = await drizzle
      .select({
        transactionCount: drizzleSql<number>`COUNT(*)`,
        totalSales: drizzleSql<number>`COALESCE(SUM(${schema.transactions.total}), 0)`,
        cashSales: drizzleSql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.paymentMethod} = 'cash' THEN ${schema.transactions.total} ELSE 0 END), 0)`,
        cardSales: drizzleSql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.paymentMethod} = 'card' THEN ${schema.transactions.total} ELSE 0 END), 0)`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.shiftId, shiftId),
          eq(schema.transactions.status, "completed")
        )
      );

    return {
      shift,
      stats: stats[0],
    };
  }

  /**
   * Create shift (Drizzle)
   * NEW method - replaces createShift()
   */
  createShiftDrizzle(
    shift: Omit<Shift, "id" | "createdAt" | "updatedAt">
  ): Shift {
    const db = this.getDrizzleInstance();
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    db.insert(schema.shifts)
      .values({
        id,
        scheduleId: shift.scheduleId ?? null,
        cashierId: shift.cashierId,
        businessId: shift.businessId,
        startTime: shift.startTime,
        endTime: shift.endTime ?? null,
        status: shift.status,
        startingCash: shift.startingCash,
        finalCashDrawer: shift.finalCashDrawer ?? null,
        expectedCashDrawer: shift.expectedCashDrawer ?? null,
        cashVariance: shift.cashVariance ?? null,
        totalSales: shift.totalSales ?? 0,
        totalTransactions: shift.totalTransactions ?? 0,
        totalRefunds: shift.totalRefunds ?? 0,
        totalVoids: shift.totalVoids ?? 0,
        notes: shift.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return {
      ...shift,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * End shift (Drizzle)
   * Updates shift with final calculations
   * NEW method - replaces endShift()
   */
  endShiftDrizzle(
    shiftId: string,
    endData: {
      endTime: string;
      finalCashDrawer: number;
      expectedCashDrawer: number;
      totalSales: number;
      totalTransactions: number;
      totalRefunds: number;
      totalVoids: number;
      notes?: string;
    }
  ): void {
    const db = this.getDrizzleInstance();
    const cashVariance = endData.finalCashDrawer - endData.expectedCashDrawer;
    const now = new Date().toISOString();

    db.update(schema.shifts)
      .set({
        endTime: endData.endTime,
        status: "ended",
        finalCashDrawer: endData.finalCashDrawer,
        expectedCashDrawer: endData.expectedCashDrawer,
        cashVariance,
        totalSales: endData.totalSales,
        totalTransactions: endData.totalTransactions,
        totalRefunds: endData.totalRefunds,
        totalVoids: endData.totalVoids,
        notes: endData.notes ?? null,
        updatedAt: now,
      })
      .where(eq(schema.shifts.id, shiftId))
      .run();
  }

  // Shift reconciliation methods for auto-ended shifts
  reconcileShift(
    shiftId: string,
    reconciliationData: {
      actualCashDrawer: number;
      managerNotes: string;
      managerId: string;
    }
  ): void {
    const stmt = this.db.prepare(`
      UPDATE shifts 
      SET 
        finalCashDrawer = ?,
        notes = CASE 
          WHEN notes IS NULL THEN ?
          ELSE notes || ' | Manager Reconciliation: ' || ?
        END,
        updatedAt = ?
      WHERE id = ?
    `);

    const reconciliationNote = `Reconciled by manager. Actual cash: £${reconciliationData.actualCashDrawer.toFixed(
      2
    )}. ${reconciliationData.managerNotes}`;

    stmt.run(
      reconciliationData.actualCashDrawer,
      reconciliationNote,
      reconciliationNote,
      new Date().toISOString(),
      shiftId
    );
  }

  getPendingReconciliationShifts(businessId: string): Shift[] {
    const stmt = this.db.prepare(`
      SELECT * FROM shifts 
      WHERE businessId = ? 
        AND status = 'ended'
        AND notes LIKE '%Auto-ended%'
        AND notes LIKE '%Requires manager approval%'
      ORDER BY endTime DESC
    `);
    return stmt.all(businessId) as Shift[];
  }

  // Transaction Management Methods
  createTransaction(
    transaction: Omit<Transaction, "id" | "createdAt">
  ): Transaction {
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO transactions (
        id, shiftId, businessId, type, subtotal, tax, total, 
        paymentMethod, cashAmount, cardAmount, status, voidReason, 
        customerId, receiptNumber, timestamp, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      transaction.shiftId,
      transaction.businessId,
      transaction.type,
      transaction.subtotal,
      transaction.tax,
      transaction.total,
      transaction.paymentMethod,
      transaction.cashAmount || null,
      transaction.cardAmount || null,
      transaction.status,
      transaction.voidReason || null,
      transaction.customerId || null,
      transaction.receiptNumber,
      transaction.timestamp,
      now
    );

    // Create transaction items
    if (transaction.items && transaction.items.length > 0) {
      for (const item of transaction.items) {
        this.createTransactionItem(id, item);
      }
    }

    return {
      ...transaction,
      id,
      createdAt: now,
    };
  }

  createTransactionItem(
    transactionId: string,
    item: Omit<TransactionItem, "id">
  ): void {
    const itemId = this.uuid.v4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO transaction_items (
        id, transactionId, productId, productName, quantity, unitPrice, totalPrice, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      itemId,
      transactionId,
      item.productId,
      item.productName,
      item.quantity,
      item.unitPrice,
      item.totalPrice,
      now
    );

    // Create applied modifiers if any
    if (item.appliedModifiers && item.appliedModifiers.length > 0) {
      for (const modifier of item.appliedModifiers) {
        this.createAppliedModifier(itemId, modifier);
      }
    }
  }

  createAppliedModifier(
    transactionItemId: string,
    modifier: AppliedModifier
  ): void {
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO applied_modifiers (
        id, transactionItemId, modifierId, modifierName, optionId, optionName, price, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      transactionItemId,
      modifier.modifierId,
      modifier.modifierName,
      modifier.optionId,
      modifier.optionName,
      modifier.price,
      now
    );
  }

  getTransactionsByShiftId(shiftId: string): Transaction[] {
    // Get transactions
    const transactionStmt = this.db.prepare(`
      SELECT * FROM transactions WHERE shiftId = ? ORDER BY timestamp DESC
    `);
    const transactions = transactionStmt.all(shiftId) as Transaction[];

    // Get items and modifiers for each transaction
    for (const transaction of transactions) {
      transaction.items = this.getTransactionItems(transaction.id);
    }

    return transactions;
  }

  getTransactionItems(transactionId: string): TransactionItem[] {
    const itemsStmt = this.db.prepare(`
      SELECT * FROM transaction_items WHERE transactionId = ?
    `);
    const items = itemsStmt.all(transactionId) as TransactionItem[];

    // Get applied modifiers for each item
    for (const item of items) {
      const modifiersStmt = this.db.prepare(`
        SELECT * FROM applied_modifiers WHERE transactionItemId = ?
      `);
      item.appliedModifiers = modifiersStmt.all(item.id) as AppliedModifier[];
    }

    return items;
  }

  voidTransaction(voidData: {
    transactionId: string;
    cashierId: string;
    reason: string;
    managerApprovalId?: string;
  }): {
    success: boolean;
    message: string;
  } {
    const transaction = this.db.transaction(() => {
      console.log(
        "Database: Starting void transaction for ID:",
        voidData.transactionId
      );

      // Get original transaction
      const originalTransaction = this.getTransactionByIdAnyStatus(
        voidData.transactionId
      );
      console.log("Database: Original transaction:", originalTransaction);

      if (!originalTransaction) {
        throw new Error("Transaction not found");
      }

      // Check if transaction can be voided
      if (originalTransaction.status !== "completed") {
        console.log(
          "Database: Transaction status is not completed:",
          originalTransaction.status
        );
        throw new Error("Only completed transactions can be voided");
      }

      // Check time window (30 minutes for void)
      const transactionTime = new Date(originalTransaction.timestamp);
      const now = new Date();
      const timeDifferenceMinutes =
        (now.getTime() - transactionTime.getTime()) / (1000 * 60);

      console.log(
        "Database: Time difference in minutes:",
        timeDifferenceMinutes
      );

      if (timeDifferenceMinutes > 30 && !voidData.managerApprovalId) {
        throw new Error(
          "Transaction is older than 30 minutes and requires manager approval"
        );
      }

      // Update transaction status to voided
      console.log("Database: Updating transaction status to voided");
      const updateStmt = this.db.prepare(`
        UPDATE transactions 
        SET status = 'voided', voidReason = ?
        WHERE id = ?
      `);

      const now_iso = new Date().toISOString();
      const updateResult = updateStmt.run(
        voidData.reason,
        voidData.transactionId
      );
      console.log("Database: Update transaction result:", updateResult);

      // Restore inventory for all items in the transaction
      console.log(
        "Database: Restoring inventory for",
        originalTransaction.items.length,
        "items"
      );
      for (const item of originalTransaction.items) {
        const updateInventoryStmt = this.db.prepare(`
          UPDATE products 
          SET stockLevel = stockLevel + ?, updatedAt = ?
          WHERE id = ?
        `);
        updateInventoryStmt.run(item.quantity, now_iso, item.productId);
      }

      // Create audit log entry
      const auditId = this.uuid.v4();
      const auditStmt = this.db.prepare(`
        INSERT INTO audit_logs (
          id, userId, action, resource, resourceId, details, timestamp, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      auditStmt.run(
        auditId,
        voidData.cashierId,
        "void",
        "transactions",
        voidData.transactionId,
        JSON.stringify({
          reason: voidData.reason,
          managerApproval: voidData.managerApprovalId,
          originalAmount: originalTransaction.total,
        }),
        now_iso,
        now_iso
      );

      return voidData.transactionId;
    });

    try {
      console.log("Database: Executing void transaction...");
      transaction();
      console.log("Database: Void transaction completed successfully");
      return {
        success: true,
        message: "Transaction voided successfully",
      };
    } catch (error) {
      console.error("Database: Void transaction failed:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to void transaction",
      };
    }
  }

  /**
   * Void transaction (Drizzle)
   * Complex operation with validation, inventory restoration, and audit logging
   * NEW method - replaces voidTransaction()
   */
  async voidTransactionDrizzle(voidData: {
    transactionId: string;
    cashierId: string;
    reason: string;
    managerApprovalId?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const db = this.getDrizzleInstance();

    try {
      console.log(
        "Database: Starting void transaction for ID:",
        voidData.transactionId
      );

      // Get original transaction
      const originalTransaction = await this.getTransactionByIdDrizzle(
        voidData.transactionId
      );
      console.log("Database: Original transaction:", originalTransaction);

      if (!originalTransaction) {
        throw new Error("Transaction not found");
      }

      // Check if transaction can be voided
      if (originalTransaction.status !== "completed") {
        console.log(
          "Database: Transaction status is not completed:",
          originalTransaction.status
        );
        throw new Error("Only completed transactions can be voided");
      }

      // Check time window (30 minutes for void)
      const transactionTime = new Date(originalTransaction.timestamp);
      const now = new Date();
      const timeDifferenceMinutes =
        (now.getTime() - transactionTime.getTime()) / (1000 * 60);

      console.log(
        "Database: Time difference in minutes:",
        timeDifferenceMinutes
      );

      if (timeDifferenceMinutes > 30 && !voidData.managerApprovalId) {
        throw new Error(
          "Transaction is older than 30 minutes and requires manager approval"
        );
      }

      const now_iso = new Date().toISOString();

      // Use Drizzle transaction for atomicity
      db.transaction((tx) => {
        // 1. Update transaction status to voided
        console.log("Database: Updating transaction status to voided");
        tx.update(schema.transactions)
          .set({
            status: "voided",
            voidReason: voidData.reason,
          })
          .where(eq(schema.transactions.id, voidData.transactionId))
          .run();

        // 2. Restore inventory for all items in the transaction
        console.log(
          "Database: Restoring inventory for",
          originalTransaction.items.length,
          "items"
        );
        for (const item of originalTransaction.items) {
          const currentProduct = tx
            .select({ stockLevel: schema.products.stockLevel })
            .from(schema.products)
            .where(eq(schema.products.id, item.productId))
            .get();

          tx.update(schema.products)
            .set({
              stockLevel: (currentProduct?.stockLevel ?? 0) + item.quantity,
              updatedAt: now_iso,
            })
            .where(eq(schema.products.id, item.productId))
            .run();
        }

        // 3. Create audit log entry
        const auditId = this.uuid.v4();
        tx.insert(schema.auditLogs)
          .values({
            id: auditId,
            userId: voidData.cashierId,
            action: "void",
            resource: "transactions",
            resourceId: voidData.transactionId,
            details: JSON.stringify({
              reason: voidData.reason,
              managerApproval: voidData.managerApprovalId,
              originalAmount: originalTransaction.total,
            }),
            timestamp: now_iso,
            createdAt: now_iso,
          })
          .run();
      });

      console.log("Database: Void transaction completed successfully");
      return {
        success: true,
        message: "Transaction voided successfully",
      };
    } catch (error) {
      console.error("Database: Void transaction failed:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to void transaction",
      };
    }
  }

  // Refund Transaction Methods
  getTransactionById(transactionId: string): Transaction | null {
    const transactionStmt = this.db.prepare(`
      SELECT * FROM transactions WHERE id = ? AND status = 'completed'
    `);
    const transaction = transactionStmt.get(transactionId) as
      | Transaction
      | undefined;

    if (!transaction) return null;

    // Get items for the transaction
    transaction.items = this.getTransactionItems(transaction.id);
    return transaction;
  }

  // Get transaction by ID regardless of status (used for void operations)
  getTransactionByIdAnyStatus(transactionId: string): Transaction | null {
    const transactionStmt = this.db.prepare(`
      SELECT * FROM transactions WHERE id = ?
    `);
    const transaction = transactionStmt.get(transactionId) as
      | Transaction
      | undefined;

    if (!transaction) return null;

    // Get items for the transaction
    transaction.items = this.getTransactionItems(transaction.id);
    return transaction;
  }

  getTransactionByReceiptNumber(receiptNumber: string): Transaction | null {
    const transactionStmt = this.db.prepare(`
      SELECT * FROM transactions WHERE receiptNumber = ? AND status = 'completed' ORDER BY timestamp DESC LIMIT 1
    `);
    const transaction = transactionStmt.get(receiptNumber) as
      | Transaction
      | undefined;

    if (!transaction) return null;

    // Get items for the transaction
    transaction.items = this.getTransactionItems(transaction.id);
    return transaction;
  }

  // Get transaction by receipt number regardless of status (used for void operations)
  getTransactionByReceiptNumberAnyStatus(
    receiptNumber: string
  ): Transaction | null {
    const transactionStmt = this.db.prepare(`
      SELECT * FROM transactions WHERE receiptNumber = ? ORDER BY timestamp DESC LIMIT 1
    `);
    const transaction = transactionStmt.get(receiptNumber) as
      | Transaction
      | undefined;

    if (!transaction) return null;

    // Get items for the transaction
    transaction.items = this.getTransactionItems(transaction.id);
    return transaction;
  }

  getRecentTransactions(businessId: string, limit: number = 50): Transaction[] {
    const transactionStmt = this.db.prepare(`
      SELECT * FROM transactions 
      WHERE businessId = ? AND status = 'completed'
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    const transactions = transactionStmt.all(
      businessId,
      limit
    ) as Transaction[];

    // Get items for each transaction
    for (const transaction of transactions) {
      transaction.items = this.getTransactionItems(transaction.id);
    }

    return transactions;
  }

  // Get transactions for current shift only
  getShiftTransactions(shiftId: string, limit: number = 50): Transaction[] {
    const transactionStmt = this.db.prepare(`
      SELECT * FROM transactions 
      WHERE shiftId = ? AND status = 'completed'
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    const transactions = transactionStmt.all(shiftId, limit) as Transaction[];

    // Get items for each transaction
    for (const transaction of transactions) {
      transaction.items = this.getTransactionItems(transaction.id);
    }

    return transactions;
  }

  // ============================================
  // DRIZZLE ORM TRANSACTION METHODS
  // ============================================

  /**
   * Get transaction by ID using Drizzle ORM (type-safe)
   * Alternative to getTransactionById() above
   */
  async getTransactionByIdDrizzle(
    transactionId: string
  ): Promise<Transaction | null> {
    const drizzle = this.getDrizzleInstance();

    const [transaction] = await drizzle
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.id, transactionId),
          eq(schema.transactions.status, "completed")
        )
      )
      .limit(1);

    if (!transaction) return null;

    // Get items separately (raw SQL for now as items need complex handling)
    const items = this.getTransactionItems(transaction.id);

    return {
      ...transaction,
      items,
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    } as Transaction;
  }

  /**
   * Get recent transactions using Drizzle ORM (type-safe)
   * Alternative to getRecentTransactions() above
   */
  async getRecentTransactionsDrizzle(
    businessId: string,
    limit: number = 50
  ): Promise<Transaction[]> {
    const drizzle = this.getDrizzleInstance();

    const transactions = await drizzle
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.businessId, businessId),
          eq(schema.transactions.status, "completed")
        )
      )
      .orderBy(desc(schema.transactions.timestamp))
      .limit(limit);

    // Get items for each transaction
    const transactionsWithItems = transactions.map((transaction) => ({
      ...transaction,
      items: this.getTransactionItems(transaction.id),
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    }));

    return transactionsWithItems as Transaction[];
  }

  /**
   * Get transactions by shift using Drizzle ORM (type-safe)
   * Alternative to getShiftTransactions() above
   */
  async getShiftTransactionsDrizzle(
    shiftId: string,
    limit: number = 50
  ): Promise<Transaction[]> {
    const drizzle = this.getDrizzleInstance();

    const transactions = await drizzle
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.shiftId, shiftId),
          eq(schema.transactions.status, "completed")
        )
      )
      .orderBy(desc(schema.transactions.timestamp))
      .limit(limit);

    // Get items for each transaction
    const transactionsWithItems = transactions.map((transaction) => ({
      ...transaction,
      items: this.getTransactionItems(transaction.id),
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    }));

    return transactionsWithItems as Transaction[];
  }

  /**
   * Get transaction statistics using Drizzle ORM (type-safe)
   * NEW method - demonstrates aggregation
   */
  async getTransactionStatsDrizzle(businessId: string, shiftId?: string) {
    const drizzle = this.getDrizzleInstance();

    const conditions = [
      eq(schema.transactions.businessId, businessId),
      eq(schema.transactions.status, "completed"),
    ];

    if (shiftId) {
      conditions.push(eq(schema.transactions.shiftId, shiftId));
    }

    const result = await drizzle
      .select({
        totalSales: drizzleSql<number>`COALESCE(SUM(${schema.transactions.total}), 0)`,
        totalTransactions: drizzleSql<number>`COUNT(*)`,
        averageTransaction: drizzleSql<number>`COALESCE(AVG(${schema.transactions.total}), 0)`,
        cashTotal: drizzleSql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.paymentMethod} = 'cash' THEN ${schema.transactions.total} ELSE 0 END), 0)`,
        cardTotal: drizzleSql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.paymentMethod} = 'card' THEN ${schema.transactions.total} ELSE 0 END), 0)`,
      })
      .from(schema.transactions)
      .where(and(...conditions));

    return (
      result[0] || {
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        cashTotal: 0,
        cardTotal: 0,
      }
    );
  }

  /**
   * Search transactions by receipt number or customer using Drizzle ORM
   * NEW method - transaction search
   */
  async searchTransactionsDrizzle(
    businessId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<Transaction[]> {
    const drizzle = this.getDrizzleInstance();
    const searchPattern = `%${searchTerm}%`;

    const transactions = await drizzle
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.businessId, businessId),
          eq(schema.transactions.status, "completed"),
          drizzleSql`${schema.transactions.receiptNumber} LIKE ${searchPattern}`
        )
      )
      .orderBy(desc(schema.transactions.timestamp))
      .limit(limit);

    const transactionsWithItems = transactions.map((transaction) => ({
      ...transaction,
      items: this.getTransactionItems(transaction.id),
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    }));

    return transactionsWithItems as Transaction[];
  }

  /**
   * Get transaction by receipt number (Drizzle)
   * NEW method - receipt lookup
   */
  getTransactionByReceiptNumberDrizzle(
    receiptNumber: string
  ): Transaction | null {
    const db = this.getDrizzleInstance();

    const transaction = db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.receiptNumber, receiptNumber),
          eq(schema.transactions.status, "completed")
        )
      )
      .orderBy(desc(schema.transactions.timestamp))
      .limit(1)
      .get();

    if (!transaction) return null;

    return {
      ...transaction,
      items: this.getTransactionItems(transaction.id),
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    } as Transaction;
  }

  /**
   * Get transaction by receipt number (any status) - Drizzle
   * NEW method - receipt lookup for voids
   */
  getTransactionByReceiptNumberAnyStatusDrizzle(
    receiptNumber: string
  ): Transaction | null {
    const db = this.getDrizzleInstance();

    const transaction = db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.receiptNumber, receiptNumber))
      .orderBy(desc(schema.transactions.timestamp))
      .limit(1)
      .get();

    if (!transaction) return null;

    return {
      ...transaction,
      items: this.getTransactionItems(transaction.id),
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    } as Transaction;
  }

  /**
   * Get transaction items with modifiers (Drizzle)
   * NEW method - detailed transaction items query
   */
  getTransactionItemsDrizzle(transactionId: string): TransactionItem[] {
    const db = this.getDrizzleInstance();

    const items = db
      .select()
      .from(schema.transactionItems)
      .where(eq(schema.transactionItems.transactionId, transactionId))
      .all();

    // Get applied modifiers for each item
    return items.map((item) => {
      const modifiers = db
        .select()
        .from(schema.appliedModifiers)
        .where(eq(schema.appliedModifiers.transactionItemId, item.id))
        .all();

      return {
        ...item,
        refundedQuantity: item.refundedQuantity ?? undefined,
        weight: item.weight ?? undefined,
        discountAmount: item.discountAmount ?? undefined,
        appliedDiscounts: item.appliedDiscounts
          ? JSON.parse(item.appliedDiscounts)
          : undefined,
        appliedModifiers: modifiers as AppliedModifier[],
      };
    });
  }

  /**
   * Create transaction with items and modifiers (Drizzle)
   * Complex operation with atomic transaction support
   * NEW method - replaces createTransaction()
   */
  createTransactionDrizzle(
    transaction: Omit<Transaction, "id" | "createdAt">
  ): Transaction {
    const db = this.getDrizzleInstance();
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    // Use Drizzle transaction for atomicity
    const result = db.transaction((tx) => {
      // 1. Insert main transaction
      tx.insert(schema.transactions)
        .values({
          id,
          shiftId: transaction.shiftId,
          businessId: transaction.businessId,
          type: transaction.type,
          subtotal: transaction.subtotal,
          tax: transaction.tax,
          total: transaction.total,
          paymentMethod: transaction.paymentMethod,
          cashAmount: transaction.cashAmount ?? null,
          cardAmount: transaction.cardAmount ?? null,
          status: transaction.status,
          voidReason: transaction.voidReason ?? null,
          customerId: transaction.customerId ?? null,
          receiptNumber: transaction.receiptNumber,
          appliedDiscounts: transaction.appliedDiscounts
            ? JSON.stringify(transaction.appliedDiscounts)
            : null,
          timestamp: transaction.timestamp,
          createdAt: now,
        })
        .run();

      // 2. Insert transaction items
      if (transaction.items && transaction.items.length > 0) {
        for (const item of transaction.items) {
          const itemId = this.uuid.v4();

          tx.insert(schema.transactionItems)
            .values({
              id: itemId,
              transactionId: id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              refundedQuantity: item.refundedQuantity ?? null,
              weight: item.weight ?? null,
              discountAmount: item.discountAmount ?? null,
              appliedDiscounts: item.appliedDiscounts
                ? JSON.stringify(item.appliedDiscounts)
                : null,
              createdAt: now,
            })
            .run();

          // 3. Insert applied modifiers for each item
          if (item.appliedModifiers && item.appliedModifiers.length > 0) {
            for (const modifier of item.appliedModifiers) {
              const modifierId = this.uuid.v4();

              tx.insert(schema.appliedModifiers)
                .values({
                  id: modifierId,
                  transactionItemId: itemId,
                  modifierId: modifier.modifierId,
                  modifierName: modifier.modifierName,
                  optionId: modifier.optionId,
                  optionName: modifier.optionName,
                  price: modifier.price,
                  createdAt: now,
                })
                .run();
            }
          }
        }
      }

      return {
        ...transaction,
        id,
        createdAt: now,
      };
    });

    return result;
  }

  /**
   * Create transaction item (Drizzle)
   * Helper method for individual item creation
   * NEW method - replaces createTransactionItem()
   */
  createTransactionItemDrizzle(
    transactionId: string,
    item: Omit<TransactionItem, "id" | "createdAt">
  ): string {
    const db = this.getDrizzleInstance();
    const itemId = this.uuid.v4();
    const now = new Date().toISOString();

    db.transaction((tx) => {
      // Insert transaction item
      tx.insert(schema.transactionItems)
        .values({
          id: itemId,
          transactionId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          refundedQuantity: item.refundedQuantity ?? null,
          weight: item.weight ?? null,
          discountAmount: item.discountAmount ?? null,
          appliedDiscounts: item.appliedDiscounts
            ? JSON.stringify(item.appliedDiscounts)
            : null,
          createdAt: now,
        })
        .run();

      // Insert applied modifiers if any
      if (item.appliedModifiers && item.appliedModifiers.length > 0) {
        for (const modifier of item.appliedModifiers) {
          const modifierId = this.uuid.v4();

          tx.insert(schema.appliedModifiers)
            .values({
              id: modifierId,
              transactionItemId: itemId,
              modifierId: modifier.modifierId,
              modifierName: modifier.modifierName,
              optionId: modifier.optionId,
              optionName: modifier.optionName,
              price: modifier.price,
              createdAt: now,
            })
            .run();
        }
      }
    });

    return itemId;
  }

  /**
   * Create applied modifier (Drizzle)
   * Helper method for individual modifier creation
   * NEW method - replaces createAppliedModifier()
   */
  createAppliedModifierDrizzle(
    transactionItemId: string,
    modifier: Omit<AppliedModifier, "id" | "createdAt">
  ): void {
    const db = this.getDrizzleInstance();
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    db.insert(schema.appliedModifiers)
      .values({
        id,
        transactionItemId,
        modifierId: modifier.modifierId,
        modifierName: modifier.modifierName,
        optionId: modifier.optionId,
        optionName: modifier.optionName,
        price: modifier.price,
        createdAt: now,
      })
      .run();
  }

  createRefundTransaction(refundData: {
    originalTransactionId: string;
    shiftId: string;
    businessId: string;
    refundItems: RefundItem[];
    refundReason: string;
    refundMethod: "original" | "store_credit" | "cash" | "card";
    managerApprovalId?: string;
    cashierId: string;
  }): Transaction {
    // Get original transaction to validate refund
    const originalTransaction = this.getTransactionById(
      refundData.originalTransactionId
    );
    if (!originalTransaction) {
      throw new Error("Original transaction not found");
    }

    // Calculate refund totals
    const refundSubtotal = refundData.refundItems.reduce(
      (sum, item) => sum + item.refundAmount,
      0
    );
    const refundTax =
      refundSubtotal * (originalTransaction.tax / originalTransaction.subtotal); // Proportional tax
    const refundTotal = refundSubtotal + refundTax;

    // Create refund transaction
    const refundId = this.uuid.v4();
    const receiptNumber = `REF-${Date.now()}`;
    const now = new Date().toISOString();

    // Determine payment method for refund
    let paymentMethod: "cash" | "card" | "mixed";
    if (refundData.refundMethod === "original") {
      paymentMethod = originalTransaction.paymentMethod;
    } else if (refundData.refundMethod === "cash") {
      paymentMethod = "cash";
    } else if (refundData.refundMethod === "card") {
      paymentMethod = "card";
    } else {
      // For store credit, we'll treat it as cash for now
      paymentMethod = "cash";
    }

    const refundTransaction = this.db.transaction(() => {
      // Create the refund transaction record
      const transactionStmt = this.db.prepare(`
        INSERT INTO transactions (
          id, shiftId, businessId, type, subtotal, tax, total, 
          paymentMethod, cashAmount, cardAmount, status, 
          receiptNumber, timestamp, createdAt, originalTransactionId,
          refundReason, refundMethod, managerApprovalId, isPartialRefund
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const isPartialRefund =
        refundData.refundItems.length < originalTransaction.items.length ||
        refundData.refundItems.some((refundItem) => {
          const originalItem = originalTransaction.items.find(
            (item) => item.id === refundItem.originalItemId
          );
          return (
            originalItem && refundItem.refundQuantity < originalItem.quantity
          );
        });

      transactionStmt.run(
        refundId,
        refundData.shiftId,
        refundData.businessId,
        "refund",
        -refundSubtotal, // Negative for refund
        -refundTax,
        -refundTotal,
        paymentMethod,
        paymentMethod === "cash" ? -refundTotal : null,
        paymentMethod === "card" ? -refundTotal : null,
        "completed",
        receiptNumber,
        now,
        now,
        refundData.originalTransactionId,
        refundData.refundReason,
        refundData.refundMethod,
        refundData.managerApprovalId || null,
        isPartialRefund ? 1 : 0
      );

      // Create refund transaction items
      for (const refundItem of refundData.refundItems) {
        const itemId = this.uuid.v4();
        const itemStmt = this.db.prepare(`
          INSERT INTO transaction_items (
            id, transactionId, productId, productName, quantity, 
            unitPrice, totalPrice, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        itemStmt.run(
          itemId,
          refundId,
          refundItem.productId,
          refundItem.productName,
          -refundItem.refundQuantity, // Negative for refund
          refundItem.unitPrice,
          -refundItem.refundAmount,
          now
        );

        // Update original item's refunded quantity
        const updateOriginalStmt = this.db.prepare(`
          UPDATE transaction_items 
          SET refundedQuantity = COALESCE(refundedQuantity, 0) + ?
          WHERE id = ?
        `);
        updateOriginalStmt.run(
          refundItem.refundQuantity,
          refundItem.originalItemId
        );

        // Update inventory if item is restockable
        if (refundItem.restockable) {
          const updateInventoryStmt = this.db.prepare(`
            UPDATE products 
            SET stockLevel = stockLevel + ?, updatedAt = ?
            WHERE id = ?
          `);
          updateInventoryStmt.run(
            refundItem.refundQuantity,
            now,
            refundItem.productId
          );
        }
      }

      return refundId;
    });

    refundTransaction();

    // Return the created refund transaction
    return this.getTransactionById(refundId)!;
  }

  validateRefundEligibility(
    transactionId: string,
    refundItems: RefundItem[]
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Get original transaction
    const originalTransaction = this.getTransactionById(transactionId);
    if (!originalTransaction) {
      errors.push("Original transaction not found");
      return { isValid: false, errors };
    }

    // Check if transaction is too old (configurable - 30 days)
    const transactionDate = new Date(originalTransaction.timestamp);
    const daysDiff =
      (Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 30) {
      errors.push("Transaction is older than 30 days and cannot be refunded");
    }

    // Validate each refund item
    for (const refundItem of refundItems) {
      const originalItem = originalTransaction.items.find(
        (item) => item.id === refundItem.originalItemId
      );
      if (!originalItem) {
        errors.push(
          `Item ${refundItem.productName} not found in original transaction`
        );
        continue;
      }

      // Check if refund quantity exceeds available quantity
      const availableQuantity =
        originalItem.quantity - (originalItem.refundedQuantity || 0);
      if (refundItem.refundQuantity > availableQuantity) {
        errors.push(
          `Cannot refund ${refundItem.refundQuantity} of ${refundItem.productName}. Only ${availableQuantity} available.`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create refund transaction (Drizzle)
   * Complex operation with validation, proportional tax, and inventory restoration
   * NEW method - replaces createRefundTransaction()
   */
  async createRefundTransactionDrizzle(refundData: {
    originalTransactionId: string;
    shiftId: string;
    businessId: string;
    refundItems: RefundItem[];
    refundReason: string;
    refundMethod: "original" | "store_credit" | "cash" | "card";
    managerApprovalId?: string;
    cashierId: string;
  }): Promise<Transaction> {
    const db = this.getDrizzleInstance();

    // Get original transaction to validate refund
    const originalTransaction = await this.getTransactionByIdDrizzle(
      refundData.originalTransactionId
    );
    if (!originalTransaction) {
      throw new Error("Original transaction not found");
    }

    // Calculate refund totals
    const refundSubtotal = refundData.refundItems.reduce(
      (sum, item) => sum + item.refundAmount,
      0
    );
    const refundTax =
      refundSubtotal * (originalTransaction.tax / originalTransaction.subtotal);
    const refundTotal = refundSubtotal + refundTax;

    // Determine payment method for refund
    let paymentMethod: "cash" | "card" | "mixed";
    if (refundData.refundMethod === "original") {
      paymentMethod = originalTransaction.paymentMethod;
    } else if (refundData.refundMethod === "cash") {
      paymentMethod = "cash";
    } else if (refundData.refundMethod === "card") {
      paymentMethod = "card";
    } else {
      paymentMethod = "cash"; // Store credit treated as cash
    }

    const refundId = this.uuid.v4();
    const receiptNumber = `REF-${Date.now()}`;
    const now = new Date().toISOString();

    // Check if partial refund
    const isPartialRefund =
      refundData.refundItems.length < originalTransaction.items.length ||
      refundData.refundItems.some((refundItem) => {
        const originalItem = originalTransaction.items.find(
          (item) => item.id === refundItem.originalItemId
        );
        return (
          originalItem && refundItem.refundQuantity < originalItem.quantity
        );
      });

    // Use Drizzle transaction for atomicity
    db.transaction((tx) => {
      // 1. Create refund transaction record
      tx.insert(schema.transactions)
        .values({
          id: refundId,
          shiftId: refundData.shiftId,
          businessId: refundData.businessId,
          type: "refund",
          subtotal: -refundSubtotal, // Negative for refund
          tax: -refundTax,
          total: -refundTotal,
          paymentMethod,
          cashAmount: paymentMethod === "cash" ? -refundTotal : null,
          cardAmount: paymentMethod === "card" ? -refundTotal : null,
          status: "completed",
          receiptNumber,
          timestamp: now,
          createdAt: now,
          originalTransactionId: refundData.originalTransactionId,
          refundReason: refundData.refundReason,
          refundMethod: refundData.refundMethod,
          managerApprovalId: refundData.managerApprovalId ?? null,
          isPartialRefund: isPartialRefund,
          voidReason: null,
          customerId: null,
          appliedDiscounts: null,
        })
        .run();

      // 2. Create refund transaction items
      for (const refundItem of refundData.refundItems) {
        const itemId = this.uuid.v4();

        tx.insert(schema.transactionItems)
          .values({
            id: itemId,
            transactionId: refundId,
            productId: refundItem.productId,
            productName: refundItem.productName,
            quantity: -refundItem.refundQuantity, // Negative for refund
            unitPrice: refundItem.unitPrice,
            totalPrice: -refundItem.refundAmount,
            refundedQuantity: null,
            weight: null,
            discountAmount: null,
            appliedDiscounts: null,
            createdAt: now,
          })
          .run();

        // 3. Update original item's refunded quantity
        const currentRefunded = tx
          .select({
            refundedQuantity: schema.transactionItems.refundedQuantity,
          })
          .from(schema.transactionItems)
          .where(eq(schema.transactionItems.id, refundItem.originalItemId))
          .get();

        tx.update(schema.transactionItems)
          .set({
            refundedQuantity:
              (currentRefunded?.refundedQuantity ?? 0) +
              refundItem.refundQuantity,
          })
          .where(eq(schema.transactionItems.id, refundItem.originalItemId))
          .run();

        // 4. Update inventory if item is restockable
        if (refundItem.restockable) {
          const currentProduct = tx
            .select({ stockLevel: schema.products.stockLevel })
            .from(schema.products)
            .where(eq(schema.products.id, refundItem.productId))
            .get();

          tx.update(schema.products)
            .set({
              stockLevel:
                (currentProduct?.stockLevel ?? 0) + refundItem.refundQuantity,
              updatedAt: now,
            })
            .where(eq(schema.products.id, refundItem.productId))
            .run();
        }
      }
    });

    // Return the created refund transaction
    const createdTransaction = await this.getTransactionByIdDrizzle(refundId);
    if (!createdTransaction) {
      throw new Error("Failed to retrieve created refund transaction");
    }
    return createdTransaction;
  }

  validateVoidEligibility(transactionId: string): {
    isValid: boolean;
    errors: string[];
    requiresManagerApproval: boolean;
  } {
    const errors: string[] = [];
    let requiresManagerApproval = false;

    // Get transaction
    const transaction = this.getTransactionByIdAnyStatus(transactionId);
    if (!transaction) {
      errors.push("Transaction not found");
      return { isValid: false, errors, requiresManagerApproval: false };
    }

    // Check if already voided or refunded
    if (transaction.status !== "completed") {
      errors.push("Transaction is not in completed status");
    }

    // Check time window (30 minutes for normal void)
    const transactionTime = new Date(transaction.timestamp);
    const now = new Date();
    const timeDifferenceMinutes =
      (now.getTime() - transactionTime.getTime()) / (1000 * 60);

    if (timeDifferenceMinutes > 30) {
      requiresManagerApproval = true;
    }

    // Check if payment method allows void (card payments might be settled)
    if (transaction.paymentMethod === "card" && timeDifferenceMinutes > 60) {
      errors.push(
        "Card payment may be settled - refund required instead of void"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      requiresManagerApproval,
    };
  }

  // Cash Drawer Count Methods
  createCashDrawerCount(
    count: Omit<CashDrawerCount, "id" | "createdAt">
  ): CashDrawerCount {
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO cash_drawer_counts (
        id, shiftId, businessId, countType, expectedAmount, countedAmount, 
        variance, notes, countedBy, timestamp, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const variance = count.countedAmount - count.expectedAmount;

    stmt.run(
      id,
      count.shiftId,
      count.businessId,
      count.countType,
      count.expectedAmount,
      count.countedAmount,
      variance,
      count.notes || null,
      count.countedBy,
      count.timestamp,
      now
    );

    return {
      ...count,
      id,
      variance,
      createdAt: now,
    };
  }

  getCashDrawerCountsByShiftId(shiftId: string): CashDrawerCount[] {
    const stmt = this.db.prepare(`
      SELECT * FROM cash_drawer_counts WHERE shiftId = ? ORDER BY timestamp ASC
    `);
    return stmt.all(shiftId) as CashDrawerCount[];
  }

  // ============================================
  // DRIZZLE ORM CASH DRAWER METHODS
  // ============================================

  /**
   * Create cash drawer count (Drizzle)
   */
  createCashDrawerCountDrizzle(
    count: Omit<CashDrawerCount, "id" | "createdAt">
  ): CashDrawerCount {
    const db = this.getDrizzleInstance();
    const id = this.uuid.v4();
    const now = new Date().toISOString();
    const variance = count.countedAmount - count.expectedAmount;

    db.insert(schema.cashDrawerCounts)
      .values({
        id,
        shiftId: count.shiftId,
        businessId: count.businessId,
        countType: count.countType,
        expectedAmount: count.expectedAmount,
        countedAmount: count.countedAmount,
        variance,
        notes: count.notes ?? null,
        countedBy: count.countedBy,
        timestamp: count.timestamp,
        createdAt: now,
      })
      .run();

    return {
      ...count,
      id,
      variance,
      createdAt: now,
    };
  }

  /**
   * Get cash drawer counts by shift (Drizzle)
   */
  getCashDrawerCountsByShiftIdDrizzle(shiftId: string): CashDrawerCount[] {
    const db = this.getDrizzleInstance();

    const result = db
      .select()
      .from(schema.cashDrawerCounts)
      .where(eq(schema.cashDrawerCounts.shiftId, shiftId))
      .orderBy(asc(schema.cashDrawerCounts.timestamp))
      .all();

    return result.map((c) => ({
      ...c,
      notes: c.notes ?? undefined,
    }));
  }

  /**
   * Get latest cash drawer count for shift (Drizzle)
   * NEW method - get most recent count
   */
  getLatestCashDrawerCountDrizzle(shiftId: string): CashDrawerCount | null {
    const db = this.getDrizzleInstance();

    const result = db
      .select()
      .from(schema.cashDrawerCounts)
      .where(eq(schema.cashDrawerCounts.shiftId, shiftId))
      .orderBy(desc(schema.cashDrawerCounts.timestamp))
      .limit(1)
      .get();

    if (!result) return null;

    return {
      ...result,
      notes: result.notes ?? undefined,
    };
  }

  // Get current cash drawer balance based on latest count or estimated amount
  getCurrentCashDrawerBalance(shiftId: string): {
    amount: number;
    isEstimated: boolean;
    lastCountTime?: string;
    variance?: number;
  } {
    // Get shift details
    const shiftStmt = this.db.prepare(`SELECT * FROM shifts WHERE id = ?`);
    const shift = shiftStmt.get(shiftId) as Shift | null;

    if (!shift) {
      return { amount: 0, isEstimated: true };
    }

    // Get the most recent cash count
    const countStmt = this.db.prepare(`
      SELECT * FROM cash_drawer_counts 
      WHERE shiftId = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);
    const latestCount = countStmt.get(shiftId) as CashDrawerCount | null;

    if (latestCount) {
      // Use actual counted amount
      const expectedAtCountTime = this.getExpectedCashForShift(shiftId);
      const variance =
        latestCount.countedAmount - expectedAtCountTime.expectedAmount;

      return {
        amount: latestCount.countedAmount,
        isEstimated: false,
        lastCountTime: latestCount.timestamp,
        variance: variance,
      };
    } else {
      // Estimate based on starting cash + sales
      const expectedCash = this.getExpectedCashForShift(shiftId);
      return {
        amount: expectedCash.expectedAmount,
        isEstimated: true,
      };
    }
  }

  // Calculate expected cash amount for a shift
  getExpectedCashForShift(shiftId: string): {
    expectedAmount: number;
    breakdown: {
      startingCash: number;
      cashSales: number;
      cashRefunds: number;
      cashVoids: number;
    };
  } {
    // Get shift details
    const shift = this.db
      .prepare("SELECT * FROM shifts WHERE id = ?")
      .get(shiftId) as Shift | null;

    if (!shift) {
      throw new Error("Shift not found");
    }

    // Calculate cash transactions for this shift
    const cashTransactions = this.db
      .prepare(
        `
        SELECT 
          type,
          SUM(CASE 
            WHEN paymentMethod = 'cash' THEN total 
            WHEN paymentMethod = 'mixed' THEN COALESCE(cashAmount, 0)
            ELSE 0 
          END) as cashAmount
        FROM transactions 
        WHERE shiftId = ? AND status = 'completed' 
          AND (paymentMethod = 'cash' OR (paymentMethod = 'mixed' AND cashAmount > 0))
        GROUP BY type
      `
      )
      .all(shiftId) as Array<{ type: string; cashAmount: number }>;

    let cashSales = 0;
    let cashRefunds = 0;
    let cashVoids = 0;

    cashTransactions.forEach((transaction) => {
      switch (transaction.type) {
        case "sale":
          cashSales += transaction.cashAmount;
          break;
        case "refund":
          cashRefunds += Math.abs(transaction.cashAmount); // Refunds are negative, so we take absolute value
          break;
        case "void":
          cashVoids += Math.abs(transaction.cashAmount); // Voids are negative, so we take absolute value
          break;
      }
    });

    const expectedAmount =
      shift.startingCash + cashSales - cashRefunds - cashVoids;

    return {
      expectedAmount,
      breakdown: {
        startingCash: shift.startingCash,
        cashSales,
        cashRefunds,
        cashVoids,
      },
    };
  }

  /**
   * Get current cash drawer balance (Drizzle)
   * NEW method - replaces getCurrentCashDrawerBalance()
   */
  getCurrentCashDrawerBalanceDrizzle(shiftId: string): {
    amount: number;
    isEstimated: boolean;
    lastCountTime?: string;
    variance?: number;
  } {
    const db = this.getDrizzleInstance();

    // Get shift details
    const shift = db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shiftId))
      .get();

    if (!shift) {
      return { amount: 0, isEstimated: true };
    }

    // Get the most recent cash count
    const latestCount = this.getLatestCashDrawerCountDrizzle(shiftId);

    if (latestCount) {
      // Use actual counted amount
      const expectedAtCountTime = this.getExpectedCashForShiftDrizzle(shiftId);
      const variance =
        latestCount.countedAmount - expectedAtCountTime.expectedAmount;

      return {
        amount: latestCount.countedAmount,
        isEstimated: false,
        lastCountTime: latestCount.timestamp,
        variance: variance,
      };
    } else {
      // Estimate based on starting cash + sales
      const expectedCash = this.getExpectedCashForShiftDrizzle(shiftId);
      return {
        amount: expectedCash.expectedAmount,
        isEstimated: true,
      };
    }
  }

  /**
   * Calculate expected cash amount for a shift (Drizzle)
   * Complex aggregation query
   * NEW method - replaces getExpectedCashForShift()
   */
  getExpectedCashForShiftDrizzle(shiftId: string): {
    expectedAmount: number;
    breakdown: {
      startingCash: number;
      cashSales: number;
      cashRefunds: number;
      cashVoids: number;
    };
  } {
    const db = this.getDrizzleInstance();

    // Get shift details
    const shift = db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shiftId))
      .get();

    if (!shift) {
      throw new Error("Shift not found");
    }

    // Calculate cash transactions using aggregation
    const cashTransactions = db
      .select({
        type: schema.transactions.type,
        cashAmount: drizzleSql<number>`SUM(CASE 
          WHEN ${schema.transactions.paymentMethod} = 'cash' THEN ${schema.transactions.total}
          WHEN ${schema.transactions.paymentMethod} = 'mixed' THEN COALESCE(${schema.transactions.cashAmount}, 0)
          ELSE 0
        END)`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.shiftId, shiftId),
          eq(schema.transactions.status, "completed"),
          drizzleSql`(${schema.transactions.paymentMethod} = 'cash' OR (${schema.transactions.paymentMethod} = 'mixed' AND ${schema.transactions.cashAmount} > 0))`
        )
      )
      .groupBy(schema.transactions.type)
      .all();

    let cashSales = 0;
    let cashRefunds = 0;
    let cashVoids = 0;

    cashTransactions.forEach((transaction) => {
      switch (transaction.type) {
        case "sale":
          cashSales += transaction.cashAmount;
          break;
        case "refund":
          cashRefunds += Math.abs(transaction.cashAmount);
          break;
        case "void":
          cashVoids += Math.abs(transaction.cashAmount);
          break;
      }
    });

    const expectedAmount =
      shift.startingCash + cashSales - cashRefunds - cashVoids;

    return {
      expectedAmount,
      breakdown: {
        startingCash: shift.startingCash,
        cashSales,
        cashRefunds,
        cashVoids,
      },
    };
  }

  // Audit logging method
  createAuditLog(auditData: {
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details?: any;
  }): void {
    const auditId = this.uuid.v4();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `
        INSERT INTO audit_logs (
          id, userId, action, resource, resourceId, details, timestamp, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        auditId,
        auditData.userId,
        auditData.action,
        auditData.resource,
        auditData.resourceId,
        auditData.details ? JSON.stringify(auditData.details) : null,
        now,
        now
      );
  }

  // ============================================
  // DRIZZLE ORM AUDIT LOG METHODS
  // ============================================

  /**
   * Create audit log (Drizzle)
   */
  createAuditLogDrizzle(auditData: {
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details?: any;
  }): void {
    const db = this.getDrizzleInstance();
    const auditId = this.uuid.v4();
    const now = new Date().toISOString();

    db.insert(schema.auditLogs)
      .values({
        id: auditId,
        userId: auditData.userId,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId,
        details: auditData.details ? JSON.stringify(auditData.details) : null,
        timestamp: now,
        createdAt: now,
      })
      .run();
  }

  /**
   * Get audit logs with filtering (Drizzle)
   * NEW method - query audit trail
   */
  getAuditLogsDrizzle(options?: {
    userId?: string;
    resource?: string;
    resourceId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): any[] {
    const db = this.getDrizzleInstance();

    let query = db.select().from(schema.auditLogs);

    // Build where conditions
    const conditions = [];
    if (options?.userId) {
      conditions.push(eq(schema.auditLogs.userId, options.userId));
    }
    if (options?.resource) {
      conditions.push(eq(schema.auditLogs.resource, options.resource));
    }
    if (options?.resourceId) {
      conditions.push(eq(schema.auditLogs.resourceId, options.resourceId));
    }
    if (options?.action) {
      conditions.push(eq(schema.auditLogs.action, options.action));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(schema.auditLogs.timestamp)) as any;

    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }

    return query.all();
  }

  /**
   * Get audit logs by entity (Drizzle)
   * NEW method - track entity history
   */
  getAuditLogsByEntityDrizzle(resource: string, resourceId: string): any[] {
    const db = this.getDrizzleInstance();

    return db
      .select()
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.resource, resource),
          eq(schema.auditLogs.resourceId, resourceId)
        )
      )
      .orderBy(desc(schema.auditLogs.timestamp))
      .all();
  }

  // ============================================
  // DRIZZLE ORM REPORTING METHODS
  // ============================================

  /**
   * Generate shift report (Drizzle)
   * Complex reporting with aggregations and calculations
   * NEW method - replaces generateShiftReport()
   */
  async generateShiftReportDrizzle(
    shiftId: string
  ): Promise<ShiftReport | null> {
    const db = this.getDrizzleInstance();

    // Get shift data
    const shift = await this.getShiftByIdDrizzle(shiftId);
    if (!shift) return null;

    // Get linked schedule if exists
    let schedule: Schedule | undefined;
    if (shift.scheduleId) {
      const scheduleResult = db
        .select()
        .from(schema.schedules)
        .where(eq(schema.schedules.id, shift.scheduleId))
        .get();

      if (scheduleResult) {
        schedule = {
          ...scheduleResult,
          assignedRegister: scheduleResult.assignedRegister ?? undefined,
          notes: scheduleResult.notes ?? undefined,
        };
      }
    }

    // Get transactions using existing Drizzle method
    const allTransactions = db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.shiftId, shiftId))
      .orderBy(desc(schema.transactions.timestamp))
      .all();

    // Transform transactions with items
    const transactions = allTransactions.map((t) => ({
      ...t,
      items: this.getTransactionItemsDrizzle(t.id),
      appliedDiscounts: t.appliedDiscounts
        ? JSON.parse(t.appliedDiscounts)
        : undefined,
    })) as Transaction[];

    // Get cash drawer counts
    const cashDrawerCounts = this.getCashDrawerCountsByShiftIdDrizzle(shiftId);

    // Calculate totals using aggregation
    const salesStats = db
      .select({
        totalSales: drizzleSql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.type} = 'sale' AND ${schema.transactions.status} = 'completed' THEN ${schema.transactions.total} ELSE 0 END), 0)`,
        totalRefunds: drizzleSql<number>`COALESCE(ABS(SUM(CASE WHEN ${schema.transactions.type} = 'refund' AND ${schema.transactions.status} = 'completed' THEN ${schema.transactions.total} ELSE 0 END)), 0)`,
        totalVoids: drizzleSql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.status} = 'voided' THEN ${schema.transactions.total} ELSE 0 END), 0)`,
      })
      .from(schema.transactions)
      .where(eq(schema.transactions.shiftId, shiftId))
      .get();

    const totalSales = salesStats?.totalSales ?? 0;
    const totalRefunds = salesStats?.totalRefunds ?? 0;
    const totalVoids = salesStats?.totalVoids ?? 0;
    const cashVariance = shift.cashVariance ?? 0;

    // Calculate attendance variance if schedule exists
    let attendanceVariance;
    if (schedule) {
      const plannedStart = new Date(schedule.startTime);
      const actualStart = new Date(shift.startTime);
      const plannedEnd = schedule.endTime ? new Date(schedule.endTime) : null;
      const actualEnd = shift.endTime ? new Date(shift.endTime) : null;

      const earlyMinutes = Math.max(
        0,
        (plannedStart.getTime() - actualStart.getTime()) / (1000 * 60)
      );
      const lateMinutes = Math.max(
        0,
        (actualStart.getTime() - plannedStart.getTime()) / (1000 * 60)
      );

      attendanceVariance = {
        plannedStart: schedule.startTime,
        actualStart: shift.startTime,
        plannedEnd: schedule.endTime,
        actualEnd: shift.endTime,
        earlyMinutes: earlyMinutes > 0 ? Math.round(earlyMinutes) : undefined,
        lateMinutes: lateMinutes > 0 ? Math.round(lateMinutes) : undefined,
      };
    }

    return {
      shift,
      schedule,
      transactions,
      cashDrawerCounts,
      totalSales,
      totalRefunds,
      totalVoids,
      cashVariance,
      attendanceVariance,
    };
  }

  // Reporting Methods
  generateShiftReport(shiftId: string): ShiftReport | null {
    // Get shift data
    const shiftStmt = this.db.prepare(`SELECT * FROM shifts WHERE id = ?`);
    const shift = shiftStmt.get(shiftId) as Shift;

    if (!shift) return null;

    // Get linked schedule if exists
    let schedule: Schedule | undefined;
    if (shift.scheduleId) {
      const scheduleStmt = this.db.prepare(
        `SELECT * FROM schedules WHERE id = ?`
      );
      schedule = scheduleStmt.get(shift.scheduleId) as Schedule;
    }

    // Get transactions
    const transactions = this.getTransactionsByShiftId(shiftId);

    // Get cash drawer counts
    const cashDrawerCounts = this.getCashDrawerCountsByShiftId(shiftId);

    // Calculate totals
    const totalSales = transactions
      .filter((t) => t.type === "sale" && t.status === "completed")
      .reduce((sum, t) => sum + t.total, 0);

    const totalRefunds = Math.abs(
      transactions
        .filter((t) => t.type === "refund" && t.status === "completed")
        .reduce((sum, t) => sum + t.total, 0)
    );

    const totalVoids = transactions
      .filter((t) => t.status === "voided")
      .reduce((sum, t) => sum + t.total, 0);

    const cashVariance = shift.cashVariance || 0;

    // Calculate attendance variance if schedule exists
    let attendanceVariance;
    if (schedule) {
      const plannedStart = new Date(schedule.startTime);
      const actualStart = new Date(shift.startTime);
      const plannedEnd = schedule.endTime ? new Date(schedule.endTime) : null;
      const actualEnd = shift.endTime ? new Date(shift.endTime) : null;

      const earlyMinutes = Math.max(
        0,
        (plannedStart.getTime() - actualStart.getTime()) / (1000 * 60)
      );
      const lateMinutes = Math.max(
        0,
        (actualStart.getTime() - plannedStart.getTime()) / (1000 * 60)
      );

      attendanceVariance = {
        plannedStart: schedule.startTime,
        actualStart: shift.startTime,
        plannedEnd: schedule.endTime,
        actualEnd: shift.endTime,
        earlyMinutes: earlyMinutes > 0 ? Math.round(earlyMinutes) : undefined,
        lateMinutes: lateMinutes > 0 ? Math.round(lateMinutes) : undefined,
      };
    }

    return {
      shift,
      schedule,
      transactions,
      cashDrawerCounts,
      totalSales,
      totalRefunds,
      totalVoids,
      cashVariance,
      attendanceVariance,
    };
  }

  // Method to empty all tables in the database
  async emptyAllTables(): Promise<{
    success: boolean;
    tablesEmptied: string[];
    rowsDeleted: number;
    error?: string;
  }> {
    try {
      const tablesEmptied: string[] = [];
      let totalRowsDeleted = 0;

      // Get list of all tables (excluding sqlite internal tables)
      const tables = this.db
        .prepare(
          `
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
      `
        )
        .all() as { name: string }[];

      // Disable foreign key constraints temporarily
      this.db.exec("PRAGMA foreign_keys = OFF;");

      // Begin transaction for atomic operation
      this.db.exec("BEGIN TRANSACTION;");

      try {
        // Delete from each table
        for (const table of tables) {
          const tableName = table.name;

          // Get row count before deletion
          const countResult = this.db
            .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
            .get() as { count: number };
          const rowCount = countResult.count;

          if (rowCount > 0) {
            // Delete all rows
            this.db.prepare(`DELETE FROM ${tableName}`).run();
            tablesEmptied.push(tableName);
            totalRowsDeleted += rowCount;

            console.log(`Emptied table ${tableName}: ${rowCount} rows deleted`);
          }
        }

        // Reset autoincrement counters
        this.db.exec("DELETE FROM sqlite_sequence;");

        // Commit transaction
        this.db.exec("COMMIT;");

        // Re-enable foreign key constraints
        this.db.exec("PRAGMA foreign_keys = ON;");

        // Run VACUUM to reclaim space
        this.db.exec("VACUUM;");

        console.log(
          `Database emptied successfully. ${tablesEmptied.length} tables emptied, ${totalRowsDeleted} rows deleted.`
        );

        return {
          success: true,
          tablesEmptied,
          rowsDeleted: totalRowsDeleted,
        };
      } catch (error) {
        // Rollback on error
        this.db.exec("ROLLBACK;");
        this.db.exec("PRAGMA foreign_keys = ON;");
        throw error;
      }
    } catch (error) {
      console.error("Error emptying database:", error);
      return {
        success: false,
        tablesEmptied: [],
        rowsDeleted: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  close(): void {
    this.db.close();
  }

  // Utility method to get database information
  getDatabaseInfo(): {
    path: string;
    mode: "development" | "production";
    exists: boolean;
    size?: number;
  } {
    const dbPath = this.getDatabasePath();
    const isDev =
      process.env.NODE_ENV === "development" ||
      process.env.ELECTRON_IS_DEV === "true" ||
      !app.isPackaged;

    const info = {
      path: dbPath,
      mode: isDev ? ("development" as const) : ("production" as const),
      exists: fs.existsSync(dbPath),
      size: undefined as number | undefined,
    };

    if (info.exists) {
      try {
        const stats = fs.statSync(dbPath);
        info.size = stats.size;
      } catch (error) {
        console.warn("Could not get database file size:", error);
      }
    }

    return info;
  }
}

// Singleton instance
let dbManager: DatabaseManager | null = null;

export async function getDatabase(): Promise<DatabaseManager> {
  if (!dbManager) {
    dbManager = new DatabaseManager();
    await dbManager.initialize();
  }
  return dbManager;
}

export function closeDatabase(): void {
  if (dbManager) {
    dbManager.close();
    dbManager = null;
  }
}
