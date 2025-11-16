import type { Product, NewProduct } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

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

  // Stub modifier functions - modifiers table doesn't exist in schema
  async createModifier(modifierData: any): Promise<any> {
    throw new Error(
      "Modifiers feature not implemented - table does not exist in schema"
    );
  }

  async getModifierById(id: string): Promise<any> {
    throw new Error(
      "Modifiers feature not implemented - table does not exist in schema"
    );
  }

  async createModifierOption(
    modifierId: string,
    optionData: any
  ): Promise<any> {
    throw new Error(
      "Modifiers feature not implemented - table does not exist in schema"
    );
  }

  async getProductModifiers(productId: string): Promise<any[]> {
    // Return empty array since modifiers table doesn't exist
    return [];
  }

  async addModifierToProduct(
    productId: string,
    modifierId: string
  ): Promise<void> {
    throw new Error(
      "Modifiers feature not implemented - table does not exist in schema"
    );
  }

  async removeModifierFromProduct(
    productId: string,
    modifierId: string
  ): Promise<void> {
    throw new Error(
      "Modifiers feature not implemented - table does not exist in schema"
    );
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
}
