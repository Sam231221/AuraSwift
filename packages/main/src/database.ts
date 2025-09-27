import { app } from "electron";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: "cashier" | "manager" | "admin";
  businessId: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Permission {
  action: string;
  resource: string;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  taxRate: number;
  sku: string;
  plu?: string;
  image?: string;
  category: string;
  stockLevel: number;
  minStockLevel: number;
  businessId: string;
  modifiers: Modifier[];
  isActive: boolean;
  // Weight-based product fields
  requiresWeight?: boolean;
  unit?: "lb" | "kg" | "oz" | "g" | "each";
  pricePerUnit?: number; // Price per weight unit (e.g., $1.99/lb)
  createdAt: string;
  updatedAt: string;
}

export interface Modifier {
  id: string;
  name: string;
  type: "single" | "multiple";
  options: ModifierOption[];
  required: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  type: "add" | "remove" | "sale" | "waste" | "adjustment";
  quantity: number;
  reason: string;
  userId: string;
  businessId: string;
  timestamp: string;
}

export interface Schedule {
  id: string;
  staffId: string;
  businessId: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  status: "upcoming" | "active" | "completed" | "missed";
  assignedRegister?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  scheduleId?: string; // Optional - may be unscheduled
  cashierId: string;
  businessId: string;
  startTime: string;
  endTime?: string;
  status: "active" | "ended";
  startingCash: number;
  finalCashDrawer?: number;
  expectedCashDrawer?: number;
  cashVariance?: number;
  totalSales?: number;
  totalTransactions?: number;
  totalRefunds?: number;
  totalVoids?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  shiftId: string;
  businessId: string;
  type: "sale" | "refund" | "void";
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "mixed";
  cashAmount?: number;
  cardAmount?: number;
  items: TransactionItem[];
  status: "completed" | "voided" | "pending";
  voidReason?: string;
  customerId?: string;
  receiptNumber: string;
  timestamp: string;
  createdAt: string;
  // Refund-specific fields
  originalTransactionId?: string; // For refunds, links to original sale
  refundReason?: string; // Why the refund was processed
  refundMethod?: "original" | "store_credit" | "cash" | "card";
  managerApprovalId?: string; // Manager who approved the refund (if required)
  isPartialRefund?: boolean; // True if only some items were refunded
}

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  appliedModifiers?: AppliedModifier[];
  // Refund support
  refundedQuantity?: number; // How many of this item have been refunded
  weight?: number; // For weight-based products
}

export interface RefundItem {
  originalItemId: string;
  productId: string;
  productName: string;
  originalQuantity: number;
  refundQuantity: number;
  unitPrice: number;
  refundAmount: number;
  reason: string;
  restockable: boolean; // Whether to return to inventory
}

export interface AppliedModifier {
  modifierId: string;
  modifierName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CashDrawerCount {
  id: string;
  shiftId: string;
  businessId: string;
  countType: "mid-shift" | "end-shift";
  expectedAmount: number;
  countedAmount: number;
  variance: number;
  notes?: string;
  countedBy: string; // userId
  timestamp: string;
  createdAt: string;
}

export interface ShiftReport {
  shift: Shift;
  schedule?: Schedule;
  transactions: Transaction[];
  cashDrawerCounts: CashDrawerCount[];
  totalSales: number;
  totalRefunds: number;
  totalVoids: number;
  cashVariance: number;
  attendanceVariance?: {
    plannedStart?: string;
    actualStart: string;
    plannedEnd?: string;
    actualEnd?: string;
    earlyMinutes?: number;
    lateMinutes?: number;
  };
}

export class DatabaseManager {
  private db: any;
  private bcrypt: any;
  private uuid: any;
  private initialized: boolean = false;

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

