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
    `);

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
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    const values = fields.map(
      (field) => updates[field as keyof typeof updates]
    );

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
