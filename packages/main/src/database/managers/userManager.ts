import type { DrizzleDB } from "../drizzle.js";
import { eq, and, like, desc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";
import type { User, Permission } from "../schema.js";

import {
  registerSchema,
  loginSchema,
  pinLoginSchema,
  validateInput,
} from "../validation/authSchemas.js";

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: schema.User;
  users?: schema.User[];
  token?: string;
  errors?: string[];
  clockEvent?: any; // Clock event created on login
  shift?: any; // Active time shift
  requiresClockIn?: boolean; // Flag if clock-in is required
  isClockedIn?: boolean; // Flag if user is clocked in (on logout)
  activeShift?: any; // Active shift (on logout)
}

export class UserManager {
  private db: DrizzleDB;
  private bcrypt: any;
  private uuid: any;
  private sessionManager: any;
  private timeTrackingManager: any;

  constructor(
    drizzle: DrizzleDB,
    bcrypt: any,
    uuid: any,
    sessionManager?: any,
    timeTrackingManager?: any
  ) {
    this.db = drizzle;
    this.bcrypt = bcrypt;
    this.uuid = uuid;
    this.sessionManager = sessionManager;
    this.timeTrackingManager = timeTrackingManager;
  }

  setSessionManager(sessionManager: any): void {
    this.sessionManager = sessionManager;
  }

  setTimeTrackingManager(timeTrackingManager: any): void {
    this.timeTrackingManager = timeTrackingManager;
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

    return user as User;
  }

