/**
 * Bulk Data Seeding Orchestrator
 * Seeds large datasets for performance testing
 */
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { CategoryGenerator } from "./generators/category-generator.js";
import { ProductGenerator } from "./generators/product-generator.js";
import { BasicDataGenerator } from "./generators/basic-data-generator.js";
import { DatabasePerformanceOptimizer } from "./db-performance.js";
import { getPresetConfig, type SeedPreset, type SeedConfig } from "./config.js";
import { getLogger } from "./logger.js";

const logger = getLogger("bulk-seeder");

export class BulkDataSeeder {
  constructor(
    private db: BetterSQLite3Database,
    private sqliteDb: Database.Database,
    private schema: any
  ) {}

  /**
   * Seed large dataset using preset configuration
   */
  async seedWithPreset(preset: SeedPreset): Promise<void> {
    const config = getPresetConfig(preset);
    logger.info(`🌱 Starting bulk seeding with preset: ${preset}`);
    logger.info(`   Categories: ${config.categories}`);
    logger.info(`   Products: ${config.products}`);
    logger.info(`   Batch size: ${config.batchSize}`);

    await this.seedWithConfig(config);
  }

  /**
   * Seed basic data only (users, roles, business, terminal)
   */
  async seedBasicOnly(): Promise<void> {
    logger.info("🌱 Seeding basic system data only...");

    await BasicDataGenerator.seedBasicData(this.db, this.schema, true);

    logger.info("✅ Basic seeding completed!");
  }

  /**
   * Seed large dataset using custom configuration
   */
  async seedWithConfig(config: SeedConfig): Promise<void> {
    const startTime = Date.now();

    try {
      // Check if this is basic-only seeding
      if (config.categories === 0 && config.products === 0) {
        await this.seedBasicOnly();
        return;
      }

      // Ensure basic data exists first
      const hasBasic = await BasicDataGenerator.hasBasicData(
        this.db,
        this.schema
      );
      if (!hasBasic) {
        logger.info("📋 Basic data not found, seeding it first...");
        await BasicDataGenerator.seedBasicData(this.db, this.schema, false);
      }

      // Get business context
      const business = await this.getOrCreateBusiness();
      const businessId = business.id;

      // Get VAT categories
      const vatCategories = this.db
        .select()
        .from(this.schema.vatCategories)
        .all();
      const vatCategoryIds = vatCategories.map((v: any) => v.id);

      if (vatCategoryIds.length === 0) {
        throw new Error(
          "No VAT categories found. Please run basic seeding first."
        );
      }

      // Enable performance mode
      DatabasePerformanceOptimizer.enableBulkInsertMode(this.sqliteDb);

      // Optionally clear existing data
      if (config.clearExisting) {
        await this.clearBulkData();
      }

      // Step 1: Seed categories
      logger.info("\n📦 Step 1/2: Seeding categories...");
      const categoryIds = await this.seedCategories(
        config.categories,
        config.batchSize,
        businessId,
        vatCategoryIds
      );

      // Step 2: Seed products
      logger.info("\n🏷️  Step 2/2: Seeding products...");
      await this.seedProducts(
        config.products,
        config.batchSize,
        businessId,
        categoryIds
      );

      // Optimize database
      logger.info("\n🔧 Optimizing database...");
      DatabasePerformanceOptimizer.optimizeDatabase(this.sqliteDb);

      // Restore production mode
      DatabasePerformanceOptimizer.restoreProductionMode(this.sqliteDb);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`\n✅ Bulk seeding completed in ${duration}s`);
      logger.info(`   Categories: ${categoryIds.length}`);
      logger.info(`   Products: ${config.products}`);
    } catch (error) {
      logger.error("❌ Bulk seeding failed:", error);
      DatabasePerformanceOptimizer.restoreProductionMode(this.sqliteDb);
      throw error;
    }
  }

  private async seedCategories(
    count: number,
    batchSize: number,
    businessId: string,
    vatCategoryIds: string[]
  ): Promise<string[]> {
    // Generate all categories
    const categories = CategoryGenerator.generateCategories(
      count,
      businessId,
      vatCategoryIds
    );

    // Insert in batches
    const totalBatches = Math.ceil(categories.length / batchSize);
    const categoryIds: string[] = [];

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, categories.length);
      const batch = categories.slice(start, end);

      // Use transaction for batch
      this.sqliteDb.transaction(() => {
        for (const category of batch) {
          this.db.insert(this.schema.categories).values(category).run();
          categoryIds.push(category.id);
        }
      })();

      const progress = (((i + 1) / totalBatches) * 100).toFixed(1);
      logger.info(
        `   Progress: ${progress}% (${end}/${categories.length} categories)`
      );
    }

    return categoryIds;
  }

  private async seedProducts(
    count: number,
    batchSize: number,
    businessId: string,
    categoryIds: string[]
  ): Promise<void> {
    ProductGenerator.reset(); // Reset unique constraints

    const totalBatches = Math.ceil(count / batchSize);
    let totalInserted = 0;

    for (let i = 0; i < totalBatches; i++) {
      const currentBatchSize = Math.min(batchSize, count - totalInserted);
      const products = ProductGenerator.generateBatch(
        currentBatchSize,
        businessId,
        categoryIds
      );

      // Use transaction for batch
      this.sqliteDb.transaction(() => {
        for (const product of products) {
          this.db.insert(this.schema.products).values(product).run();
        }
      })();

      totalInserted += products.length;
      const progress = (((i + 1) / totalBatches) * 100).toFixed(1);
      logger.info(
        `   Progress: ${progress}% (${totalInserted}/${count} products)`
      );
    }
  }

  private async getOrCreateBusiness() {
    const businesses = this.db.select().from(this.schema.businesses).all();
    if (businesses.length === 0) {
      throw new Error(
        "No business found. Please run basic seeding first (npm run start)"
      );
    }
    return businesses[0];
  }

  private async clearBulkData(): Promise<void> {
    logger.warn("⚠️  Clearing existing products and categories...");
    this.db.delete(this.schema.products).run();
    this.db.delete(this.schema.categories).run();
    logger.info("✅ Bulk data cleared");
  }
}
