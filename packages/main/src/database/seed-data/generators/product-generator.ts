/**
 * Product Data Generator
 * Generates realistic product data for POS system
 */
import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";
import type { InferInsertModel } from "drizzle-orm";
import type * as schema from "../../schema.js";
import { PRODUCT_TYPE_DISTRIBUTION } from "../config.js";
import { getLogger } from "../logger.js";

const logger = getLogger("product-generator");

type ProductInsert = InferInsertModel<typeof schema.products>;

export class ProductGenerator {
  private static usedSkus = new Set<string>();
  private static usedBarcodes = new Set<string>();

  /**
   * Generate batch of products with realistic data
   */
  static generateBatch(
    batchSize: number,
    businessId: string,
    categoryIds: string[]
  ): ProductInsert[] {
    const products: ProductInsert[] = [];
    const now = new Date();

    for (let i = 0; i < batchSize; i++) {
      const productType = this.determineProductType();
      const basePrice = this.generateRealisticPrice(productType);
      const costPrice = basePrice * faker.number.float({ min: 0.4, max: 0.7 });

      products.push({
        id: uuidv4(),
        name: this.generateProductName(productType),
        description: faker.commerce.productDescription(),
        basePrice,
        costPrice,
        sku: this.generateUniqueSku(),
        barcode: this.generateUniqueBarcode(),
        plu: productType === "WEIGHTED" ? this.generatePLU() : null,
        image: null,
        categoryId: this.pickRandom(categoryIds),
        productType,
        businessId,

        // Stock management
        stockLevel: faker.number.float({ min: 0, max: 500 }),
        minStockLevel: 10,
        trackInventory: true,

        // Age restrictions (inherit from category or set explicitly)
        ageRestrictionLevel: "NONE",
        requireIdScan: false,

        // Status
        isActive: Math.random() > 0.02, // 98% active
        allowPriceOverride: false,
        allowDiscount: true,

        // Weighted products
        usesScale: productType === "WEIGHTED",
        pricePerKg: productType === "WEIGHTED" ? basePrice : null,

        // Generic products
        isGenericButton: productType === "GENERIC",
        genericDefaultPrice: productType === "GENERIC" ? basePrice : null,

        // Expiry tracking
        hasExpiry: false,
        requiresBatchTracking: false,

        // Metadata
        createdAt: now,
        updatedAt: now,
      });
    }

    return products;
  }

  private static determineProductType(): "STANDARD" | "WEIGHTED" | "GENERIC" {
    const random = Math.random();
    if (random < PRODUCT_TYPE_DISTRIBUTION.STANDARD) return "STANDARD";
    if (
      random <
      PRODUCT_TYPE_DISTRIBUTION.STANDARD + PRODUCT_TYPE_DISTRIBUTION.WEIGHTED
    ) {
      return "WEIGHTED";
    }
    return "GENERIC";
  }

  private static generateRealisticPrice(productType: string): number {
    const priceRanges = {
      STANDARD: { min: 0.99, max: 49.99 },
      WEIGHTED: { min: 1.99, max: 29.99 },
      GENERIC: { min: 0.49, max: 9.99 },
    };

    const range = priceRanges[productType as keyof typeof priceRanges];
    return Number(faker.commerce.price(range));
  }

  private static generateProductName(productType: string): string {
    const adjective = faker.commerce.productAdjective();
    const material = faker.commerce.productMaterial();
    const product = faker.commerce.product();

    if (productType === "WEIGHTED") {
      const weightedProducts = [
        "Apples",
        "Bananas",
        "Oranges",
        "Tomatoes",
        "Potatoes",
        "Beef",
        "Chicken",
        "Fish",
      ];
      return `${adjective} ${this.pickRandom(weightedProducts)}`;
    }

    return `${adjective} ${material} ${product}`;
  }

  private static generateUniqueSku(): string {
    let sku: string;
    do {
      sku = `SKU-${faker.string.alphanumeric(8).toUpperCase()}`;
    } while (this.usedSkus.has(sku));

    this.usedSkus.add(sku);
    return sku;
  }

  private static generateUniqueBarcode(): string {
    let barcode: string;
    do {
      // Generate EAN-13 format barcode
      barcode = faker.string.numeric(13);
    } while (this.usedBarcodes.has(barcode));

    this.usedBarcodes.add(barcode);
    return barcode;
  }

  private static generatePLU(): string {
    // PLU codes are typically 4-5 digits
    return faker.string.numeric(4);
  }

  private static pickRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Reset generators for new seeding run
   */
  static reset(): void {
    this.usedSkus.clear();
    this.usedBarcodes.clear();
  }
}
