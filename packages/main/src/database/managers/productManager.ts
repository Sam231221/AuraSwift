import type { Product, Modifier, ModifierOption } from "../models/product.js";
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
    productData: Omit<Product, "id" | "createdAt" | "updatedAt" | "modifiers">
  ): Promise<Product> {
    const productId = this.uuid.v4();
    const now = new Date().toISOString();

    // Validate required fields
    if (!productData.category || productData.category.trim() === "") {
      throw new Error("Category is required and cannot be empty");
    }

    await this.drizzle.insert(schema.products).values({
      id: productId,
      name: productData.name,
      description: productData.description || null,
      price: productData.price,
      costPrice: productData.costPrice || 0,
      taxRate: productData.taxRate || 0,
      sku: productData.sku,
      plu: productData.plu || null,
      image: productData.image || null,
      category: productData.category,
      stockLevel: productData.stockLevel || 0,
      minStockLevel: productData.minStockLevel || 0,
      businessId: productData.businessId,
      isActive: productData.isActive !== false,
      requiresWeight: productData.requiresWeight || false,
      unit: productData.unit || "each",
      pricePerUnit: productData.pricePerUnit || null,
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

    const modifiers = await this.getProductModifiers(id);

    return {
      ...product,
      isActive: Boolean(product.isActive),
      requiresWeight: Boolean(product.requiresWeight),
      modifiers,
    } as Product;
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

    const modifiers = await this.getProductModifiers(product.id);

    return {
      ...product,
      isActive: Boolean(product.isActive),
      requiresWeight: Boolean(product.requiresWeight),
      modifiers,
    } as Product;
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

    const productsWithModifiers = await Promise.all(
      products.map(async (product) => ({
        ...product,
        isActive: Boolean(product.isActive),
        requiresWeight: Boolean(product.requiresWeight),
        modifiers: await this.getProductModifiers(product.id),
      }))
    );

    return productsWithModifiers as Product[];
  }

  async updateProduct(
    id: string,
    updates: Partial<Omit<Product, "id" | "createdAt" | "modifiers">>
  ): Promise<Product> {
    const now = new Date().toISOString();

    if (Object.keys(updates).length === 0) {
      return this.getProductById(id);
    }

    const result = await this.drizzle
      .update(schema.products)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(
        and(eq(schema.products.id, id), eq(schema.products.isActive, true))
      );

    if (result.changes === 0) {
      throw new Error("Product not found or update failed");
    }

    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const now = new Date().toISOString();

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

  async createModifier(
    modifierData: Omit<Modifier, "id" | "createdAt" | "updatedAt" | "options">
  ): Promise<Modifier> {
    const modifierId = this.uuid.v4();
    const now = new Date().toISOString();

    await this.drizzle.insert(schema.modifiers).values({
      id: modifierId,
      name: modifierData.name,
      type: modifierData.type,
      required: modifierData.required || false,
      businessId: modifierData.businessId,
      createdAt: now,
      updatedAt: now,
    });

    return this.getModifierById(modifierId);
  }

  async getModifierById(id: string): Promise<Modifier> {
    const [modifier] = await this.drizzle
      .select()
      .from(schema.modifiers)
      .where(eq(schema.modifiers.id, id))
      .limit(1);

    if (!modifier) {
      throw new Error("Modifier not found");
    }

    const options = await this.drizzle
      .select()
      .from(schema.modifierOptions)
      .where(eq(schema.modifierOptions.modifierId, id))
      .orderBy(schema.modifierOptions.name);

    return {
      ...modifier,
      required: Boolean(modifier.required),
      options: options as ModifierOption[],
    } as Modifier;
  }

  async createModifierOption(
    modifierId: string,
    optionData: Omit<ModifierOption, "id" | "createdAt">
  ): Promise<ModifierOption> {
    const optionId = this.uuid.v4();
    const now = new Date().toISOString();

    await this.drizzle.insert(schema.modifierOptions).values({
      id: optionId,
      modifierId: modifierId,
      name: optionData.name,
      price: optionData.price,
      createdAt: now,
    });

    return {
      id: optionId,
      name: optionData.name,
      price: optionData.price,
      createdAt: now,
    };
  }

  async getProductModifiers(productId: string): Promise<Modifier[]> {
    // Get modifiers joined with product_modifiers
    const modifiersData = await this.drizzle
      .select({
        modifier: schema.modifiers,
      })
      .from(schema.modifiers)
      .innerJoin(
        schema.productModifiers,
        eq(schema.modifiers.id, schema.productModifiers.modifierId)
      )
      .where(eq(schema.productModifiers.productId, productId))
      .orderBy(schema.modifiers.name);

    // Get options for each modifier
    const modifiersWithOptions = await Promise.all(
      modifiersData.map(async ({ modifier }) => {
        const options = await this.drizzle
          .select()
          .from(schema.modifierOptions)
          .where(eq(schema.modifierOptions.modifierId, modifier.id))
          .orderBy(schema.modifierOptions.name);

        return {
          ...modifier,
          required: Boolean(modifier.required),
          options: options as ModifierOption[],
        };
      })
    );

    return modifiersWithOptions as Modifier[];
  }

  async addModifierToProduct(
    productId: string,
    modifierId: string
  ): Promise<void> {
    await this.drizzle
      .insert(schema.productModifiers)
      .values({
        productId,
        modifierId,
      })
      .onConflictDoNothing();
  }

  async removeModifierFromProduct(
    productId: string,
    modifierId: string
  ): Promise<void> {
    await this.drizzle
      .delete(schema.productModifiers)
      .where(
        and(
          eq(schema.productModifiers.productId, productId),
          eq(schema.productModifiers.modifierId, modifierId)
        )
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

    return products as Product[];
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
        eq(schema.products.category, schema.categories.id)
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

    return products as Product[];
  }
}
