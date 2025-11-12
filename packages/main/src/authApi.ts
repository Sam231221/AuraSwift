import {
  getDatabase,
  type User,
  type Business,
  type Product,
  type Modifier,
  type StockAdjustment,
} from "./database/index.js";
import {
  validatePassword,
  validateEmail,
  validateName,
  validateBusinessName,
} from "./passwordUtils.js";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: "cashier" | "manager" | "admin";
}

export interface LoginRequest {
  username: string;
  pin: string;
  rememberMe?: boolean;
  terminalId?: string;
  locationId?: string;
  ipAddress?: string;
  autoClockIn?: boolean; // Whether to automatically clock in on login
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  users?: User[];
  token?: string;
  errors?: string[];
  clockEvent?: any; // Clock-in/out event if applicable
  shift?: any; // Active shift if applicable
  requiresClockIn?: boolean; // Whether user needs to manually clock in
}
export interface CreateProductRequest {
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
  modifiers?: Modifier[];
  // Weight-based product fields
  requiresWeight?: boolean;
  unit?: "lb" | "kg" | "oz" | "g" | "each";
  pricePerUnit?: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface CreateModifierRequest {
  name: string;
  type: "single" | "multiple";
  required: boolean;
  businessId: string;
  options: { name: string; price: number }[];
}

export interface StockAdjustmentRequest {
  productId: string;
  type: "add" | "remove" | "sale" | "waste" | "adjustment";
  quantity: number;
  reason: string;
  userId: string;
  businessId: string;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  product?: Product;
  products?: Product[];
  modifier?: Modifier;
  modifiers?: Modifier[];
  adjustment?: StockAdjustment;
  adjustments?: StockAdjustment[];
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
      const existingUser = db.users.getUserByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists",
        };
      }

      // Create user
      const user = await db.users.createUser(data);

      // Create session using the correct userId
      const session = db.sessions.createSession(user.id);

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

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Validate input
      if (!data.username || data.username.trim().length < 1) {
        return {
          success: false,
          message: "Username is required",
        };
      }

      if (!data.pin || data.pin.length < 1) {
        return {
          success: false,
          message: "PIN is required",
        };
      }

      const db = await this.getDb();

      // Authenticate user
      const user = await db.users.authenticateUserByUsernamePin(
        data.username,
        data.pin
      );
      if (!user) {
        return {
          success: false,
          message: "Invalid username or PIN",
        };
      }

      // Create session with custom expiry if rememberMe is set
      let session;
      if (data.rememberMe) {
        session = db.sessions.createSession(user.id, 30); // 30 days
      } else {
        session = db.sessions.createSession(user.id, 0.5); // 12 hours
      }

      // Log session creation in audit
      await db.audit.logSessionAction(
        "login",
        session,
        user.id,
        data.terminalId || "unknown",
        data.ipAddress
      );

      // Check for existing active shift
      const activeShift = db.timeTracking.getActiveShift(user.id);

      let clockEvent = null;
      let shift = null;

      // Auto clock-in logic for cashiers and managers
      if (
        !activeShift &&
        (user.role === "cashier" || user.role === "manager")
      ) {
        if (data.autoClockIn !== false) {
          // Auto clock-in by default for non-admin users
          try {
            clockEvent = await db.timeTracking.createClockEvent({
              userId: user.id,
              terminalId: data.terminalId || "unknown",
              locationId: data.locationId,
              type: "in",
              method: "login",
              ipAddress: data.ipAddress,
            });

            // Validate the clock event
            const validation = await db.timeTracking.validateClockEvent(
              clockEvent
            );
            if (!validation.valid) {
              console.warn("Clock-in validation warnings:", validation);
              await db.audit.logClockEvent(
                "clock_in",
                clockEvent,
                user.id,
                data.terminalId,
                data.ipAddress,
                { validation }
              );
            } else {
              await db.audit.logClockEvent(
                "clock_in",
                clockEvent,
                user.id,
                data.terminalId,
                data.ipAddress
              );
            }

            // Create shift
            shift = await db.timeTracking.createShift({
              userId: user.id,
              businessId: user.businessId,
              clockInId: clockEvent.id,
            });

            await db.audit.logShiftAction(
              "shift_started",
              shift,
              user.id,
              data.terminalId,
              data.ipAddress
            );
          } catch (clockError) {
            console.error("Auto clock-in error:", clockError);
            // Don't fail login if clock-in fails
          }
        }
      }

      return {
        success: true,
        message: "Login successful",
        user,
        token: session.token,
        clockEvent: clockEvent || undefined,
        shift: shift || activeShift || undefined,
        requiresClockIn: !clockEvent && !activeShift && user.role !== "admin",
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

      const user = db.users.getUserById(session.userId);
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

  async logout(
    token: string,
    options?: {
      terminalId?: string;
      ipAddress?: string;
      autoClockOut?: boolean;
    }
  ): Promise<AuthResponse> {
    try {
      const db = await this.getDb();

      // Get session to find user
      const session = db.getSessionByToken(token);
      if (!session) {
        return {
          success: false,
          message: "Session not found",
        };
      }

      const user = db.users.getUserById(session.userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Check for active shift and auto clock-out
      let clockEvent = null;
      let shift = null;
      const activeShift = db.timeTracking.getActiveShift(user.id);

      if (activeShift && options?.autoClockOut !== false) {
        try {
          // Auto clock-out on logout
          clockEvent = await db.timeTracking.createClockEvent({
            userId: user.id,
            terminalId: options?.terminalId || "unknown",
            type: "out",
            method: "logout",
            ipAddress: options?.ipAddress,
          });

          await db.audit.logClockEvent(
            "clock_out",
            clockEvent,
            user.id,
            options?.terminalId,
            options?.ipAddress
          );

          // Complete the shift
          shift = await db.timeTracking.completeShift(
            activeShift.id,
            clockEvent.id
          );

          await db.audit.logShiftAction(
            "shift_completed",
            shift,
            user.id,
            options?.terminalId,
            options?.ipAddress
          );
        } catch (clockError) {
          console.error("Auto clock-out error:", clockError);
          // Don't fail logout if clock-out fails
        }
      }

      // Log session termination
      await db.audit.logSessionAction(
        "logout",
        session,
        user.id,
        options?.terminalId || "unknown",
        options?.ipAddress
      );

      // Delete session
      const deleted = db.sessions.deleteSession(token);

      return {
        success: deleted,
        message: deleted ? "Logged out successfully" : "Logout failed",
        clockEvent: clockEvent || undefined,
        shift: shift || undefined,
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
      const user = db.users.getUserById(userId);
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
      const success = db.users.updateUser(userId, updates);
      if (!success) {
        return {
          success: false,
          message: "User not found or update failed",
        };
      }

      const user = db.users.getUserById(userId);
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

  async deleteUser(userId: string): Promise<AuthResponse> {
    try {
      const db = await this.getDb();

      // Check if user exists first
      const user = db.users.getUserById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const success = db.users.deleteUser(userId);
      if (!success) {
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

  // Cleanup expired sessions (call this periodically)
  async cleanupExpiredSessions(): Promise<void> {
    const db = await this.getDb();
    db.cleanupExpiredSessions();
  }

  // Product Management Methods

  /**
   * Create a new product
   */
  async createProduct(
    productData: CreateProductRequest
  ): Promise<ProductResponse> {
    try {
      const db = await this.getDb();

      // Validate weight-based product data
      if (productData.requiresWeight) {
        if (!productData.unit || productData.unit === "each") {
          return {
            success: false,
            message:
              "Weight-based products must have a valid unit (lb, kg, oz, g)",
          };
        }

        if (!productData.pricePerUnit || productData.pricePerUnit <= 0) {
          return {
            success: false,
            message: "Weight-based products must have a valid price per unit",
          };
        }

        // Set the display price to pricePerUnit for consistency
        productData.price = productData.pricePerUnit;
      }

      // Check if SKU already exists
      try {
        const existingProduct = db.products.getProductById(productData.sku);
        if (existingProduct) {
          return {
            success: false,
            message: "A product with this SKU already exists",
          };
        }
      } catch (error) {
        // SKU doesn't exist, which is good
      }

      // Check if PLU already exists (if PLU is provided)
      if (productData.plu) {
        try {
          const existingProductByPLU = db.products.getProductByPLU(
            productData.plu
          );
          if (existingProductByPLU) {
            return {
              success: false,
              message: "A product with this PLU already exists",
            };
          }
        } catch (error) {
          // PLU doesn't exist, which is good
        }
      }

      // Extract modifiers from product data
      const { modifiers, ...productDataWithoutModifiers } = productData;

      // Create the product first
      const product = await db.products.createProduct({
        ...productDataWithoutModifiers,
        isActive: true,
      });

      // Handle modifiers if provided
      if (modifiers && modifiers.length > 0) {
        for (const modifier of modifiers) {
          try {
            // Create the modifier
            const createdModifier = await db.products.createModifier({
              name: modifier.name,
              type: modifier.type,
              required: modifier.required,
              businessId: productData.businessId,
            });

            // Add modifier options
            if (modifier.options && modifier.options.length > 0) {
              for (const option of modifier.options) {
                if (option.name.trim()) {
                  const createdOption = await db.products.createModifierOption(
                    createdModifier.id,
                    {
                      name: option.name,
                      price: option.price || 0,
                    }
                  );
                }
              }
            }

            // Link modifier to product

            db.addModifierToProduct(product.id, createdModifier.id);
          } catch (modifierError: any) {
            console.error("Error creating modifier:", modifierError);
            console.error("Modifier data that failed:", modifier);
            // Continue with other modifiers even if one fails
          }
        }
      }

      // Fetch the complete product with modifiers
      const completeProduct = db.products.getProductById(product.id);

      return {
        success: true,
        message: "Product created successfully",
        product: completeProduct,
      };
    } catch (error: any) {
      console.error("Product creation error:", error);
      return {
        success: false,
        message: error.message || "Failed to create product",
      };
    }
  }

  /**
   * Get all products for a business
   */
  async getProductsByBusiness(businessId: string): Promise<ProductResponse> {
    try {
      const db = await this.getDb();
      const products = db.products.getProductsByBusiness(businessId);

      return {
        success: true,
        message: "Products retrieved successfully",
        products,
      };
    } catch (error: any) {
      console.error("Get products error:", error);
      return {
        success: false,
        message: error.message || "Failed to get products",
      };
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductResponse> {
    try {
      const db = await this.getDb();
      const product = db.products.getProductById(id);

      return {
        success: true,
        message: "Product retrieved successfully",
        product,
      };
    } catch (error: any) {
      console.error("Get product error:", error);
      return {
        success: false,
        message: error.message || "Product not found",
      };
    }
  }

  /**
   * Update product
   */
  async updateProduct(
    id: string,
    updates: Partial<CreateProductRequest>
  ): Promise<ProductResponse> {
    try {
      const db = await this.getDb();

      // If updating SKU, check it doesn't already exist
      if (updates.sku) {
        try {
          const existingProduct = db.products.getProductById(updates.sku);
          if (existingProduct && existingProduct.id !== id) {
            return {
              success: false,
              message: "A product with this SKU already exists",
            };
          }
        } catch (error) {
          // SKU doesn't exist, which is good
        }
      }

      // If updating PLU, check it doesn't already exist
      if (updates.plu) {
        try {
          const existingProductByPLU = db.products.getProductByPLU(updates.plu);
          if (existingProductByPLU && existingProductByPLU.id !== id) {
            return {
              success: false,
              message: "A product with this PLU already exists",
            };
          }
        } catch (error) {
          // PLU doesn't exist, which is good
        }
      }

      // Extract modifiers from updates
      const { modifiers, ...updatesWithoutModifiers } = updates;

      // Update the product first
      const product = await db.products.updateProduct(
        id,
        updatesWithoutModifiers
      );

      // Handle modifiers if provided
      if (modifiers !== undefined) {
        // Get current product modifiers
        const currentModifiers = db.products.getProductModifiers(id);

        // Remove all existing modifiers for this product
        for (const modifier of currentModifiers) {
          db.products.removeModifierFromProduct(id, modifier.id);
        }

        // Add new modifiers
        if (modifiers && modifiers.length > 0) {
          for (const modifier of modifiers) {
            try {
              // Create the modifier
              const createdModifier = await db.products.createModifier({
                name: modifier.name,
                type: modifier.type,
                required: modifier.required,
                businessId: product.businessId,
              });

              // Add modifier options
              if (modifier.options && modifier.options.length > 0) {
                for (const option of modifier.options) {
                  if (option.name.trim()) {
                    await db.products.createModifierOption(createdModifier.id, {
                      name: option.name,
                      price: option.price || 0,
                    });
                  }
                }
              }

              // Link modifier to product
              db.addModifierToProduct(id, createdModifier.id);
            } catch (modifierError: any) {
              console.error("Error updating modifier:", modifierError);
              // Continue with other modifiers even if one fails
            }
          }
        }
      }

      // Fetch the complete updated product with modifiers
      const updatedProduct = db.products.getProductById(id);

      return {
        success: true,
        message: "Product updated successfully",
        product: updatedProduct,
      };
    } catch (error: any) {
      console.error("Product update error:", error);
      return {
        success: false,
        message: error.message || "Failed to update product",
      };
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<ProductResponse> {
    try {
      const db = await this.getDb();
      const deleted = db.products.deleteProduct(id);

      if (!deleted) {
        return {
          success: false,
          message: "Product not found",
        };
      }

      return {
        success: true,
        message: "Product deleted successfully",
      };
    } catch (error: any) {
      console.error("Product deletion error:", error);
      return {
        success: false,
        message: error.message || "Failed to delete product",
      };
    }
  }

  // Category Management Methods

  /**
   * Create a new category
   */
  async createCategory(categoryData: any): Promise<any> {
    try {
      const db = await this.getDb();
      const category = await db.categories.createCategory(categoryData);

      return {
        success: true,
        message: "Category created successfully",
        category,
      };
    } catch (error: any) {
      console.error("Category creation error:", error);
      return {
        success: false,
        message: error.message || "Failed to create category",
      };
    }
  }

  /**
   * Get categories by business ID
   */
  async getCategoriesByBusiness(businessId: string): Promise<any> {
    try {
      const db = await this.getDb();
      const categories = await db.categories.getCategoriesByBusiness(
        businessId
      );

      return {
        success: true,
        categories,
      };
    } catch (error: any) {
      console.error("Get categories error:", error);
      return {
        success: false,
        message: error.message || "Failed to get categories",
      };
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<any> {
    try {
      const db = await this.getDb();
      const category = await db.getCategoryById(id);

      if (!category) {
        return {
          success: false,
          message: "Category not found",
        };
      }

      return {
        success: true,
        category,
      };
    } catch (error: any) {
      console.error("Get category error:", error);
      return {
        success: false,
        message: error.message || "Failed to get category",
      };
    }
  }

  /**
   * Update category
   */
  async updateCategory(id: string, updates: any): Promise<any> {
    try {
      const db = await this.getDb();
      const category = await db.categories.updateCategory(id, updates);

      if (!category) {
        return {
          success: false,
          message: "Category not found",
        };
      }

      return {
        success: true,
        message: "Category updated successfully",
        category,
      };
    } catch (error: any) {
      console.error("Update category error:", error);
      return {
        success: false,
        message: error.message || "Failed to update category",
      };
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<any> {
    try {
      const db = await this.getDb();
      const deleted = await db.categories.deleteCategory(id);

      if (!deleted) {
        return {
          success: false,
          message: "Category not found",
        };
      }

      return {
        success: true,
        message: "Category deleted successfully",
      };
    } catch (error: any) {
      console.error("Delete category error:", error);
      return {
        success: false,
        message: error.message || "Failed to delete category",
      };
    }
  }

  /**
   * Reorder categories
   */
  async reorderCategories(
    businessId: string,
    categoryIds: string[]
  ): Promise<any> {
    try {
      const db = await this.getDb();
      await db.reorderCategories(businessId, categoryIds);

      return {
        success: true,
        message: "Categories reordered successfully",
      };
    } catch (error: any) {
      console.error("Reorder categories error:", error);
      return {
        success: false,
        message: error.message || "Failed to reorder categories",
      };
    }
  }

  /**
   * Create modifier with options
   */
  async createModifier(
    modifierData: CreateModifierRequest
  ): Promise<ProductResponse> {
    try {
      const db = await this.getDb();

      const modifier = await db.products.createModifier({
        name: modifierData.name,
        type: modifierData.type,
        required: modifierData.required,
        businessId: modifierData.businessId,
      });

      // Add options
      for (const option of modifierData.options) {
        db.products.createModifierOption(modifier.id, {
          name: option.name,
          price: option.price,
        });
      }

      // Get the complete modifier with options
      const completeModifier = db.getModifierById(modifier.id);

      return {
        success: true,
        message: "Modifier created successfully",
        modifier: completeModifier,
      };
    } catch (error: any) {
      console.error("Modifier creation error:", error);
      return {
        success: false,
        message: error.message || "Failed to create modifier",
      };
    }
  }

  /**
   * Create stock adjustment
   */
  async createStockAdjustment(
    adjustmentData: StockAdjustmentRequest
  ): Promise<ProductResponse> {
    try {
      const db = await this.getDb();

      const adjustment = db.createStockAdjustment(adjustmentData);

      return {
        success: true,
        message: "Stock adjustment created successfully",
        adjustment,
      };
    } catch (error: any) {
      console.error("Stock adjustment error:", error);
      return {
        success: false,
        message: error.message || "Failed to create stock adjustment",
      };
    }
  }

  /**
   * Get stock adjustments for a product
   */
  async getStockAdjustments(productId: string): Promise<ProductResponse> {
    try {
      const db = await this.getDb();
      const adjustments = db.getStockAdjustments(productId);

      return {
        success: true,
        message: "Stock adjustments retrieved successfully",
        adjustments,
      };
    } catch (error: any) {
      console.error("Get stock adjustments error:", error);
      return {
        success: false,
        message: error.message || "Failed to get stock adjustments",
      };
    }
  }

  // User management methods
  async getAllActiveUsers(): Promise<AuthResponse> {
    try {
      const db = await this.getDb();
      // Get all active users from all businesses for login screen
      const allUsers = db.users.getAllActiveUsers();

      return {
        success: true,
        message: "Users retrieved successfully",
        users: allUsers,
      };
    } catch (error: any) {
      console.error("Get all active users error:", error);
      return {
        success: false,
        message: error.message || "Failed to get users",
      };
    }
  }

  async getUsersByBusiness(businessId: string): Promise<AuthResponse> {
    try {
      const db = await this.getDb();
      const users = db.users.getUsersByBusiness(businessId);

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

  async createUser(userData: {
    businessId: string;
    username: string;
    pin: string;
    email?: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: "cashier" | "manager";
    avatar?: string;
  }): Promise<AuthResponse> {
    try {
      const db = await this.getDb();

      // Create user with business name from business ID
      const business = db.getBusinessById(userData.businessId);
      if (!business) {
        return {
          success: false,
          message: "Business not found",
        };
      }

      const user = await db.users.createUser({
        ...userData,
        businessName: business.name,
      });

      return {
        success: true,
        message: "User created successfully",
        user,
      };
    } catch (error: any) {
      console.error("Create user error:", error);
      return {
        success: false,
        message: error.message || "Failed to create user",
      };
    }
  }

  // ============= Time Tracking Methods =============

  /**
   * Manual clock-in (when not done automatically on login)
   */
  async clockIn(data: {
    userId: string;
    terminalId: string;
    locationId?: string;
    ipAddress?: string;
  }): Promise<any> {
    try {
      const db = await this.getDb();

      // Check for existing active shift
      const activeShift = db.timeTracking.getActiveShift(data.userId);
      if (activeShift) {
        return {
          success: false,
          message: "User already has an active shift",
          shift: activeShift,
        };
      }

      const user = db.users.getUserById(data.userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Create clock-in event
      const clockEvent = await db.timeTracking.createClockEvent({
        userId: data.userId,
        terminalId: data.terminalId,
        locationId: data.locationId,
        type: "in",
        method: "manual",
        ipAddress: data.ipAddress,
      });

      // Validate clock event
      const validation = await db.timeTracking.validateClockEvent(clockEvent);

      // Log audit
      await db.audit.logClockEvent(
        "clock_in",
        clockEvent,
        data.userId,
        data.terminalId,
        data.ipAddress,
        { validation }
      );

      // Create shift
      const shift = await db.timeTracking.createShift({
        userId: data.userId,
        businessId: user.businessId,
        clockInId: clockEvent.id,
      });

      await db.audit.logShiftAction(
        "shift_started",
        shift,
        data.userId,
        data.terminalId,
        data.ipAddress
      );

      return {
        success: true,
        message: validation.valid
          ? "Clocked in successfully"
          : "Clocked in with warnings",
        clockEvent,
        shift,
        validation,
      };
    } catch (error: any) {
      console.error("Clock-in error:", error);
      return {
        success: false,
        message: error.message || "Failed to clock in",
      };
    }
  }

  /**
   * Manual clock-out (when not done automatically on logout)
   */
  async clockOut(data: {
    userId: string;
    terminalId: string;
    ipAddress?: string;
  }): Promise<any> {
    try {
      const db = await this.getDb();

      // Check for active shift
      const activeShift = db.timeTracking.getActiveShift(data.userId);
      if (!activeShift) {
        return {
          success: false,
          message: "No active shift found",
        };
      }

      // Create clock-out event
      const clockEvent = await db.timeTracking.createClockEvent({
        userId: data.userId,
        terminalId: data.terminalId,
        type: "out",
        method: "manual",
        ipAddress: data.ipAddress,
      });

      await db.audit.logClockEvent(
        "clock_out",
        clockEvent,
        data.userId,
        data.terminalId,
        data.ipAddress
      );

      // Complete shift
      const shift = await db.timeTracking.completeShift(
        activeShift.id,
        clockEvent.id
      );

      await db.audit.logShiftAction(
        "shift_completed",
        shift,
        data.userId,
        data.terminalId,
        data.ipAddress
      );

      return {
        success: true,
        message: "Clocked out successfully",
        clockEvent,
        shift,
      };
    } catch (error: any) {
      console.error("Clock-out error:", error);
      return {
        success: false,
        message: error.message || "Failed to clock out",
      };
    }
  }

  /**
   * Start a break
   */
  async startBreak(data: {
    userId: string;
    shiftId: string;
    type?: "meal" | "rest" | "other";
    isPaid?: boolean;
    terminalId?: string;
    ipAddress?: string;
  }): Promise<any> {
    try {
      const db = await this.getDb();

      const breakRecord = await db.timeTracking.startBreak({
        shiftId: data.shiftId,
        userId: data.userId,
        type: data.type,
        isPaid: data.isPaid,
      });

      await db.audit.logBreakAction(
        "break_started",
        breakRecord,
        data.userId,
        data.terminalId,
        data.ipAddress
      );

      return {
        success: true,
        message: "Break started successfully",
        break: breakRecord,
      };
    } catch (error: any) {
      console.error("Start break error:", error);
      return {
        success: false,
        message: error.message || "Failed to start break",
      };
    }
  }

  /**
   * End a break
   */
  async endBreak(data: {
    breakId: string;
    userId: string;
    terminalId?: string;
    ipAddress?: string;
  }): Promise<any> {
    try {
      const db = await this.getDb();

      const breakRecord = await db.timeTracking.endBreak(data.breakId);

      await db.audit.logBreakAction(
        "break_ended",
        breakRecord,
        data.userId,
        data.terminalId,
        data.ipAddress
      );

      return {
        success: true,
        message: "Break ended successfully",
        break: breakRecord,
      };
    } catch (error: any) {
      console.error("End break error:", error);
      return {
        success: false,
        message: error.message || "Failed to end break",
      };
    }
  }

  /**
   * Get active shift for user
   */
  async getActiveShift(userId: string): Promise<any> {
    try {
      const db = await this.getDb();
      const shift = db.timeTracking.getActiveShift(userId);

      if (!shift) {
        return {
          success: false,
          message: "No active shift found",
        };
      }

      // Get clock-in event
      const clockIn = db.timeTracking.getClockEventById(shift.clockInId);

      // Get breaks
      const breaks = db.timeTracking.getBreaksByShift(shift.id);

      return {
        success: true,
        message: "Active shift retrieved",
        shift,
        clockIn,
        breaks,
      };
    } catch (error: any) {
      console.error("Get active shift error:", error);
      return {
        success: false,
        message: error.message || "Failed to get active shift",
      };
    }
  }

  /**
   * Get shift history for user
   */
  async getShiftHistory(userId: string, limit: number = 50): Promise<any> {
    try {
      const db = await this.getDb();
      const shifts = db.timeTracking.getShiftsByUser(userId, limit);

      return {
        success: true,
        message: "Shift history retrieved",
        shifts,
      };
    } catch (error: any) {
      console.error("Get shift history error:", error);
      return {
        success: false,
        message: error.message || "Failed to get shift history",
      };
    }
  }

  /**
   * Request time correction
   */
  async requestTimeCorrection(data: {
    userId: string;
    clockEventId?: string;
    shiftId?: string;
    correctionType: "clock_time" | "break_time" | "manual_entry";
    originalTime?: string;
    correctedTime: string;
    reason: string;
    requestedBy: string;
    terminalId?: string;
    ipAddress?: string;
  }): Promise<any> {
    try {
      const db = await this.getDb();

      const correction = await db.timeTracking.requestTimeCorrection({
        userId: data.userId,
        clockEventId: data.clockEventId,
        shiftId: data.shiftId,
        correctionType: data.correctionType,
        originalTime: data.originalTime,
        correctedTime: data.correctedTime,
        reason: data.reason,
        requestedBy: data.requestedBy,
      });

      await db.audit.logTimeCorrectionAction(
        "time_correction_requested",
        correction,
        data.requestedBy,
        data.terminalId,
        data.ipAddress
      );

      return {
        success: true,
        message: "Time correction requested successfully",
        correction,
      };
    } catch (error: any) {
      console.error("Request time correction error:", error);
      return {
        success: false,
        message: error.message || "Failed to request time correction",
      };
    }
  }

  /**
   * Approve or reject time correction (manager only)
   */
  async processTimeCorrection(data: {
    correctionId: string;
    approvedBy: string;
    approved: boolean;
    terminalId?: string;
    ipAddress?: string;
  }): Promise<any> {
    try {
      const db = await this.getDb();

      // Check if approver is manager or admin
      const approver = db.users.getUserById(data.approvedBy);
      if (
        !approver ||
        (approver.role !== "manager" && approver.role !== "admin")
      ) {
        return {
          success: false,
          message: "Only managers and admins can approve time corrections",
        };
      }

      const correction = await db.timeTracking.processTimeCorrection(
        data.correctionId,
        data.approvedBy,
        data.approved
      );

      await db.audit.logTimeCorrectionAction(
        data.approved ? "time_correction_approved" : "time_correction_rejected",
        correction,
        data.approvedBy,
        data.terminalId,
        data.ipAddress
      );

      return {
        success: true,
        message: data.approved
          ? "Time correction approved successfully"
          : "Time correction rejected",
        correction,
      };
    } catch (error: any) {
      console.error("Process time correction error:", error);
      return {
        success: false,
        message: error.message || "Failed to process time correction",
      };
    }
  }

  /**
   * Get pending time corrections for business (manager view)
   */
  async getPendingTimeCorrections(businessId: string): Promise<any> {
    try {
      const db = await this.getDb();
      const corrections = db.timeTracking.getPendingTimeCorrections(businessId);

      return {
        success: true,
        message: "Pending time corrections retrieved",
        corrections,
      };
    } catch (error: any) {
      console.error("Get pending time corrections error:", error);
      return {
        success: false,
        message: error.message || "Failed to get pending time corrections",
      };
    }
  }

  /**
   * Force clock-out by manager
   */
  async forceClockOut(data: {
    userId: string;
    managerId: string;
    reason: string;
    terminalId?: string;
    ipAddress?: string;
  }): Promise<any> {
    try {
      const db = await this.getDb();

      // Check if requester is manager or admin
      const manager = db.users.getUserById(data.managerId);
      if (
        !manager ||
        (manager.role !== "manager" && manager.role !== "admin")
      ) {
        return {
          success: false,
          message: "Only managers and admins can force clock-out",
        };
      }

      const result = await db.timeTracking.forceClockOut(
        data.userId,
        data.managerId,
        data.reason
      );

      await db.audit.logShiftAction(
        "shift_forced_end",
        result.shift,
        data.managerId,
        data.terminalId,
        data.ipAddress,
        { reason: data.reason, forcedUserId: data.userId }
      );

      return {
        success: true,
        message: "User clocked out successfully",
        clockEvent: result.clockEvent,
        shift: result.shift,
      };
    } catch (error: any) {
      console.error("Force clock-out error:", error);
      return {
        success: false,
        message: error.message || "Failed to force clock-out",
      };
    }
  }

  /**
   * Get attendance report for date range
   */
  async getAttendanceReport(data: {
    businessId: string;
    startDate: string;
    endDate: string;
    userId?: string;
  }): Promise<any> {
    try {
      const db = await this.getDb();

      const shifts = db.timeTracking.getShiftsByBusinessAndDateRange(
        data.businessId,
        data.startDate,
        data.endDate
      );

      // Filter by user if specified
      const filteredShifts = data.userId
        ? shifts.filter((s: any) => s.userId === data.userId)
        : shifts;

      // Calculate statistics
      const totalShifts = filteredShifts.length;
      const totalHours = filteredShifts.reduce(
        (sum: number, s: any) => sum + (s.totalHours || 0),
        0
      );
      const regularHours = filteredShifts.reduce(
        (sum: number, s: any) => sum + (s.regularHours || 0),
        0
      );
      const overtimeHours = filteredShifts.reduce(
        (sum: number, s: any) => sum + (s.overtimeHours || 0),
        0
      );

      return {
        success: true,
        message: "Attendance report generated",
        report: {
          startDate: data.startDate,
          endDate: data.endDate,
          totalShifts,
          totalHours,
          regularHours,
          overtimeHours,
          averageHoursPerShift: totalShifts > 0 ? totalHours / totalShifts : 0,
          shifts: filteredShifts,
        },
      };
    } catch (error: any) {
      console.error("Get attendance report error:", error);
      return {
        success: false,
        message: error.message || "Failed to generate attendance report",
      };
    }
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
