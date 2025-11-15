import type { Product, Modifier, ModifierOption } from "../models/product.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

// Helper to convert schema product to Product type
function mapSchemaProductToProduct(
  product: typeof schema.products.$inferSelect
): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description || "",
    price: product.basePrice, // Map basePrice to price
    costPrice: product.costPrice || 0,
    taxRate: 0, // TODO: Get from vatCategoryId if needed
    sku: product.sku,
    plu: product.plu || undefined,
    image: product.image || undefined,
    category: product.categoryId || "", // Map categoryId to category
    stockLevel: Number(product.stockLevel || 0),
    minStockLevel: Number(product.minStockLevel || 0),
    businessId: product.businessId,
    modifiers: [], // Stub - modifiers table doesn't exist
    isActive: Boolean(product.isActive),
    requiresWeight: Boolean(product.usesScale), // Map usesScale to requiresWeight
    unit:
      (product.salesUnit?.toLowerCase() as "lb" | "kg" | "oz" | "g" | "each") ||
      "each",
    pricePerUnit: product.pricePerKg || undefined,
    createdAt:
      product.createdAt instanceof Date
        ? product.createdAt.toISOString()
        : String(product.createdAt),
    updatedAt:
      product.updatedAt instanceof Date
        ? product.updatedAt.toISOString()
        : String(product.updatedAt),
  };
}

export class ProductManager {
  private drizzle: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.drizzle = drizzle;
    this.uuid = uuid;
  }

  async createProduct(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt" | "modifiers">
  ): Promise<Product> {
    const productId = this.uuid.v4();
    const now = new Date();

    // Validate required fields
    if (!productData.category || productData.category.trim() === "") {
      throw new Error("Category is required and cannot be empty");
    }

    await this.drizzle.insert(schema.products).values({
      id: productId,
      name: productData.name,
      description: productData.description || null,
      basePrice: productData.price, // Map price to basePrice
      costPrice: productData.costPrice || 0,
      sku: productData.sku,
      plu: productData.plu || null,
      image: productData.image || null,
      categoryId: productData.category, // Map category to categoryId
      stockLevel: productData.stockLevel || 0,
      minStockLevel: productData.minStockLevel || 0,
      businessId: productData.businessId,
      isActive: productData.isActive !== false,
      usesScale: productData.requiresWeight || false, // Map requiresWeight to usesScale
      salesUnit:
        (productData.unit?.toUpperCase() as
          | "PIECE"
          | "KG"
          | "GRAM"
          | "LITRE"
          | "ML"
          | "PACK") || "PIECE",
      pricePerKg: productData.pricePerUnit || null,
      createdAt: now,
      updatedAt: now,
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

    return mapSchemaProductToProduct(product);
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

    return mapSchemaProductToProduct(product);
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

    return mapSchemaProductToProduct(product);
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

    return products.map(mapSchemaProductToProduct);
  }

  async updateProduct(
    id: string,
    updates: Partial<Omit<Product, "id" | "createdAt" | "modifiers">>
  ): Promise<Product> {
    const now = new Date();

    if (Object.keys(updates).length === 0) {
      return this.getProductById(id);
    }

    // First check if product exists
    try {
      await this.getProductById(id);
    } catch (error) {
      throw new Error("Product not found");
    }

    // Map Product fields to schema fields
    const schemaUpdates: any = {};
    if (updates.price !== undefined) schemaUpdates.basePrice = updates.price;
    if (updates.costPrice !== undefined)
      schemaUpdates.costPrice = updates.costPrice;
    if (updates.category !== undefined)
      schemaUpdates.categoryId = updates.category;
    if (updates.requiresWeight !== undefined)
      schemaUpdates.usesScale = updates.requiresWeight;
    if (updates.unit !== undefined)
      schemaUpdates.salesUnit = updates.unit.toUpperCase();
    if (updates.pricePerUnit !== undefined)
      schemaUpdates.pricePerKg = updates.pricePerUnit;
    if (updates.name !== undefined) schemaUpdates.name = updates.name;
    if (updates.description !== undefined)
      schemaUpdates.description = updates.description;
    if (updates.sku !== undefined) schemaUpdates.sku = updates.sku;
    if (updates.plu !== undefined) schemaUpdates.plu = updates.plu;
    if (updates.image !== undefined) schemaUpdates.image = updates.image;
    if (updates.stockLevel !== undefined)
      schemaUpdates.stockLevel = updates.stockLevel;
    if (updates.minStockLevel !== undefined)
      schemaUpdates.minStockLevel = updates.minStockLevel;
    if (updates.isActive !== undefined)
      schemaUpdates.isActive = updates.isActive;
    schemaUpdates.updatedAt = now;

    await this.drizzle
      .update(schema.products)
      .set(schemaUpdates)
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
  async createModifier(
    modifierData: Omit<Modifier, "id" | "createdAt" | "updatedAt" | "options">
  ): Promise<Modifier> {
    throw new Error(
      "Modifiers feature not implemented - table does not exist in schema"
    );
  }

  async getModifierById(id: string): Promise<Modifier> {
    throw new Error(
      "Modifiers feature not implemented - table does not exist in schema"
    );
  }

  async createModifierOption(
    modifierId: string,
    optionData: Omit<ModifierOption, "id" | "createdAt">
  ): Promise<ModifierOption> {
    throw new Error(
      "Modifiers feature not implemented - table does not exist in schema"
    );
  }

  async getProductModifiers(productId: string): Promise<Modifier[]> {
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

    return products.map(mapSchemaProductToProduct);
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

    return products.map(mapSchemaProductToProduct);
  }
}
