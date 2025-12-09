/**
 * Category Data Generator
 * Generates hierarchical category structures for POS system
 */
import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";
import type { InferInsertModel } from "drizzle-orm";
import type * as schema from "../../schema.js";
import { CATEGORY_TEMPLATES } from "../config.js";
import { getLogger } from "../logger.js";

const logger = getLogger("category-generator");

type CategoryInsert = InferInsertModel<typeof schema.categories>;

export class CategoryGenerator {
  /**
   * Generate category hierarchy with parent-child relationships
   */
  static generateCategories(
    count: number,
    businessId: string,
    vatCategoryIds: string[]
  ): CategoryInsert[] {
    logger.info(`📦 Generating ${count} categories...`);

    const categories: CategoryInsert[] = [];
    const now = new Date();

    // Calculate parent/child distribution (30% parents, 70% children)
    const parentCount = Math.floor(count * 0.3);
    const childCount = count - parentCount;

    // Generate parent categories
    const parentIds: string[] = [];
    for (let i = 0; i < parentCount; i++) {
      const template = CATEGORY_TEMPLATES[i % CATEGORY_TEMPLATES.length];
      const id = uuidv4();
      parentIds.push(id);

      categories.push({
        id,
        name: this.generateCategoryName(template.name, i),
        description: faker.commerce.productDescription(),
        parentId: null, // Top-level category
        businessId,
        vatCategoryId: this.pickRandom(vatCategoryIds),
        vatOverridePercent: null,
        sortOrder: i,
        color: template.color,
        image: null,
        isActive: true,
        ageRestrictionLevel: template.ageRestriction as any,
        requireIdScan: template.ageRestriction !== "NONE",
        createdAt: now,
        updatedAt: now,
      });
    }

    // Generate child categories (subcategories)
    for (let i = 0; i < childCount; i++) {
      const parentId = this.pickRandom(parentIds);
      const parentCategory = categories.find((c) => c.id === parentId);

      categories.push({
        id: uuidv4(),
        name: this.generateSubcategoryName(parentCategory?.name || "General"),
        description: faker.commerce.productDescription(),
        parentId,
        businessId,
        vatCategoryId: this.pickRandom(vatCategoryIds),
        vatOverridePercent: null,
        sortOrder: parentCount + i,
        color: parentCategory?.color || "#000000",
        image: null,
        isActive: Math.random() > 0.05, // 95% active
        ageRestrictionLevel: parentCategory?.ageRestrictionLevel || "NONE",
        requireIdScan: parentCategory?.requireIdScan || false,
        createdAt: now,
        updatedAt: now,
      });
    }

    logger.info(
      `✅ Generated ${categories.length} categories (${parentIds.length} parents, ${childCount} children)`
    );
    return categories;
  }

  private static generateCategoryName(template: string, index: number): string {
    if (index === 0) return template;

    const suffixes = [
      "Premium",
      "Value",
      "Organic",
      "Fresh",
      "Select",
      "Express",
    ];
    const suffix = this.pickRandom(suffixes);
    return `${template} - ${suffix}`;
  }

  private static generateSubcategoryName(parentName: string): string {
    const subcategoryTypes = [
      faker.commerce.productMaterial(),
      faker.commerce.productAdjective(),
      faker.commerce.product(),
    ];

    return `${parentName} > ${this.pickRandom(subcategoryTypes)}`;
  }

  private static pickRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
