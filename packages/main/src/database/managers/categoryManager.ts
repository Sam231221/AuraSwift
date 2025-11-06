import type { Category } from "../models/category.js";

export class CategoryManager {
  private db: any;
  private uuid: any;

  constructor(db: any, uuid: any) {
    this.db = db;
    this.uuid = uuid;
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
}
