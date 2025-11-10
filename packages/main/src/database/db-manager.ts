import path from "path";
import fs from "fs";
import { app } from "electron";
import { createRequire } from "module";
import {
  initializeVersioning,
  getCurrentVersion,
  getLatestVersion,
} from "./versioning/index.js";

const require = createRequire(import.meta.url);

/**
 * Database Manager
 *
 * Handles low-level database initialization and schema creation.
 *
 * Initialization Flow:
 * 1. Connect to SQLite database
 * 2. Create baseline schema via initializeTables() (if needed)
 * 3. Initialize versioning system (PRAGMA user_version)
 * 4. Run any pending migrations
 *
 * Version Tracking:
 * - Uses PRAGMA user_version (NOT schema_version table)
 * - Version 0: Baseline schema (all tables created)
 * - Version 1+: Future migrations from migrations.ts
 *
 * For database operations, use DatabaseManager from database.ts
 * which provides manager classes for domain-specific operations.
 */
export class DBManager {
  private db: any;
  private initialized: boolean = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const Database = require("better-sqlite3");
      const dbPath = this.getDatabasePath();
      console.log("Database path:", dbPath);

      // Ensure the directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(dbPath);

      // Step 1: Initialize all tables (baseline schema - version 0)
      // This creates the complete database structure including all historical changes
      this.initializeTables();

      // Step 2: Initialize versioning system and run pending migrations
      // This will set PRAGMA user_version and apply any new schema changes
      const versioningSuccess = initializeVersioning(this.db, dbPath);

      if (!versioningSuccess) {
        throw new Error("Database versioning initialization failed");
      }

      this.initialized = true;

      // Log final version
      const currentVersion = getCurrentVersion(this.db);
      const latestVersion = getLatestVersion();
      console.log(
        `✅ Database initialized successfully (v${currentVersion}/${latestVersion})\n`
      );
    } catch (error) {
      console.error("❌ Database initialization error:", error);
      throw error;
    }
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
      const projectRoot = path.join(__dirname, "..", "..", "..", "..");
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
   * Initialize Baseline Database Schema (Version 0)
   *
   * Creates all tables with their complete structure including:
   * - All core tables (users, businesses, products, transactions, etc.)
   * - Historical migration fields already included:
   *   * Business: address, phone, vatNumber
   *   * Discount: discountAmount, appliedDiscounts
   * - All indexes for performance
   *
   * This represents the baseline schema that all installations start with.
   * Future changes are applied via the migration system (migrations.ts).
   */
  private initializeTables() {
    // First create businesses table (no foreign keys)
    // Includes historical fields: address, phone, vatNumber
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
    // Includes migrated field: address
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
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

    // Categories table with migrated fields: parentId and UNIQUE constraint on (name, businessId)
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

    // Audit logs table for tracking sensitive operations
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resourceId TEXT NOT NULL,
        details TEXT,
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

      CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs(userId);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_transactions_originalTransactionId ON transactions(originalTransactionId);
      
      CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_printer_name ON print_jobs(printer_name);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON print_jobs(created_at);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_business_id ON print_jobs(business_id);
      CREATE INDEX IF NOT EXISTS idx_print_jobs_created_by ON print_jobs(created_by);
      
      CREATE INDEX IF NOT EXISTS idx_print_job_retries_job_id ON print_job_retries(job_id);
      CREATE INDEX IF NOT EXISTS idx_print_job_retries_timestamp ON print_job_retries(timestamp);
    `);
  }

  getDb(): any {
    if (!this.initialized) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.initialized = false;
    }
  }
}
