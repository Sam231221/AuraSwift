import {
  getDatabase,
  type User,
  type Business,
  type Product,
  type Modifier,
  type StockAdjustment,
} from "./database/index.js";
import {
  registerSchema,
  loginSchema,
  pinLoginSchema,
  updateUserSchema,
  createStaffUserSchema,
  sessionTokenSchema,
  userIdSchema,
  validateInput,
  type RegisterInput,
  type LoginInput,
  type PinLoginInput,
  type UpdateUserInput,
} from "./database/validation/authSchemas.js";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: "cashier" | "manager" | "admin";
}

export interface LoginRequest {
  email?: string;
  password?: string;
  username?: string;
  pin?: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  users?: User[];
  token?: string;
  errors?: string[];
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
      const db = await this.getDb();

      // Check if user already exists
      const existingUser = db.users.getUserByEmail(validatedData.email);
      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists",
        };
      }

      // Create user with validated data
      const user = await db.users.createUser(validatedData);

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
      const db = await this.getDb();
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
        user = await db.users.authenticateUserByUsernamePin(
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
        user = await db.users.authenticateUser(data.email, data.password);

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
      const session = db.sessions.createSession(
        user.id,
        rememberMe ? 30 : 0.5 // 30 days or 12 hours
      );

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
      const session = db.sessions.getSessionByToken(token);
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

  async logout(token: string): Promise<AuthResponse> {
    try {
      const db = await this.getDb();
      const deleted = db.sessions.deleteSession(token);
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
    db.sessions.cleanupExpiredSessions();
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
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "cashier" | "manager";
    avatar?: string;
  }): Promise<AuthResponse> {
    try {
      const db = await this.getDb();

      // Create user with business name from business ID
      const business = db.businesses.getBusinessById(userData.businessId);
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
}

// Singleton instance
let authAPI: AuthAPI | null = null;

export function getAuthAPI(): AuthAPI {
  if (!authAPI) {
    authAPI = new AuthAPI();
  }
  return authAPI;
}
