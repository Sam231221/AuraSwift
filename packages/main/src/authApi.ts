import { getDatabase, type User, type Business } from "./database.js";
import {
  validatePassword,
  validateEmail,
  validateName,
  validateBusinessName,
} from "./passwordUtils.js";

export interface RegisterBusinessRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  avatar?: string;
  businessAvatar?: string;
}

export interface CreateUserRequest {
  businessId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "cashier" | "manager";
  avatar?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: "cashier" | "manager" | "admin";
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  users?: User[];
  business?: Business;
  token?: string;
  errors?: string[];
}

export class AuthAPI {
  private db: any = null;

  private async getDb() {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Validate input data
      const validationErrors: string[] = [];

      if (!validateEmail(data.email)) {
        validationErrors.push("Invalid email format");
      }

      if (!validateName(data.firstName)) {
        validationErrors.push("First name must be between 2 and 50 characters");
      }

      if (!validateName(data.lastName)) {
        validationErrors.push("Last name must be between 2 and 50 characters");
      }

      if (!validateBusinessName(data.businessName)) {
        validationErrors.push(
          "Business name must be between 2 and 100 characters"
        );
      }

      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        validationErrors.push(...passwordValidation.errors);
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        };
      }

      const db = await this.getDb();

      // Check if user already exists
      const existingUser = db.getUserByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists",
        };
      }

      // Create user
      const user = await db.createUser(data);

      // Create session using the correct userId
      const session = db.createSession(user.id);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: "User registered successfully",
        user: userWithoutPassword as User,
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

  async registerBusiness(data: RegisterBusinessRequest): Promise<AuthResponse> {
    try {
      // Validate input data
      const validationErrors: string[] = [];

      if (!validateEmail(data.email)) {
        validationErrors.push("Invalid email format");
      }

      if (!validateName(data.firstName)) {
        validationErrors.push("First name must be between 2 and 50 characters");
      }

      if (!validateName(data.lastName)) {
        validationErrors.push("Last name must be between 2 and 50 characters");
      }

      if (!validateBusinessName(data.businessName)) {
        validationErrors.push(
          "Business name must be between 2 and 100 characters"
        );
      }

      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        validationErrors.push(...passwordValidation.errors);
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        };
      }

      const db = await this.getDb();

      // Check if user already exists
      const existingUser = db.getUserByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists",
        };
      }

      // Register business and admin user
      const result = await db.registerBusiness(data);

      // Create session for the admin user
      const session = db.createSession(result.admin.id);

      // Return user without password
      const { password: _, ...userWithoutPassword } = result.admin;

      return {
        success: true,
        message: "Business registered successfully",
        user: userWithoutPassword as User,
        business: result.business,
        token: session.token,
      };
    } catch (error) {
      console.error("Business registration error:", error);
      return {
        success: false,
        message: "Business registration failed due to server error",
      };
    }
  }

  async createUser(data: CreateUserRequest): Promise<AuthResponse> {
    try {
      // Validate input data
      const validationErrors: string[] = [];

      if (!validateEmail(data.email)) {
        validationErrors.push("Invalid email format");
      }

      if (!validateName(data.firstName)) {
        validationErrors.push("First name must be between 2 and 50 characters");
      }

      if (!validateName(data.lastName)) {
        validationErrors.push("Last name must be between 2 and 50 characters");
      }

      if (!data.businessId) {
        validationErrors.push("Business ID is required");
      }

      if (!["cashier", "manager"].includes(data.role)) {
        validationErrors.push("Role must be either cashier or manager");
      }

      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        validationErrors.push(...passwordValidation.errors);
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        };
      }

      const db = await this.getDb();

      // Check if user already exists
      const existingUser = db.getUserByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists",
        };
      }

      // Create user
      const user = await db.createUser(data);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: "User created successfully",
        user: userWithoutPassword as User,
      };
    } catch (error) {
      console.error("User creation error:", error);
      return {
        success: false,
        message: "User creation failed due to server error",
      };
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Validate input
      if (!validateEmail(data.email)) {
        return {
          success: false,
          message: "Invalid email format",
        };
      }

      if (!data.password || data.password.length < 1) {
        return {
          success: false,
          message: "Password is required",
        };
      }

      const db = await this.getDb();

      // Authenticate user
      const user = await db.authenticateUser(data.email, data.password);
      if (!user) {
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      // Create session with custom expiry if rememberMe is set
      let session;
      if (data.rememberMe) {
        session = db.createSession(user.id, 30); // 30 days
      } else {
        session = db.createSession(user.id, 0.5); // 12 hours
      }

      return {
        success: true,
        message: "Login successful",
        user,
        token: session.token,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Login failed due to server error",
      };
    }
  }

  async validateSession(token: string): Promise<AuthResponse> {
    try {
      const db = await this.getDb();
      const session = db.getSessionByToken(token);
      if (!session) {
        return {
          success: false,
          message: "Invalid or expired session",
        };
      }

      const user = db.getUserById(session.userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: "Session valid",
        user: userWithoutPassword as User,
      };
    } catch (error) {
      console.error("Session validation error:", error);
      return {
        success: false,
        message: "Session validation failed",
      };
    }
  }

  async logout(token: string): Promise<AuthResponse> {
    try {
      const db = await this.getDb();
      const deleted = db.deleteSession(token);
      return {
        success: deleted,
        message: deleted ? "Logged out successfully" : "Session not found",
      };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: "Logout failed",
      };
    }
  }

  async getUserById(userId: string): Promise<AuthResponse> {
    try {
      const db = await this.getDb();
      const user = db.getUserById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: "User found",
        user: userWithoutPassword as User,
      };
    } catch (error) {
      console.error("Get user error:", error);
      return {
        success: false,
        message: "Failed to get user",
      };
    }
  }

  async updateUser(
    userId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      businessName: string;
      role: "cashier" | "manager" | "admin";
    }>
  ): Promise<AuthResponse> {
    try {
      const db = await this.getDb();
      const success = db.updateUser(userId, updates);
      if (!success) {
        return {
          success: false,
          message: "User not found or update failed",
        };
      }

      const user = db.getUserById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found after update",
        };
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: "User updated successfully",
        user: userWithoutPassword as User,
      };
    } catch (error) {
      console.error("Update user error:", error);
      return {
        success: false,
        message: "Update failed due to server error",
      };
    }
  }

  async getUsersByBusiness(businessId: string): Promise<AuthResponse> {
    try {
      const db = await this.getDb();
      const users = db.getUsersByBusiness(businessId);

      // Remove passwords from all users
      const usersWithoutPasswords = users.map((user: any) => {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      });

      return {
        success: true,
        message: "Users retrieved successfully",
        users: usersWithoutPasswords,
      };
    } catch (error) {
      console.error("Get users by business error:", error);
      return {
        success: false,
        message: "Failed to retrieve users",
      };
    }
  }

  async deleteUser(userId: string): Promise<AuthResponse> {
    try {
      const db = await this.getDb();
      const success = db.deleteUser(userId);

      if (!success) {
        return {
          success: false,
          message: "User not found or could not be deleted",
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

  // Cleanup expired sessions (call this periodically)
  async cleanupExpiredSessions(): Promise<void> {
    const db = await this.getDb();
    db.cleanupExpiredSessions();
  }
}

// Singleton instance
let authAPI: AuthAPI | null = null;

export function getAuthAPI(): AuthAPI {
  if (!authAPI) {
    authAPI = new AuthAPI();
  }
  return authAPI;
}