  async authenticateUser(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = this.getUserByEmail(email);
    if (!user) return null;

    const isValidPassword = await this.bcrypt.compare(
      password,
      user.passwordHash
    );
    if (!isValidPassword) return null;

    // Return user without passwordHash and salt
    const { passwordHash: _, salt: __, ...userWithoutSecrets } = user;
    return userWithoutSecrets as User;
  }
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
      business: result[0].business,
    };
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

    return user as User;
  }

  async authenticateUserByUsernamePin(
    username: string,
    pin: string
  ): Promise<User | null> {
    const user = this.getUserByUsername(username);
    if (!user) return null;

    const isValidPin = await this.bcrypt.compare(pin, user.pinHash);
    if (!isValidPin) return null;

    // Return user without passwordHash, pinHash, and salt
    const {
      passwordHash: _,
      pinHash: __,
      salt: ___,
      ...userWithoutSecrets
    } = user;
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

    return users as User[];
  }

  //CRUD
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
    const salt = await this.bcrypt.genSalt(10);
    const hashedPassword = await this.bcrypt.hash(userData.password, salt);
    const hashedPin = await this.bcrypt.hash(userData.pin, salt);
    const now = new Date();

    // Set permissions based on role
    let permissions: Permission[];
    switch (userData.role) {
      case "cashier":
        permissions = ["read:sales", "write:sales"];
        break;
      case "manager":
        permissions = [
          "read:sales",
          "write:sales",
          "read:reports",
          "manage:inventory",
          "override:transactions",
        ];
        break;
      case "admin":
        permissions = [
          "read:sales",
          "write:sales",
          "read:reports",
          "manage:inventory",
          "manage:users",
          "view:analytics",
          "override:transactions",
          "manage:settings",
        ];
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
        // Split businessName into firstName and lastName for the business
        const businessNameParts = (userData.businessName || "Business").split(" ");
        const businessFirstName = businessNameParts[0] || "Business";
        const businessLastName = businessNameParts.slice(1).join(" ") || "Name";
        
        tx.insert(schema.businesses)
          .values({
            id: businessId,
            firstName: businessFirstName,
            lastName: businessLastName,
            businessName: userData.businessName,
            ownerId: userId,
            email: "",
            phone: "",
            website: "",
            address: "",
            country: "",
            city: "",
            postalCode: "",
            vatNumber: "",
            businessType: "retail",
            currency: "USD",
            timezone: "UTC",
            isActive: true,
          })
          .run();
      }

      // 2. Create user (new schema fields)
      tx.insert(schema.users)
        .values({
          id: userId,
          username: userData.username,
          email: userData.email,
          passwordHash: hashedPassword,
          pinHash: hashedPin,
          salt: salt,
          firstName: userData.firstName,
          lastName: userData.lastName,
          businessName: userData.businessName,
          role: userData.role,
          businessId,
          permissions: permissions,
          isActive: true,
          loginAttempts: 0,
          address: "",
        })
        .run();
    });

    const user = this.getUserById(userId);
    if (!user) {
      throw new Error("User not found after creation");
    }
    return user;
  }
  updateUser(
    id: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      businessName: string;
      role: "cashier" | "supervisor" | "manager" | "admin" | "owner";
      isActive: boolean;
      address: string;
    }>
  ): { changes: number } {
    const result = this.db
      .update(schema.users)
      .set({ ...updates })
      .where(eq(schema.users.id, id))
      .run();

    return result;
  }

  deleteUser(id: string): { changes: number } {
    const result = this.db
      .update(schema.users)
      .set({
        isActive: false,
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

  getAllActiveUsers(): User[] {
    const users = this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.isActive, true))
      .orderBy(desc(schema.users.role), schema.users.firstName)
      .all();

    return users as User[];
  }

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

    return users as User[];
  }

  // Business Logic Methods (moved from appApi.ts)

  async register(data: {
    email: string;
    password: string;
    pin: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
    username: string;
  }): Promise<AuthResponse> {
    try {
      // Validate input data using Zod schema
      const validation = validateInput(registerSchema, data);

      if (!validation.success) {
        return {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        };
      }

      const validatedData = validation.data;

      // Check if user already exists
      const existingUser = this.getUserByEmail(validatedData.email);
      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists",
        };
      }

      // Ensure required fields are present (defaults if optional)
      const userData = {
        ...validatedData,
        username: validatedData.username || validatedData.email.split("@")[0],
        pin: validatedData.pin || "0000",
      };

      // Create user with validated data
      const user = await this.createUser(userData);

      // Create session using the session manager
      if (!this.sessionManager) {
        throw new Error("Session manager not initialized");
      }
      const session = this.sessionManager.createSession(user.id);

      // Return user without sensitive fields
      const {
        passwordHash: _,
        pinHash: __,
        salt: ___,
        ...userWithoutSecrets
      } = user;

      return {
        success: true,
        message: "User registered successfully",
        user: userWithoutSecrets as User,
        token: session.token,
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: "Registration failed due to server error",
      };
    }
  }

  async login(data: {
    email?: string;
    password?: string;
    username?: string;
    pin?: string;
    rememberMe?: boolean;
    terminalId?: string;
    ipAddress?: string;
    locationId?: string;
    autoClockIn?: boolean; // Default true for cashier/manager
  }): Promise<AuthResponse> {
    try {
      let user: User | null = null;
      let rememberMe = data.rememberMe || false;

      // Check if this is PIN-based login (username + PIN)
      if (data.username && data.pin) {
        // Validate PIN login
        const validation = validateInput(pinLoginSchema, {
          username: data.username,
          pin: data.pin,
          rememberMe: data.rememberMe,
        });

        if (!validation.success) {
          return {
            success: false,
            message: "Validation failed",
            errors: validation.errors,
          };
        }

        // Authenticate with username and PIN
        user = await this.authenticateUserByUsernamePin(
          data.username,
          data.pin
        );

        if (!user) {
          return {
            success: false,
            message: "Invalid username or PIN",
          };
        }
      }
      // Email/password login (legacy/admin login)
      else if (data.email && data.password) {
        // Validate email/password login
        const validation = validateInput(loginSchema, {
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        });

        if (!validation.success) {
          return {
            success: false,
            message: "Validation failed",
            errors: validation.errors,
          };
        }

        // Authenticate with email and password
        user = await this.authenticateUser(data.email, data.password);

        if (!user) {
          return {
            success: false,
            message: "Invalid email or password",
          };
        }
      } else {
        return {
          success: false,
          message: "Please provide either username/PIN or email/password",
        };
      }

      // Create session with custom expiry if rememberMe is set
      if (!this.sessionManager) {
        throw new Error("Session manager not initialized");
      }
      const session = this.sessionManager.createSession(
        user.id,
        rememberMe ? 30 : 0.5 // 30 days or 12 hours
      );

      // Auto clock-in for cashiers and managers (if enabled)
      let clockEvent = null;
      let shift = null;
      let requiresClockIn = false;

      if (this.timeTrackingManager) {
        const shouldClockIn =
          data.autoClockIn !== false &&
          (user.role === "cashier" || user.role === "manager");

        if (shouldClockIn) {
          // Check for existing active shift
          const activeShift = this.timeTrackingManager.getActiveShift(user.id);

          if (!activeShift) {
            try {
              // Create clock-in event
              clockEvent = await this.timeTrackingManager.createClockEvent({
                userId: user.id,
                terminalId: data.terminalId || "unknown",
                locationId: data.locationId,
                type: "in",
                method: "login",
                ipAddress: data.ipAddress,
              });

              // Validate clock event
              const validation =
                await this.timeTrackingManager.validateClockEvent(clockEvent);

              if (!validation.valid) {
                // Log warnings but don't fail login
                console.warn(
                  "Clock-in validation warnings:",
                  validation.warnings
                );
              }

              // Get business ID
              const userWithBusiness = this.getUserWithBusiness(user.id);
              if (userWithBusiness?.businessId) {
                // Create time shift
                shift = await this.timeTrackingManager.createShift({
                  userId: user.id,
                  businessId: userWithBusiness.businessId,
                  clockInId: clockEvent.id,
                });
              }
            } catch (error) {
              // Don't fail login if clock-in fails, but log it
              console.error("Auto clock-in failed:", error);
              requiresClockIn = true;
            }
          } else {
            // User already has active shift
            shift = activeShift;
          }
        }
      }

      return {
        success: true,
        message: "Login successful",
        user,
        token: session.token,
        clockEvent: clockEvent as any,
        shift: shift as any,
        requiresClockIn,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Login failed due to server error",
      };
    }
  }

  validateSession(token: string): AuthResponse {
    try {
      if (!this.sessionManager) {
        throw new Error("Session manager not initialized");
      }

      const session = this.sessionManager.getSessionByToken(token);
      if (!session) {
        return {
          success: false,
          message: "Invalid or expired session",
        };
      }

      const user = this.getUserById(session.userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Return user without sensitive fields
      const {
        passwordHash: _,
        pinHash: __,
        salt: ___,
        ...userWithoutSecrets
      } = user;

      return {
        success: true,
        message: "Session valid",
        user: userWithoutSecrets as User,
      };
    } catch (error) {
      console.error("Session validation error:", error);
      return {
        success: false,
        message: "Session validation failed",
      };
    }
  }

  async logout(
    token: string,
    options?: {
      terminalId?: string;
      ipAddress?: string;
      autoClockOut?: boolean; // Default true for cashier/manager
    }
  ): Promise<AuthResponse> {
    try {
      if (!this.sessionManager) {
        throw new Error("Session manager not initialized");
      }

      // Get user from session before deleting
      const session = this.sessionManager.getSessionByToken(token);
      if (!session) {
        return {
          success: false,
          message: "Session not found",
        };
      }

      const user = this.getUserById(session.userId);

      // Check if user is clocked in (for warning, but don't force clock-out)
      let activeShift = null;
      let isClockedIn = false;

      if (this.timeTrackingManager && user) {
        activeShift = this.timeTrackingManager.getActiveShift(user.id);
        isClockedIn = !!activeShift;

        // Auto clock-out if enabled and user is clocked in
        const shouldClockOut =
          options?.autoClockOut !== false &&
          (user.role === "cashier" || user.role === "manager") &&
          isClockedIn;

        if (shouldClockOut && activeShift) {
          try {
            // End any active breaks
            const activeBreak = this.timeTrackingManager.getActiveBreak(
              activeShift.id
            );
            if (activeBreak) {
              await this.timeTrackingManager.endBreak(activeBreak.id);
            }

            // Create clock-out event
            const clockEvent = await this.timeTrackingManager.createClockEvent({
              userId: user.id,
              terminalId: options?.terminalId || "unknown",
              type: "out",
              method: "logout",
              ipAddress: options?.ipAddress,
            });

            // Complete shift
            await this.timeTrackingManager.completeShift(
              activeShift.id,
              clockEvent.id
            );
          } catch (error) {
            // Don't fail logout if clock-out fails, but log it
            console.error("Auto clock-out failed:", error);
          }
        }
      }

      // Delete session
      const deleted = this.sessionManager.deleteSession(token);

      return {
        success: deleted,
        message: deleted ? "Logged out successfully" : "Session not found",
        isClockedIn: isClockedIn as any, // Flag to show warning in UI
        activeShift: activeShift as any,
      };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: "Logout failed",
      };
    }
  }

  getUserByIdWithResponse(userId: string): AuthResponse {
    try {
      const user = this.getUserById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Return user without sensitive fields
      const {
        passwordHash: _,
        pinHash: __,
        salt: ___,
        ...userWithoutSecrets
      } = user;

      return {
        success: true,
        message: "User found",
        user: userWithoutSecrets as User,
      };
    } catch (error) {
      console.error("Get user error:", error);
      return {
        success: false,
        message: "Failed to get user",
      };
    }
  }

  updateUserWithResponse(
    userId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      businessName: string;
      role: "cashier" | "manager" | "admin";
      isActive: boolean;
      address: string;
    }>
  ): AuthResponse {
    try {
      const result = this.updateUser(userId, updates);
      if (result.changes === 0) {
        return {
          success: false,
          message: "User not found or update failed",
        };
      }

      const user = this.getUserById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found after update",
        };
      }

      // Return user without sensitive fields
      const {
        passwordHash: _,
        pinHash: __,
        salt: ___,
        ...userWithoutSecrets
      } = user;

      return {
        success: true,
        message: "User updated successfully",
        user: userWithoutSecrets as User,
      };
    } catch (error) {
      console.error("Update user error:", error);
      return {
        success: false,
        message: "Update failed due to server error",
      };
    }
  }

  deleteUserWithResponse(userId: string): AuthResponse {
    try {
      // Check if user exists first
      const user = this.getUserById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const result = this.deleteUser(userId);
      if (result.changes === 0) {
        return {
          success: false,
          message: "Failed to delete user",
        };
      }

      return {
        success: true,
        message: "User deleted successfully",
      };
    } catch (error) {
      console.error("Delete user error:", error);
      return {
        success: false,
        message: "Delete failed due to server error",
      };
    }
  }

  getUsersByBusinessWithResponse(businessId: string): AuthResponse {
    try {
      const users = this.getUsersByBusiness(businessId);

      return {
        success: true,
        message: "Users retrieved successfully",
        users,
      };
    } catch (error: any) {
      console.error("Get users by business error:", error);
      return {
        success: false,
        message: error.message || "Failed to get users",
      };
    }
  }

  async createUserForBusiness(userData: {
    businessId: string;
    email: string;
    password: string;
    pin: string;
    username: string;
    firstName: string;
    lastName: string;
    role: "cashier" | "manager";
  }): Promise<AuthResponse> {
    try {
      // Get business to retrieve business name
      const [business] = this.db
        .select()
        .from(schema.businesses)
        .where(eq(schema.businesses.id, userData.businessId))
        .limit(1)
        .all();

      if (!business) {
        return {
          success: false,
          message: "Business not found",
        };
      }

      const user = await this.createUser({
        ...userData,
        businessName: business.businessName,
      });

      // Return user without sensitive fields
      const {
        passwordHash: _,
        pinHash: __,
        salt: ___,
        ...userWithoutSecrets
      } = user;

      return {
        success: true,
        message: "User created successfully",
        user: userWithoutSecrets as User,
      };
    } catch (error: any) {
      console.error("Create user error:", error);
      return {
        success: false,
        message: error.message || "Failed to create user",
      };
    }
  }
}
