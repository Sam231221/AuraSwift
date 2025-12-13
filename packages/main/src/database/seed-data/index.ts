/**
 * Category and Product Seeding Orchestrator
 *
 * Seeds categories and products for testing and development.
 *
 * Prerequisites:
 * - Business must exist (created by basic seeding in seed.ts)
 * - VAT categories must exist (created by basic seeding in seed.ts)
 *
 * Usage:
 * ```javascript
 * // In DevTools console:
 * await seedAPI.runPreset("small");
 * await seedAPI.runCustom({ categories: 100, products: 500 });
 * ```
 */
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { CategoryGenerator } from "./generators/category-generator.js";
import { ProductGenerator } from "./generators/product-generator.js";
import { getPresetConfig, type SeedPreset, type SeedConfig } from "./config.js";
import { getLogger } from "../../utils/logger.js";

const logger = getLogger("category-product-seeder");

/**
 * Main seeding class for categories and products
 * Handles batch inserts, performance optimization, and data validation
 */
export class CategoryProductSeeder {
  constructor(
    private db: BetterSQLite3Database,
    private sqliteDb: Database.Database,
    private schema: any
  ) {}

  /**
   * Seed categories and products using preset configuration
   */
  async seedWithPreset(preset: SeedPreset): Promise<void> {
    const config = getPresetConfig(preset);
    logger.info(`🌱 Starting category/product seeding with preset: ${preset}`);
    logger.info(`   Categories: ${config.categories}`);
    logger.info(`   Products: ${config.products}`);
    logger.info(`   Batch size: ${config.batchSize}`);

    await this.seedWithConfig(config);
  }

  /**
   * Seed categories and products using custom configuration
   */
  async seedWithConfig(config: SeedConfig): Promise<void> {
    const startTime = Date.now();

    // Validate configuration
    if (config.categories < 0 || config.products < 0) {
      throw new Error("Categories and products counts must be non-negative");
    }

    if (config.batchSize <= 0) {
      throw new Error("Batch size must be greater than 0");
    }

    // Early return if nothing to seed
    if (config.categories === 0 && config.products === 0) {
      logger.info("⚠️  No categories or products to seed. Skipping...");
      return;
    }

    try {
      // Validate prerequisites
      const business = await this.getBusiness();
      const businessId = business.id;

      const vatCategories = this.db
        .select()
        .from(this.schema.vatCategories)
        .all();
      const vatCategoryIds = vatCategories.map((v: any) => v.id);

      if (vatCategoryIds.length === 0) {
        throw new Error(
          "No VAT categories found. Please ensure basic seeding has been run first."
        );
      }

      // Enable performance mode for bulk inserts
      this.enableBulkInsertMode();

      // Check if categories/products already exist
      const existingCategories = this.db
        .select({ id: this.schema.categories.id })
        .from(this.schema.categories)
        .where(eq(this.schema.categories.businessId, businessId))
        .all();
      const existingProducts = this.db
        .select({ id: this.schema.products.id })
        .from(this.schema.products)
        .where(eq(this.schema.products.businessId, businessId))
        .all();

      // Wrap clearing and seeding in a savepoint to ensure atomicity
      // If seeding fails, the clearing will be rolled back
      const needsClearing =
        existingCategories.length > 0 || existingProducts.length > 0;
      if (needsClearing) {
        if (config.clearExisting) {
          logger.info(
            `🗑️  Clearing existing data: ${existingCategories.length} categories, ${existingProducts.length} products`
          );
        } else {
          logger.warn(
            `⚠️  Found existing data: ${existingCategories.length} categories, ${existingProducts.length} products`
          );
          logger.info("   Automatically clearing to allow reseeding...");
        }
      }

      // Use a savepoint to wrap the entire operation
      // This allows us to rollback if anything goes wrong
      const savepointName = `seed_${Date.now()}`;
      let categoryIds: string[] = [];

      try {
        // Create savepoint before clearing
        this.sqliteDb.exec(`SAVEPOINT ${savepointName}`);

        // Clear existing data
        if (needsClearing) {
          this.clearExistingData();
        }

        // Step 1: Seed categories (if requested)
        if (config.categories > 0) {
          logger.info("\n📦 Step 1/2: Seeding categories...");
          // Don't use nested transactions since we're already in a savepoint
          categoryIds = await this.seedCategories(
            config.categories,
            config.batchSize,
            businessId,
            vatCategoryIds,
            false // Already in transaction context
          );
        } else {
          // If no new categories, use existing ones (should be empty after clearing)
          const remainingCategories = this.db
            .select({ id: this.schema.categories.id })
            .from(this.schema.categories)
            .where(eq(this.schema.categories.businessId, businessId))
            .all();
          categoryIds = remainingCategories.map((c: any) => c.id);

          if (categoryIds.length === 0 && config.products > 0) {
            throw new Error(
              "No categories found. Cannot seed products without categories. Please seed categories first."
            );
          }
        }

        // Step 2: Seed products (if requested)
        if (config.products > 0) {
          logger.info("\n🏷️  Step 2/2: Seeding products...");
          // Don't use nested transactions since we're already in a savepoint
          await this.seedProducts(
            config.products,
            config.batchSize,
            businessId,
            categoryIds,
            false // Already in transaction context
          );
        }

        // Release savepoint on success
        this.sqliteDb.exec(`RELEASE SAVEPOINT ${savepointName}`);
      } catch (error) {
        // Rollback to savepoint on error - this restores the database to before clearing
        try {
          this.sqliteDb.exec(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          this.sqliteDb.exec(`RELEASE SAVEPOINT ${savepointName}`);
          logger.info("   🔄 Database rolled back to state before seeding");
        } catch (rollbackError) {
          logger.error("   ⚠️  Failed to rollback savepoint:", rollbackError);
        }
        throw error;
      }

      // Optimize database after bulk inserts (only if transaction succeeded)
      this.optimizeDatabase();

      // Restore production mode
      this.restoreProductionMode();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`\n✅ Category/product seeding completed in ${duration}s`);
      if (config.categories > 0) {
        logger.info(`   Categories created: ${categoryIds.length}`);
      }
      if (config.products > 0) {
        logger.info(`   Products created: ${config.products}`);
      }
    } catch (error) {
      logger.error("❌ Category/product seeding failed:", error);
      logger.error(
        "   💡 Database state preserved - no data was lost due to transaction rollback"
      );
      this.restoreProductionMode();
      throw error;
    }
  }

