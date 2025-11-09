import type { Product, Modifier, ModifierOption } from "../models/product.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class ProductManager {
  private db: any;
  private drizzle: DrizzleDB;
  private uuid: any;

  constructor(db: any, drizzle: DrizzleDB, uuid: any) {
    this.db = db;
    this.drizzle = drizzle;
    this.uuid = uuid;
  }

  /**
   * Get Drizzle ORM instance
   */
  private getDrizzleInstance(): DrizzleDB {
    if (!this.drizzle) {
      throw new Error("Drizzle ORM not initialized");
    }
    return this.drizzle;
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

    const result = this.db
      .prepare(
        `
      INSERT INTO products (
        id, name, description, price, costPrice, taxRate, sku, plu, 
        image, category, stockLevel, minStockLevel, businessId, isActive, 
        requiresWeight, unit, pricePerUnit, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        productId,
        productData.name,
        productData.description,
        productData.price,
        productData.costPrice,
        productData.taxRate,
        productData.sku,
        productData.plu,
        productData.image,
        productData.category,
        productData.stockLevel,
        productData.minStockLevel,
        productData.businessId,
        productData.isActive ? 1 : 0,
        productData.requiresWeight ? 1 : 0,
        productData.unit || "each",
        productData.pricePerUnit || null,
        now,
        now
      );

    if (result.changes === 0) {
      throw new Error("Failed to create product");
    }

    return this.getProductById(productId);
  }

  getProductById(id: string): Product {
    const product = this.db
      .prepare(`SELECT * FROM products WHERE id = ? AND isActive = 1`)
      .get(id) as any;

    if (!product) {
      throw new Error("Product not found");
    }

    const modifiers = this.getProductModifiers(id);

    return {
      ...product,
      isActive: Boolean(product.isActive),
      requiresWeight: Boolean(product.requiresWeight),
      modifiers,
    };
  }

  getProductByPLU(plu: string): Product {
    const product = this.db
      .prepare(`SELECT * FROM products WHERE plu = ? AND isActive = 1`)
      .get(plu) as any;

    if (!product) {
      throw new Error("Product not found");
    }

    const modifiers = this.getProductModifiers(product.id);

    return {
      ...product,
      isActive: Boolean(product.isActive),
      requiresWeight: Boolean(product.requiresWeight),
      modifiers,
    };
  }

  getProductsByBusiness(businessId: string): Product[] {
    const products = this.db
      .prepare(
        `SELECT * FROM products WHERE businessId = ? AND isActive = 1 ORDER BY name ASC`
      )
      .all(businessId) as any[];

    return products.map((product) => ({
      ...product,
      isActive: Boolean(product.isActive),
      requiresWeight: Boolean(product.requiresWeight),
      modifiers: this.getProductModifiers(product.id),
    }));
  }

  async updateProduct(
    id: string,
    updates: Partial<Omit<Product, "id" | "createdAt" | "modifiers">>
  ): Promise<Product> {
    const now = new Date().toISOString();

    const fields = Object.keys(updates).filter((key) => key !== "modifiers");
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => {
      const value = updates[field as keyof typeof updates];
      if (typeof value === "boolean") {
        return value ? 1 : 0;
      }
      if (value === null || value === undefined) {
        return null;
      }
      return value;
    });

    if (fields.length === 0) {
      return this.getProductById(id);
    }

    const result = this.db
      .prepare(
        `UPDATE products SET ${setClause}, updatedAt = ? WHERE id = ? AND isActive = 1`
      )
      .run(...values, now, id);

    if (result.changes === 0) {
      throw new Error("Product not found or update failed");
    }

    return this.getProductById(id);
  }

  deleteProduct(id: string): boolean {
    const result = this.db
      .prepare(
        `UPDATE products SET isActive = 0, updatedAt = ? WHERE id = ? AND isActive = 1`
      )
      .run(new Date().toISOString(), id);

    return result.changes > 0;
  }

  async createModifier(
    modifierData: Omit<Modifier, "id" | "createdAt" | "updatedAt" | "options">
  ): Promise<Modifier> {
    const modifierId = this.uuid.v4();
    const now = new Date().toISOString();

    const result = this.db
      .prepare(
        `INSERT INTO modifiers (id, name, type, required, businessId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        modifierId,
        modifierData.name,
        modifierData.type,
        modifierData.required ? 1 : 0,
        modifierData.businessId,
        now,
        now
      );

    if (result.changes === 0) {
      throw new Error("Failed to create modifier");
    }

    return this.getModifierById(modifierId);
  }

  getModifierById(id: string): Modifier {
    const modifier = this.db
      .prepare(`SELECT * FROM modifiers WHERE id = ?`)
      .get(id) as any;

    if (!modifier) {
      throw new Error("Modifier not found");
    }

    const options = this.db
      .prepare(
        `SELECT * FROM modifier_options WHERE modifierId = ? ORDER BY name ASC`
      )
      .all(id) as ModifierOption[];

    return {
      ...modifier,
      required: Boolean(modifier.required),
      options,
    };
  }

  createModifierOption(
    modifierId: string,
    optionData: Omit<ModifierOption, "id" | "createdAt">
  ): ModifierOption {
    const optionId = this.uuid.v4();
    const now = new Date().toISOString();

    const result = this.db
      .prepare(
        `INSERT INTO modifier_options (id, modifierId, name, price, createdAt)
       VALUES (?, ?, ?, ?, ?)`
      )
      .run(optionId, modifierId, optionData.name, optionData.price, now);

    if (result.changes === 0) {
      throw new Error("Failed to create modifier option");
    }

    return {
      id: optionId,
      name: optionData.name,
      price: optionData.price,
      createdAt: now,
    };
  }

  getProductModifiers(productId: string): Modifier[] {
    const modifiers = this.db
      .prepare(
        `SELECT m.* FROM modifiers m
       JOIN product_modifiers pm ON m.id = pm.modifierId
       WHERE pm.productId = ?
       ORDER BY m.name ASC`
      )
      .all(productId) as any[];

    return modifiers.map((modifier) => ({
      ...modifier,
      required: Boolean(modifier.required),
      options: this.db
        .prepare(
          `SELECT * FROM modifier_options WHERE modifierId = ? ORDER BY name ASC`
        )
        .all(modifier.id) as ModifierOption[],
    }));
  }

  addModifierToProduct(productId: string, modifierId: string): void {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO product_modifiers (productId, modifierId)
       VALUES (?, ?)`
      )
      .run(productId, modifierId);
  }

  removeModifierFromProduct(productId: string, modifierId: string): void {
    this.db
      .prepare(
        `DELETE FROM product_modifiers WHERE productId = ? AND modifierId = ?`
      )
      .run(productId, modifierId);
  }

  // ============================================
  // DRIZZLE ORM METHODS
  // ============================================

  /**
   * Get products by business using Drizzle ORM (type-safe)
   */
  async getByBusinessDrizzle(businessId: string): Promise<Product[]> {
    const drizzle = this.getDrizzleInstance();

    const products = await drizzle
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.businessId, businessId),
          eq(schema.products.isActive, true)
        )
      )
      .orderBy(schema.products.name);

    return products as Product[];
  }

  /**
   * Search products by name or SKU using Drizzle ORM (type-safe)
   */
  async searchDrizzle(
    businessId: string,
    searchTerm: string
  ): Promise<Product[]> {
    const drizzle = this.getDrizzleInstance();
    const searchPattern = `%${searchTerm}%`;

    const products = await drizzle
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
   * Get products with category details using Drizzle JOIN (type-safe)
   */
  async getWithCategoryDrizzle(businessId: string) {
    const drizzle = this.getDrizzleInstance();

    const products = await drizzle
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
   * Get low stock products using Drizzle ORM (type-safe)
   */
  async getLowStockDrizzle(businessId: string, threshold: number = 10) {
    const drizzle = this.getDrizzleInstance();

    const products = await drizzle
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

  /**
   * Create product using Drizzle ORM (type-safe)
   */
  async createDrizzle(
    productData: Omit<Product, "id" | "createdAt" | "updatedAt" | "modifiers">
  ): Promise<Product> {
    const drizzle = this.getDrizzleInstance();
    const productId = this.uuid.v4();
    const now = new Date().toISOString();

    // Validate required fields
    if (!productData.category || productData.category.trim() === "") {
      throw new Error("Category is required and cannot be empty");
    }

    await drizzle.insert(schema.products).values({
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

    // Get the product with modifiers (use raw SQL method for now)
    return this.getProductById(productId);
  }

  /**
   * Update product using Drizzle ORM (type-safe)
   */
  async updateDrizzle(
    id: string,
    updates: Partial<
      Omit<Product, "id" | "createdAt" | "updatedAt" | "modifiers">
    >
  ): Promise<Product> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    // Build the update object, converting booleans to integers for SQLite
    const updateData: any = {
      ...updates,
      updatedAt: now,
    };

    // Ensure booleans are converted properly if present
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }
    if (updates.requiresWeight !== undefined) {
      updateData.requiresWeight = updates.requiresWeight;
    }

    await drizzle
      .update(schema.products)
      .set(updateData)
      .where(eq(schema.products.id, id));

    return this.getProductById(id);
  }

  /**
   * Delete product using Drizzle ORM (soft delete, type-safe)
   */
  async deleteDrizzle(id: string): Promise<boolean> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const result = await drizzle
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
}
