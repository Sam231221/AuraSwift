/**
 * Simple In-Memory Cache with TTL Support
 *
 * Designed for Electron desktop apps - no external dependencies.
 * Provides basic caching for IPC results to reduce repeated calls
 * for the same data (e.g., paginated products, category children).
 *
 * Key features:
 * - Time-to-live (TTL) for automatic expiration
 * - Pattern-based invalidation for cache busting
 * - Singleton instances for different data domains
 * - Type-safe with generics
 *
 * Why not use TanStack Query / React Query?
 * - Those are designed for HTTP/network requests with retry, refetch, etc.
 * - IPC calls to local SQLite are <1ms - no need for that complexity
 * - Adds ~40KB+ to bundle vs this <1KB solution
 */

import { getLogger } from "./logger";
const logger = getLogger("simple-cache");

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Simple cache with TTL support
 * @template T - Type of cached data
 */
export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private name: string;

  /**
   * Create a new cache instance
   * @param name - Cache name for logging
   * @param defaultTTL - Time to live in milliseconds (default: 5 minutes)
   */
  constructor(name: string, defaultTTL: number = 5 * 60 * 1000) {
    this.name = name;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get a value from cache
   * Returns undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.debug(`[${this.name}] Cache expired: ${key}`);
      return undefined;
    }

    logger.debug(`[${this.name}] Cache hit: ${key}`);
    return entry.data;
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Optional TTL override in milliseconds
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (ttl ?? this.defaultTTL),
    });
    logger.debug(`[${this.name}] Cache set: ${key}`);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Invalidate a specific key
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`[${this.name}] Cache invalidated: ${key}`);
    }
  }

  /**
   * Invalidate all keys matching a pattern
   * @param pattern - Regex pattern string to match keys
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      logger.debug(
        `[${this.name}] Invalidated ${count} entries matching: ${pattern}`
      );
    }
  }

  /**
   * Invalidate all keys starting with a prefix
   * @param prefix - Key prefix to match
   */
  invalidatePrefix(prefix: string): void {
    let count = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      logger.debug(
        `[${this.name}] Invalidated ${count} entries with prefix: ${prefix}`
      );
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.debug(`[${this.name}] Cache cleared (${size} entries)`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   * Call periodically to prevent memory buildup
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`[${this.name}] Cleaned up ${cleaned} expired entries`);
    }

    return cleaned;
  }
}

// ============================================================================
// SINGLETON CACHE INSTANCES
// ============================================================================

/**
 * Product cache - 5 minute TTL
 * Used for paginated product queries
 */
export const productCache = new SimpleCache<unknown>("products", 5 * 60 * 1000);

/**
 * Category cache - 10 minute TTL
 * Categories change less frequently than products
 */
export const categoryCache = new SimpleCache<unknown>(
  "categories",
  10 * 60 * 1000
);

/**
 * Inventory Product Cache - 5 minute TTL
 * Specialized cache for inventory management product lists
 * Separate from sales cache to prevent invalidation conflicts
 */
export const inventoryProductCache = new SimpleCache<unknown>(
  "inventory-products",
  5 * 60 * 1000
);

/**
 * Inventory Category Cache - 10 minute TTL
 * Specialized cache for inventory management category trees
 * Longer TTL since categories are managed explicitly
 */
export const inventoryCategoryCache = new SimpleCache<unknown>(
  "inventory-categories",
  10 * 60 * 1000
);

/**
 * Product Stats Cache - 1 minute TTL
 * Short TTL since stats need to be fresh for dashboard
 */
export const productStatsCache = new SimpleCache<unknown>(
  "product-stats",
  1 * 60 * 1000
);

// ============================================================================
// CACHE KEY HELPERS
// ============================================================================

/**
 * Generate cache key for paginated product queries
 */
export function getProductCacheKey(
  businessId: string,
  page: number,
  pageSize: number,
  categoryId?: string,
  searchTerm?: string
): string {
  const parts = [
    "products",
    businessId,
    `p${page}`,
    `s${pageSize}`,
    categoryId || "all",
    searchTerm ? `q${searchTerm}` : "",
  ].filter(Boolean);

  return parts.join(":");
}

/**
 * Generate cache key for category children queries
 */
export function getCategoryCacheKey(
  businessId: string,
  parentId: string | null,
  page: number = 1
): string {
  return `categories:${businessId}:${parentId ?? "root"}:p${page}`;
}

/**
 * Invalidate all product caches for a business
 * Call after product create/update/delete
 */
export function invalidateProductCache(businessId: string): void {
  productCache.invalidatePrefix(`products:${businessId}`);
}

/**
 * Invalidate all category caches for a business
 * Call after category create/update/delete
 */
export function invalidateCategoryCache(businessId: string): void {
  categoryCache.invalidatePrefix(`categories:${businessId}`);
  inventoryCategoryCache.invalidatePrefix(`categories:${businessId}`);
}

/**
 * Invalidate inventory-specific caches
 * Call after product/category mutations in inventory management
 */
export function invalidateInventoryCache(businessId: string): void {
  inventoryProductCache.invalidatePrefix(`products:${businessId}`);
  inventoryCategoryCache.invalidatePrefix(`categories:${businessId}`);
  productStatsCache.invalidatePrefix(`stats:${businessId}`);
}

/**
 * Invalidate product stats cache
 * Call after any product mutation that affects counts/totals
 */
export function invalidateProductStatsCache(businessId: string): void {
  productStatsCache.invalidatePrefix(`stats:${businessId}`);
}

/**
 * Generate cache key for product stats
 */
export function getProductStatsCacheKey(businessId: string): string {
  return `stats:${businessId}`;
}

/**
 * Invalidate all caches for a business
 * Call after major data changes (e.g., import)
 */
export function invalidateAllCaches(businessId: string): void {
  invalidateProductCache(businessId);
  invalidateCategoryCache(businessId);
  invalidateInventoryCache(businessId);
}

// ============================================================================
// CACHE CLEANUP
// ============================================================================

// Run cleanup every 5 minutes to prevent memory buildup
const CLEANUP_INTERVAL = 5 * 60 * 1000;

let cleanupIntervalId: NodeJS.Timeout | null = null;

/**
 * Start periodic cache cleanup
 */
export function startCacheCleanup(): void {
  if (cleanupIntervalId) return;

  cleanupIntervalId = setInterval(() => {
    productCache.cleanup();
    categoryCache.cleanup();
    inventoryProductCache.cleanup();
    inventoryCategoryCache.cleanup();
    productStatsCache.cleanup();
  }, CLEANUP_INTERVAL);

  logger.info("Cache cleanup started");
}

/**
 * Stop periodic cache cleanup
 */
export function stopCacheCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    logger.info("Cache cleanup stopped");
  }
}
