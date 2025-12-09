/**
 * Database Performance Optimization for Bulk Operations
 * Configures SQLite for maximum insert performance
 */
import type Database from "better-sqlite3";
import { getLogger } from "./logger.js";

const logger = getLogger("db-performance");

export class DatabasePerformanceOptimizer {
  /**
   * Enable high-performance mode for bulk inserts
   * WARNING: This reduces durability - only use for development/testing
   */
  static enableBulkInsertMode(db: Database.Database): void {
    logger.info("🚀 Enabling bulk insert performance mode...");

    // WAL mode: Better concurrency and performance
    db.pragma("journal_mode = WAL");

    // Reduced durability for speed (DEVELOPMENT ONLY!)
    db.pragma("synchronous = OFF");

    // Increase cache size (10MB)
    db.pragma("cache_size = 10000");

    // Use memory for temporary storage
    db.pragma("temp_store = MEMORY");

    // Disable automatic vacuuming during bulk inserts
    db.pragma("auto_vacuum = NONE");

    logger.info("✅ Performance optimizations applied");
  }

  /**
   * Restore safe production settings
   */
  static restoreProductionMode(db: Database.Database): void {
    logger.info("🔒 Restoring production safety mode...");

    db.pragma("synchronous = FULL");
    db.pragma("auto_vacuum = INCREMENTAL");

    logger.info("✅ Production settings restored");
  }

  /**
   * Optimize database after bulk insert
   */
  static optimizeDatabase(db: Database.Database): void {
    logger.info("🔧 Optimizing database...");

    // Analyze tables for query optimization
    db.prepare("ANALYZE").run();

    // Reclaim unused space
    db.prepare("VACUUM").run();

    logger.info("✅ Database optimized");
  }
}
