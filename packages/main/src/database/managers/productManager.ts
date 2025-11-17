import type { Product, NewProduct, StockAdjustment } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export interface ProductResponse {
  success: boolean;
  message: string;
  product?: Product;
  products?: Product[];
  errors?: string[];
}

export class ProductManager {
  private drizzle: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.drizzle = drizzle;
    this.uuid = uuid;
  }

  async createProduct(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> {
    const productId = this.uuid.v4();

    // Validate required fields
    if (!productData.categoryId || productData.categoryId.trim() === "") {
      throw new Error("Category is required and cannot be empty");
    }

    await this.drizzle.insert(schema.products).values({
      id: productId,
      name: productData.name,
      description: productData.description ?? null,
      basePrice: productData.basePrice,
      costPrice: productData.costPrice ?? 0,
      sku: productData.sku,
      barcode: productData.barcode ?? null,
      plu: productData.plu ?? null,
      image: productData.image ?? null,
      categoryId: productData.categoryId ?? null,
      productType: productData.productType ?? "STANDARD",
      salesUnit: productData.salesUnit ?? "PIECE",
      usesScale: productData.usesScale ?? false,
      pricePerKg: productData.pricePerKg ?? null,
      isGenericButton: productData.isGenericButton ?? false,
      genericDefaultPrice: productData.genericDefaultPrice ?? null,
      trackInventory: productData.trackInventory ?? true,
      stockLevel: productData.stockLevel ?? 0,
      minStockLevel: productData.minStockLevel ?? 0,
      reorderPoint: productData.reorderPoint ?? 0,
      vatCategoryId: productData.vatCategoryId ?? null,
      vatOverridePercent: productData.vatOverridePercent ?? null,
      businessId: productData.businessId,
      isActive: productData.isActive ?? true,
      allowPriceOverride: productData.allowPriceOverride ?? false,
      allowDiscount: productData.allowDiscount ?? true,
    });

    return this.getProductById(productId);
  }

  async getProductById(id: string): Promise<Product> {
    const [product] = await this.drizzle
      .select()
      .from(schema.products)
      .where(
        and(eq(schema.products.id, id), eq(schema.products.isActive, true))
      )
      .limit(1);

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }

  async getProductByPLU(plu: string): Promise<Product> {
    const [product] = await this.drizzle
      .select()
      .from(schema.products)
      .where(
        and(eq(schema.products.plu, plu), eq(schema.products.isActive, true))
      )
      .limit(1);

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }

  async getProductBySKU(sku: string): Promise<Product | null> {
    const [product] = await this.drizzle
      .select()
      .from(schema.products)
      .where(
        and(eq(schema.products.sku, sku), eq(schema.products.isActive, true))
      )
      .limit(1);

    if (!product) {
      return null;
    }

    return product;
  }

  async getProductsByBusiness(businessId: string): Promise<Product[]> {
    const products = await this.drizzle
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.businessId, businessId),
          eq(schema.products.isActive, true)
        )
      )
      .orderBy(schema.products.name);

    return products;
  }

  async updateProduct(
    id: string,
    updates: Partial<Omit<Product, "id" | "createdAt" | "modifiers">>
  ): Promise<Product> {
    if (Object.keys(updates).length === 0) {
      return this.getProductById(id);
    }

    // First check if product exists
    try {
      await this.getProductById(id);
    } catch (error) {
      throw new Error("Product not found");
    }

    // updatedAt will be handled by $onUpdate in schema
    await this.drizzle
      .update(schema.products)
      .set(updates)
      .where(eq(schema.products.id, id));

    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const now = new Date();

    const result = await this.drizzle
      .update(schema.products)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(
        and(eq(schema.products.id, id), eq(schema.products.isActive, true))
      );

    return result.changes > 0;
  }

  /**
   * Search products by name or SKU (type-safe)
   */
  async searchProducts(
    businessId: string,
    searchTerm: string
  ): Promise<Product[]> {
    const searchPattern = `%${searchTerm}%`;

    const products = await this.drizzle
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.businessId, businessId),
          eq(schema.products.isActive, true),
          drizzleSql`(
            ${schema.products.name} LIKE ${searchPattern} OR 
            ${schema.products.sku} LIKE ${searchPattern}
          )`
        )
      )
      .orderBy(schema.products.name);

    return products;
  }

  /**
   * Get products with category details using JOIN (type-safe)
   */
  async getProductsWithCategory(businessId: string) {
    const products = await this.drizzle
      .select({
        product: schema.products,
        category: schema.categories,
      })
      .from(schema.products)
      .leftJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id)
      )
      .where(
        and(
          eq(schema.products.businessId, businessId),
          eq(schema.products.isActive, true)
        )
      )
      .orderBy(schema.products.name);

    return products;
  }

  /**
   * Get low stock products (type-safe)
   */
  async getLowStockProducts(
    businessId: string,
    threshold: number = 10
  ): Promise<Product[]> {
    const products = await this.drizzle
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.businessId, businessId),
          eq(schema.products.isActive, true),
          drizzleSql`${schema.products.stockLevel} <= ${threshold}`
        )
      )
      .orderBy(schema.products.stockLevel);

    return products;
  }

  // Business Logic Methods (with validation and response wrapping)

  async createProductWithValidation(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<ProductResponse> {
    try {
      // Validate weight-based product data
      if (productData.usesScale) {
        if (!productData.pricePerKg || productData.pricePerKg <= 0) {
          return {
            success: false,
            message: "Weight-based products must have a valid price per kg",
          };
        }
      }

      // Check if SKU already exists
      try {
        const existingProduct = await this.getProductBySKU(productData.sku);
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
          const existingProductByPLU = await this.getProductByPLU(
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

      // Create the product
      const product = await this.createProduct(productData);

      // Fetch the complete product
      const completeProduct = await this.getProductById(product.id);

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

  async getProductsByBusinessWithResponse(
    businessId: string
  ): Promise<ProductResponse> {
    try {
      const products = await this.getProductsByBusiness(businessId);

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

  async getProductByIdWithResponse(id: string): Promise<ProductResponse> {
    try {
      const product = await this.getProductById(id);

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

  async updateProductWithValidation(
    id: string,
    updates: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>
  ): Promise<ProductResponse> {
    try {
      // If updating SKU, check it doesn't already exist
      if (updates.sku) {
        try {
          const existingProduct = await this.getProductBySKU(updates.sku);
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
          const existingProductByPLU = await this.getProductByPLU(updates.plu);
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

      // Update the product
      const product = await this.updateProduct(id, updates);

      // Fetch the complete updated product
      const updatedProduct = await this.getProductById(id);

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

  async deleteProductWithResponse(id: string): Promise<ProductResponse> {
    try {
      await this.deleteProduct(id);

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
}