  /**
   * Seed categories in batches
   */
  private async seedCategories(
    count: number,
    batchSize: number,
    businessId: string,
    vatCategoryIds: string[],
    useTransaction: boolean = true
  ): Promise<string[]> {
    if (count === 0) {
      return [];
    }

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

      try {
        if (useTransaction) {
          // Use transaction for batch insert when not already in a transaction
          const insertCategories = this.sqliteDb.transaction((categories) => {
            for (const category of categories) {
              this.db.insert(this.schema.categories).values(category).run();
              categoryIds.push(category.id);
            }
          });
          insertCategories(batch);
        } else {
          // Direct insert when already in a transaction context
          for (const category of batch) {
            this.db.insert(this.schema.categories).values(category).run();
            categoryIds.push(category.id);
          }
        }
      } catch (error) {
        logger.error(`Failed to insert category batch ${i + 1}:`, error);
        throw error;
      }

      const progress = (((i + 1) / totalBatches) * 100).toFixed(1);
      logger.info(
        `   Progress: ${progress}% (${end}/${categories.length} categories)`
      );
    }

    return categoryIds;
  }

  /**
   * Seed products in batches
   */
  private async seedProducts(
    count: number,
    batchSize: number,
    businessId: string,
    categoryIds: string[],
    useTransaction: boolean = true
  ): Promise<void> {
    if (count === 0) {
      return;
    }

    if (categoryIds.length === 0) {
      throw new Error(
        "Cannot seed products without categories. Please seed categories first."
      );
    }

    // Reset generator to ensure unique SKUs and barcodes
    ProductGenerator.reset();

    const totalBatches = Math.ceil(count / batchSize);
    let totalInserted = 0;

    for (let i = 0; i < totalBatches; i++) {
      const currentBatchSize = Math.min(batchSize, count - totalInserted);
      const products = ProductGenerator.generateBatch(
        currentBatchSize,
        businessId,
        categoryIds
      );

      try {
        if (useTransaction) {
          // Use transaction for batch insert when not already in a transaction
          const insertProducts = this.sqliteDb.transaction((products) => {
            for (const product of products) {
              this.db.insert(this.schema.products).values(product).run();
            }
          });
          insertProducts(products);
        } else {
          // Direct insert when already in a transaction context
          for (const product of products) {
            this.db.insert(this.schema.products).values(product).run();
          }
        }
      } catch (error) {
        logger.error(`Failed to insert product batch ${i + 1}:`, error);
        throw error;
      }

      totalInserted += products.length;
      const progress = (((i + 1) / totalBatches) * 100).toFixed(1);
      logger.info(
        `   Progress: ${progress}% (${totalInserted}/${count} products)`
      );
    }
  }

  /**
   * Get the first business from the database
   * @throws Error if no business exists
   */
  private async getBusiness() {
    const businesses = this.db.select().from(this.schema.businesses).all();
    if (businesses.length === 0) {
      throw new Error(
        "No business found. Please ensure basic seeding has been run first."
      );
    }
    return businesses[0];
  }

  /**
   * Clear existing categories and products
   */
  private async clearExistingData(): Promise<void> {
    logger.warn("⚠️  Clearing existing products and categories...");

    // Delete products first (due to foreign key constraints)
    this.db.delete(this.schema.products).run();

    // Then delete categories
    this.db.delete(this.schema.categories).run();

    logger.info("✅ Existing categories and products cleared");
  }

  /**
   * Enable high-performance mode for bulk inserts
   * WARNING: Reduces durability - only use for development/testing
   */
  private enableBulkInsertMode(): void {
    logger.info("🚀 Enabling bulk insert performance mode...");

    // WAL mode: Better concurrency and performance
    this.sqliteDb.pragma("journal_mode = WAL");

    // Reduced durability for speed (DEVELOPMENT ONLY!)
    this.sqliteDb.pragma("synchronous = OFF");

    // Increase cache size (10MB)
    this.sqliteDb.pragma("cache_size = 10000");

    // Use memory for temporary storage
    this.sqliteDb.pragma("temp_store = MEMORY");

    // Disable automatic vacuuming during bulk inserts
    this.sqliteDb.pragma("auto_vacuum = NONE");

    logger.info("✅ Performance optimizations applied");
  }

  /**
   * Restore safe production settings
   */
  private restoreProductionMode(): void {
    logger.info("🔒 Restoring production safety mode...");

    this.sqliteDb.pragma("synchronous = FULL");
    this.sqliteDb.pragma("auto_vacuum = INCREMENTAL");

    logger.info("✅ Production settings restored");
  }

  /**
   * Optimize database after bulk insert
   */
  private optimizeDatabase(): void {
    logger.info("🔧 Optimizing database...");

    // Analyze tables for query optimization
    this.sqliteDb.prepare("ANALYZE").run();

    // Reclaim unused space
    this.sqliteDb.prepare("VACUUM").run();

    logger.info("✅ Database optimized");
  }
}