      const dbPath = path.join(app.getPath("userData"), "pos_system.db");
      this.db = new Database(dbPath);
      this.initializeTables();
      this.initialized = true;
    } catch (error) {
      console.error("Database initialization error:", error);
      throw error;
    }
  }

  private initializeTables() {
    // First create businesses table (no foreign keys)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ownerId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Then create users table with foreign key to businesses
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

    // Products table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        costPrice REAL DEFAULT 0,
        taxRate REAL DEFAULT 0,
        sku TEXT UNIQUE NOT NULL,
        plu TEXT,
        image TEXT,
        category TEXT NOT NULL,
        stockLevel INTEGER DEFAULT 0,
        minStockLevel INTEGER DEFAULT 0,
        businessId TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (businessId) REFERENCES businesses (id)
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

    // Transactions table for sales, refunds, voids
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
        FOREIGN KEY (shiftId) REFERENCES shifts (id),
        FOREIGN KEY (businessId) REFERENCES businesses (id)
      )
    `);

    // Transaction items table for individual line items
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id TEXT PRIMARY KEY,
        transactionId TEXT NOT NULL,
        productId TEXT NOT NULL,
        productName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        totalPrice REAL NOT NULL,
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

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);

      CREATE INDEX IF NOT EXISTS idx_products_businessId ON products(businessId);
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
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

      CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs(userId);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    `);

    // Add weight-related fields to products table if they don't exist
    try {
      this.db.exec(`
        ALTER TABLE products ADD COLUMN requiresWeight BOOLEAN DEFAULT 0;
      `);
    } catch (err) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`
        ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'each';
      `);
    } catch (err) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`
        ALTER TABLE products ADD COLUMN pricePerUnit REAL;
      `);
    } catch (err) {
      // Column already exists, ignore error
    }

    // Add refund-specific columns to transactions table
    try {
      this.db.exec(`
        ALTER TABLE transactions ADD COLUMN originalTransactionId TEXT;
      `);
    } catch (err) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`
        ALTER TABLE transactions ADD COLUMN refundReason TEXT;
      `);
    } catch (err) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`
        ALTER TABLE transactions ADD COLUMN refundMethod TEXT;
      `);
    } catch (err) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`
        ALTER TABLE transactions ADD COLUMN managerApprovalId TEXT;
      `);
    } catch (err) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`
        ALTER TABLE transactions ADD COLUMN isPartialRefund BOOLEAN DEFAULT 0;
      `);
    } catch (err) {
      // Column already exists, ignore error
    }

    // Add refund support to transaction items
    try {
      this.db.exec(`
        ALTER TABLE transaction_items ADD COLUMN refundedQuantity INTEGER DEFAULT 0;
      `);
    } catch (err) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`
        ALTER TABLE transaction_items ADD COLUMN weight REAL;
      `);
    } catch (err) {
      // Column already exists, ignore error
    }

    // Add index for refund lookups
    try {
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_transactions_originalTransactionId ON transactions(originalTransactionId);
      `);
    } catch (err) {
      // Index already exists, ignore error
    }

    // Insert default admin user if no users exist
    this.createDefaultAdmin();
  }

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
          INSERT INTO users (id, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            adminId,
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

        console.log("Default admin user created: admin@store.com / admin123");
      } finally {
        // Re-enable foreign key constraints
        this.db.exec("PRAGMA foreign_keys = ON");
      }
    }
  }

  // User management methods
  async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
    businessId?: string;
  }): Promise<User> {
    const userId = this.uuid.v4();
    const businessId = userData.businessId || this.uuid.v4();
    const hashedPassword = await this.bcrypt.hash(userData.password, 10);
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
      }

      // Create user
      this.db
        .prepare(
          `
        INSERT INTO users (id, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          userId,
          userData.email,
          hashedPassword,
          userData.firstName,
          userData.lastName,
          userData.businessName,
          userData.role,
          businessId,
          JSON.stringify(permissions),
          now,
          now,
          1
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

  async authenticateUser(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = this.getUserByEmail(email);
    if (!user) return null;

    const isValidPassword = await this.bcrypt.compare(password, user.password);
    if (!isValidPassword) return null;

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
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

  // Business management methods
  getBusinessById(id: string): Business | null {
    return this.db
      .prepare("SELECT * FROM businesses WHERE id = ?")
      .get(id) as Business | null;
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
  // Product CRUD operations

  /**
   * Create a new product
   */
  async createProduct(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt" | "modifiers">
  ): Promise<Product> {
    const productId = this.uuid.v4();
    const now = new Date().toISOString();

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
        productData.category,
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

  getShiftById(shiftId: string): Shift | null {
    const stmt = this.db.prepare("SELECT * FROM shifts WHERE id = ?");
    return (stmt.get(shiftId) as Shift) || null;
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

  close(): void {
    this.db.close();
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
