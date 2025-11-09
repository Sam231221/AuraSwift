import type { Category } from "../models/category.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class CategoryManager {
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

  async createCategory(categoryData: {
    name: string;
    description?: string;
    businessId: string;
    sortOrder?: number;
    parentId?: string | null;
  }): Promise<Category> {
    const categoryId = this.uuid.v4();
    const now = new Date().toISOString();

    const nextSortOrder =
      categoryData.sortOrder !== undefined
        ? categoryData.sortOrder
        : this.getNextCategorySortOrder(categoryData.businessId);

    this.db
      .prepare(
        `INSERT INTO categories (id, name, parentId, description, businessId, sortOrder, createdAt, updatedAt, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        categoryId,
        categoryData.name,
        categoryData.parentId || null,
        categoryData.description || "",
        categoryData.businessId,
        nextSortOrder,
        now,
        now,
        1
      );

    return this.getCategoryById(categoryId);
  }

  getCategoryById(id: string): Category {
    const category = this.db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(id) as Category;

    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    return category;
  }

  getCategoriesByBusiness(businessId: string): Category[] {
    return this.db
      .prepare(
        "SELECT * FROM categories WHERE businessId = ? AND isActive = 1 ORDER BY sortOrder ASC, name ASC"
      )
      .all(businessId) as Category[];
  }

  updateCategory(
    id: string,
    updates: Partial<Omit<Category, "id" | "businessId" | "createdAt">>
  ): Category {
    const now = new Date().toISOString();
    const allowedFields = [
      "name",
      "description",
      "sortOrder",
      "isActive",
      "parentId",
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return this.getCategoryById(id);
    }

    updateFields.push("updatedAt = ?");
    updateValues.push(now, id);

    this.db
      .prepare(`UPDATE categories SET ${updateFields.join(", ")} WHERE id = ?`)
      .run(...updateValues);

    return this.getCategoryById(id);
  }

  deleteCategory(id: string): boolean {
    const now = new Date().toISOString();

    const productsUsingCategory = this.db
      .prepare(
        "SELECT COUNT(*) as count FROM products WHERE category = ? AND isActive = 1"
      )
      .get(id) as { count: number };

    if (productsUsingCategory.count > 0) {
      throw new Error(
        `Cannot delete category. ${productsUsingCategory.count} products are still using this category.`
      );
    }

    const result = this.db
      .prepare("UPDATE categories SET isActive = 0, updatedAt = ? WHERE id = ?")
      .run(now, id);

    return result.changes > 0;
  }

  private getNextCategorySortOrder(businessId: string): number {
    const maxOrder = this.db
      .prepare(
        "SELECT MAX(sortOrder) as maxOrder FROM categories WHERE businessId = ?"
      )
      .get(businessId) as { maxOrder: number | null };

    return (maxOrder?.maxOrder || 0) + 1;
  }

  reorderCategories(businessId: string, categoryIds: string[]): void {
    const transaction = this.db.transaction(() => {
      categoryIds.forEach((categoryId, index) => {
        this.db
          .prepare(
            "UPDATE categories SET sortOrder = ?, updatedAt = ? WHERE id = ? AND businessId = ?"
          )
          .run(index, new Date().toISOString(), categoryId, businessId);
      });
    });

    transaction();
  }

  createDefaultCategories(businessId: string): void {
    const defaultCategories = [
      { name: "Fresh Produce", description: "Fresh fruits and vegetables" },
      {
        name: "Dairy & Eggs",
        description: "Milk, cheese, eggs, and dairy products",
      },
      {
        name: "Meat & Poultry",
        description: "Fresh meat, chicken, and seafood",
      },
      { name: "Bakery", description: "Fresh bread, pastries, and baked goods" },
      {
        name: "Frozen Foods",
        description: "Frozen meals, ice cream, and frozen vegetables",
      },
      {
        name: "Pantry Essentials",
        description: "Canned goods, pasta, rice, and cooking essentials",
      },
      {
        name: "Snacks & Confectionery",
        description: "Chips, candy, chocolates, and snacks",
      },
      {
        name: "Beverages",
        description: "Soft drinks, juices, water, and beverages",
      },
      {
        name: "Health & Beauty",
        description: "Personal care and health products",
      },
      {
        name: "Household Items",
        description: "Cleaning supplies and household necessities",
      },
    ];

    const transaction = this.db.transaction(() => {
      defaultCategories.forEach((category, index) => {
        const categoryId = this.uuid.v4();
        const now = new Date().toISOString();
        this.db
          .prepare(
            `INSERT INTO categories (id, name, description, businessId, sortOrder, createdAt, updatedAt, isActive)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
          )
          .run(
            categoryId,
            category.name,
            category.description,
            businessId,
            index,
            now,
            now
          );
      });
    });

    transaction();
  }

  // ============================================
  // DRIZZLE ORM METHODS
  // ============================================

  /**
   * Get category by ID using Drizzle ORM (type-safe)
   */
  async getByIdDrizzle(id: string): Promise<Category> {
    const drizzle = this.getDrizzleInstance();

    const [category] = await drizzle
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    return {
      ...category,
      isActive: Boolean(category.isActive),
    } as Category;
  }

  /**
   * Get all categories for a business using Drizzle ORM (type-safe)
   */
  async getByBusinessDrizzle(businessId: string): Promise<Category[]> {
    const drizzle = this.getDrizzleInstance();

    const categories = await drizzle
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.businessId, businessId),
          eq(schema.categories.isActive, true)
        )
      )
      .orderBy(schema.categories.sortOrder, schema.categories.name);

    return categories.map((cat) => ({
      ...cat,
      isActive: Boolean(cat.isActive),
    })) as Category[];
  }

  /**
   * Search categories by name using Drizzle ORM (type-safe)
   */
  async searchDrizzle(
    businessId: string,
    searchTerm: string
  ): Promise<Category[]> {
    const drizzle = this.getDrizzleInstance();
    const searchPattern = `%${searchTerm}%`;

    const categories = await drizzle
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.businessId, businessId),
          eq(schema.categories.isActive, true),
          drizzleSql`(
            ${schema.categories.name} LIKE ${searchPattern} OR 
            ${schema.categories.description} LIKE ${searchPattern}
          )`
        )
      )
      .orderBy(schema.categories.name);

    return categories.map((cat) => ({
      ...cat,
      isActive: Boolean(cat.isActive),
    })) as Category[];
  }

  /**
   * Get category hierarchy (parent categories with subcategories)
   */
  async getHierarchyDrizzle(businessId: string) {
    const drizzle = this.getDrizzleInstance();

    // Get all categories for the business
    const categories = await drizzle
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.businessId, businessId),
          eq(schema.categories.isActive, true)
        )
      )
      .orderBy(schema.categories.sortOrder, schema.categories.name);

    // Build hierarchy (categories with parentId null are top-level)
    const categoryMap = new Map();
    const topLevel: any[] = [];

    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
        isActive: Boolean(cat.isActive),
      });
    });

    categories.forEach((cat) => {
      const category = categoryMap.get(cat.id);
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(category);
        }
      } else {
        topLevel.push(category);
      }
    });

    return topLevel;
  }

  /**
   * Create category using Drizzle ORM (type-safe)
   */
  async createDrizzle(categoryData: {
    name: string;
    description?: string;
    businessId: string;
    sortOrder?: number;
    parentId?: string | null;
  }): Promise<Category> {
    const drizzle = this.getDrizzleInstance();
    const categoryId = this.uuid.v4();
    const now = new Date().toISOString();

    // Get the next sort order if not provided
    const nextSortOrder =
      categoryData.sortOrder !== undefined
        ? categoryData.sortOrder
        : this.getNextCategorySortOrder(categoryData.businessId);

    await drizzle.insert(schema.categories).values({
      id: categoryId,
      name: categoryData.name,
      parentId: categoryData.parentId || null,
      description: categoryData.description || null,
      businessId: categoryData.businessId,
      sortOrder: nextSortOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return this.getByIdDrizzle(categoryId);
  }

  /**
   * Update category using Drizzle ORM (type-safe)
   */
  async updateDrizzle(
    id: string,
    updates: Partial<{
      name: string;
      description: string;
      parentId: string | null;
      sortOrder: number;
      isActive: boolean;
    }>
  ): Promise<Category> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    await drizzle
      .update(schema.categories)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(schema.categories.id, id));

    return this.getByIdDrizzle(id);
  }

  /**
   * Delete category using Drizzle ORM (soft delete, type-safe)
   */
  async deleteDrizzle(id: string): Promise<boolean> {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    // Check if category is being used by any products
    const productsUsingCategory = await drizzle
      .select({ count: drizzleSql<number>`COUNT(*)` })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.category, id),
          eq(schema.products.isActive, true)
        )
      );

    const count = productsUsingCategory[0]?.count || 0;

    if (count > 0) {
      throw new Error(
        `Cannot delete category: ${count} active product(s) are using this category`
      );
    }

    const result = await drizzle
      .update(schema.categories)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(eq(schema.categories.id, id));

    return result.changes > 0;
  }
}
