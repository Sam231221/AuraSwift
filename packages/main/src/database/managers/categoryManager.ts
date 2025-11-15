import type { Category } from "../models/category.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class CategoryManager {
  private drizzle: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.drizzle = drizzle;
    this.uuid = uuid;
  }

  /**
   * Get category by ID (type-safe)
   */
  async getCategoryById(id: string): Promise<Category> {
    const [category] = await this.drizzle
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
      createdAt: category.createdAt instanceof Date ? category.createdAt.toISOString() : String(category.createdAt),
      updatedAt: category.updatedAt instanceof Date ? category.updatedAt.toISOString() : String(category.updatedAt),
    } as Category;
  }

  /**
   * Get all categories for a business (type-safe)
   */
  async getCategoriesByBusiness(businessId: string): Promise<Category[]> {
    const categories = await this.drizzle
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
      createdAt: cat.createdAt instanceof Date ? cat.createdAt.toISOString() : String(cat.createdAt),
      updatedAt: cat.updatedAt instanceof Date ? cat.updatedAt.toISOString() : String(cat.updatedAt),
    })) as Category[];
  }

  /**
   * Search categories by name (type-safe)
   */
  async searchCategories(
    businessId: string,
    searchTerm: string
  ): Promise<Category[]> {
    const searchPattern = `%${searchTerm}%`;

    const categories = await this.drizzle
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
      createdAt: cat.createdAt instanceof Date ? cat.createdAt.toISOString() : String(cat.createdAt),
      updatedAt: cat.updatedAt instanceof Date ? cat.updatedAt.toISOString() : String(cat.updatedAt),
    })) as Category[];
  }

  /**
   * Get category hierarchy (parent categories with subcategories)
   */
  async getCategoryHierarchy(businessId: string) {
    // Get all categories for the business
    const categories = await this.drizzle
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
   * Create category (type-safe)
   */
  async createCategory(categoryData: {
    name: string;
    description?: string;
    businessId: string;
    sortOrder?: number;
    parentId?: string | null;
  }): Promise<Category> {
    const categoryId = this.uuid.v4();
    const now = new Date();

    // Get the next sort order if not provided
    const nextSortOrder =
      categoryData.sortOrder !== undefined
        ? categoryData.sortOrder
        : await this.getNextCategorySortOrder(categoryData.businessId);

    await this.drizzle.insert(schema.categories).values({
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

    return this.getCategoryById(categoryId);
  }

  /**
   * Update category (type-safe)
   */
  async updateCategory(
    id: string,
    updates: Partial<{
      name: string;
      description: string;
      parentId: string | null;
      sortOrder: number;
      isActive: boolean;
    }>
  ): Promise<Category> {
    const now = new Date();

    await this.drizzle
      .update(schema.categories)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(schema.categories.id, id));

    return this.getCategoryById(id);
  }

  /**
   * Delete category (soft delete, type-safe)
   */
  async deleteCategory(id: string): Promise<boolean> {
    const now = new Date();

    // Check if category is being used by any products
    const productsUsingCategory = await this.drizzle
      .select({ count: drizzleSql<number>`COUNT(*)` })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.categoryId, id),
          eq(schema.products.isActive, true)
        )
      );

    const count = productsUsingCategory[0]?.count || 0;

    if (count > 0) {
      throw new Error(
        `Cannot delete category: ${count} active product(s) are using this category`
      );
    }

    const result = await this.drizzle
      .update(schema.categories)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(eq(schema.categories.id, id));

    return result.changes > 0;
  }

  /**
   * Get next sort order for categories in a business
   */
  private async getNextCategorySortOrder(businessId: string): Promise<number> {
    const result = await this.drizzle
      .select({
        maxOrder: drizzleSql<number>`MAX(${schema.categories.sortOrder})`,
      })
      .from(schema.categories)
      .where(eq(schema.categories.businessId, businessId));

    return (result[0]?.maxOrder || 0) + 1;
  }

  /**
   * Reorder categories
   */
  async reorderCategories(
    businessId: string,
    categoryIds: string[]
  ): Promise<void> {
    const now = new Date();

    // Drizzle doesn't have transaction support in better-sqlite3 driver yet,
    // so we'll run updates sequentially
    for (let index = 0; index < categoryIds.length; index++) {
      await this.drizzle
        .update(schema.categories)
        .set({
          sortOrder: index,
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.categories.id, categoryIds[index]),
            eq(schema.categories.businessId, businessId)
          )
        );
    }
  }

  /**
   * Create default categories for a new business
   */
  async createDefaultCategories(businessId: string): Promise<void> {
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

    const now = new Date();

    for (let index = 0; index < defaultCategories.length; index++) {
      const category = defaultCategories[index];
      const categoryId = this.uuid.v4();

      await this.drizzle.insert(schema.categories).values({
        id: categoryId,
        name: category.name,
        description: category.description,
        businessId: businessId,
        sortOrder: index,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}
