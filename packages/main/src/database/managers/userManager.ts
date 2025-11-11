import type { User, Permission } from "../models/user.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, like, desc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class UserManager {
  private db: DrizzleDB;
  private bcrypt: any;
  private uuid: any;

  constructor(drizzle: DrizzleDB, bcrypt: any, uuid: any) {
    this.db = drizzle;
    this.bcrypt = bcrypt;
    this.uuid = uuid;
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    pin: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
    businessId?: string;
  }): Promise<User> {
    const userId = this.uuid.v4();
    const businessId = userData.businessId || this.uuid.v4();
    const hashedPassword = await this.bcrypt.hash(userData.password, 10);
    const hashedPin = await this.bcrypt.hash(userData.pin, 10);
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
      const [businessExists] = this.db
        .select({ id: schema.businesses.id })
        .from(schema.businesses)
        .where(eq(schema.businesses.id, userData.businessId))
        .limit(1)
        .all();
      if (!businessExists) {
        throw new Error("Business does not exist for provided businessId");
      }
    }

    // Use Drizzle transaction
    this.db.transaction((tx) => {
      // 1. Create business if not provided
      if (!userData.businessId) {
        tx.insert(schema.businesses)
          .values({
            id: businessId,
            name: userData.businessName,
            ownerId: userId,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }

      // 2. Create user
      tx.insert(schema.users)
        .values({
          id: userId,
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          pin: hashedPin,
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

    const user = this.getUserById(userId);
    if (!user) {
      throw new Error("User not found after creation");
    }
    return user;
  }

  getUserByEmail(email: string): User | null {
    const [user] = this.db
      .select()
      .from(schema.users)
      .where(
        and(eq(schema.users.email, email), eq(schema.users.isActive, true))
      )
      .limit(1)
      .all();

    if (!user) return null;

    return {
      ...user,
      permissions:
        typeof user.permissions === "string"
          ? JSON.parse(user.permissions)
          : user.permissions,
    } as User;
  }

  getUserById(id: string): User | null {
    const [user] = this.db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, id), eq(schema.users.isActive, true)))
      .limit(1)
      .all();

    if (!user) return null;

    return {
      ...user,
      permissions:
        typeof user.permissions === "string"
          ? JSON.parse(user.permissions)
          : user.permissions,
    } as User;
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

  getUserByUsername(username: string): User | null {
    const [user] = this.db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.username, username),
          eq(schema.users.isActive, true)
        )
      )
      .limit(1)
      .all();

    if (!user) return null;

    return {
      ...user,
      permissions:
        typeof user.permissions === "string"
          ? JSON.parse(user.permissions)
          : user.permissions,
    } as User;
  }

  async authenticateUserByUsernamePin(
    username: string,
    pin: string
  ): Promise<User | null> {
    const user = this.getUserByUsername(username);
    if (!user) return null;

    const isValidPin = await this.bcrypt.compare(pin, user.pin);
    if (!isValidPin) return null;

    // Return user without password and PIN
    const { password: _, pin: __, ...userWithoutSecrets } = user;
    return userWithoutSecrets as User;
  }

  getUsersByBusiness(businessId: string): User[] {
    const users = this.db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.businessId, businessId),
          eq(schema.users.isActive, true)
        )
      )
      .orderBy(desc(schema.users.createdAt))
      .all();

    return users.map((user) => ({
      ...user,
      permissions:
        typeof user.permissions === "string"
          ? JSON.parse(user.permissions)
          : user.permissions,
    })) as User[];
  }

  updateUser(
    id: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      businessName: string;
      role: "cashier" | "manager" | "admin";
      isActive: boolean;
      address: string;
    }>
  ): { changes: number } {
    const now = new Date().toISOString();

    const result = this.db
      .update(schema.users)
      .set({ ...updates, updatedAt: now })
      .where(eq(schema.users.id, id))
      .run();

    return result;
  }

  deleteUser(id: string): { changes: number } {
    const now = new Date().toISOString();

    const result = this.db
      .update(schema.users)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(eq(schema.users.id, id))
      .run();

    return result;
  }

  deleteUserSessions(userId: string): void {
    this.db
      .delete(schema.sessions)
      .where(eq(schema.sessions.userId, userId))
      .run();
  }

  /**
   * Search users by name or email using Drizzle ORM (type-safe)
   */
  async searchUsers(businessId: string, searchTerm: string): Promise<User[]> {
    const searchPattern = `%${searchTerm}%`;

    const users = this.db
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
      .orderBy(desc(schema.users.createdAt))
      .all();

    return users.map((user) => ({
      ...user,
      isActive: user.isActive ?? true,
      address: user.address ?? "",
      permissions: JSON.parse(user.permissions as string) as Permission[],
    })) as User[];
  }

  /**
   * Get user with business details using JOIN (type-safe)
   */
  getUserWithBusiness(userId: string) {
    const result = this.db
      .select({
        user: schema.users,
        business: schema.businesses,
      })
      .from(schema.users)
      .innerJoin(
        schema.businesses,
        eq(schema.users.businessId, schema.businesses.id)
      )
      .where(and(eq(schema.users.id, userId), eq(schema.users.isActive, true)))
      .limit(1)
      .all();

    if (!result[0]) return null;

    return {
      ...result[0].user,
      permissions: JSON.parse(
        result[0].user.permissions as string
      ) as Permission[],
      business: result[0].business,
    };
  }
}
