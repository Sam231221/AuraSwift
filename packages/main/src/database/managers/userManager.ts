import type { User, Permission } from "../models/user.js";

export class UserManager {
  private db: any;
  private bcrypt: any;
  private uuid: any;

  constructor(db: any, bcrypt: any, uuid: any) {
    this.db = db;
    this.bcrypt = bcrypt;
    this.uuid = uuid;
  }

  async createDefaultAdmin(): Promise<void> {
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
          INSERT INTO users (id, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive, address)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            1,
            ""
          );

        console.log("Default admin user created: admin@store.com / admin123");
      } finally {
        // Re-enable foreign key constraints
        this.db.exec("PRAGMA foreign_keys = ON");
      }
    }
  }

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
        INSERT INTO users (id, email, password, firstName, lastName, businessName, role, businessId, permissions, createdAt, updatedAt, isActive, address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

  deleteUserSessions(userId: string): void {
    this.db.prepare("DELETE FROM sessions WHERE userId = ?").run(userId);
  }
}
