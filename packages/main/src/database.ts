import { app } from "electron";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export interface User {
  id: string;
  email: string;
  address: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: "cashier" | "manager" | "admin";
  businessId: string;
  permissions: Permission[];
  avatar?: string; // Base64 encoded image string
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
  avatar: string;
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

class DatabaseManager {
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

  //create tables if they don't exist
  private initializeTables() {
    // First create businesses table (no foreign keys)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT,
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
        address TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        businessName TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('cashier', 'manager', 'admin')),
        businessId TEXT NOT NULL,
        permissions TEXT NOT NULL,
        avatar TEXT,
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

    // Key-value storage table for app settings/cache
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS key_value_store (
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
    `);

    // Add avatar column if it doesn't exist (for existing databases)
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN avatar TEXT`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE businesses ADD COLUMN avatar TEXT`);
    } catch (error) {
      // Column already exists, ignore error
    }

    // Insert default admin user if no users exist
    this.createDefaultAdmin();
  }

  // Create a default admin user if none exist
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
          INSERT INTO users (id, email, password, address, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            adminId,
            "admin@store.com",
            hashedPassword,
            "Default Address", // Adding default address
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
  async registerBusiness(data: {
    businessName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    businessAvatar?: string;
  }): Promise<{ business: Business; admin: User }> {
    const now = new Date().toISOString();
    const businessId = this.uuid.v4();
    const adminId = this.uuid.v4();
    const hashedPassword = await this.bcrypt.hash(data.password, 10);

    // Create business
    this.db
      .prepare(
        `
    INSERT INTO businesses (id, name, avatar, ownerId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `
      )
      .run(
        businessId,
        data.businessName,
        data.businessAvatar || null,
        adminId,
        now,
        now
      );

    // Admin has full permissions
    const permissions = JSON.stringify([{ action: "*", resource: "*" }]);

    // Create admin user
    this.db
      .prepare(
        `
    INSERT INTO users (
      id, email, password, address, firstName, lastName, businessName, role,
      businessId, permissions, avatar, createdAt, updatedAt, isActive
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
      )
      .run(
        adminId,
        data.email,
        hashedPassword,
        "", // Default empty address for business registration
        data.firstName,
        data.lastName,
        data.businessName,
        "admin",
        businessId,
        permissions,
        data.avatar || null,
        now,
        now,
        1
      );

    const business = this.getBusinessById(businessId)!;
    const admin = this.getUserById(adminId)!;

    return { business, admin };
  }

  async createUser(data: {
    businessId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "cashier" | "manager";
    avatar?: string;
    address?: string;
  }): Promise<User> {
    const hashedPassword = await this.bcrypt.hash(data.password, 10);
    const now = new Date().toISOString();

    // Check if there's an existing soft-deleted user with the same email
    const existingUser = this.db
      .prepare("SELECT * FROM users WHERE email = ? AND isActive = 0")
      .get(data.email) as any;

    // Assign permissions based on role
    let permissions: Permission[] = [];
    if (data.role === "cashier") {
      permissions = [
        { action: "read", resource: "sales" },
        { action: "create", resource: "transactions" },
        { action: "read", resource: "products" },
        { action: "read", resource: "basic_reports" },
      ];
    } else if (data.role === "manager") {
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
    }

    let userId: string;

    if (existingUser) {
      // Reactivate and update the existing soft-deleted user
      userId = existingUser.id;
      this.db
        .prepare(
          `
        UPDATE users SET 
          password = ?, firstName = ?, lastName = ?, businessName = ?, role = ?,
          businessId = ?, permissions = ?, avatar = ?, address = ?, 
          updatedAt = ?, isActive = 1
        WHERE id = ?
      `
        )
        .run(
          hashedPassword,
          data.firstName,
          data.lastName,
          this.getBusinessById(data.businessId)?.name || "Unknown Business",
          data.role,
          data.businessId,
          JSON.stringify(permissions),
          data.avatar || null,
          data.address || "Not specified",
          now,
          userId
        );
    } else {
      // Create a new user
      userId = this.uuid.v4();
      this.db
        .prepare(
          `
      INSERT INTO users (
        id, email, password, firstName, lastName, businessName, role,
        businessId, permissions, avatar, address, createdAt, updatedAt, isActive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
        )
        .run(
          userId,
          data.email,
          hashedPassword,
          data.firstName,
          data.lastName,
          // Keep businessName consistent with the parent business
          this.getBusinessById(data.businessId)?.name || "Unknown Business",
          data.role,
          data.businessId,
          JSON.stringify(permissions),
          data.avatar || null,
          data.address || "Not specified",
          now,
          now,
          1
        );
    }

    const user = this.getUserById(userId);
    if (!user) throw new Error("User not found after creation");

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

  // Key-value storage methods
  /**
   * Set a key-value pair in storage
   */
  setKeyValue(key: string, value: string): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT OR REPLACE INTO key_value_store (key, value, createdAt, updatedAt) VALUES (?, ?, ?, ?)`
      )
      .run(key, value, now, now);
  }

  /**
   * Get a value by key from storage
   */
  getKeyValue(key: string): string | null {
    const result = this.db
      .prepare("SELECT value FROM key_value_store WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return result?.value || null;
  }

  /**
   * Delete a key-value pair from storage
   */
  deleteKeyValue(key: string): void {
    this.db.prepare("DELETE FROM key_value_store WHERE key = ?").run(key);
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
      avatar: string;
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
