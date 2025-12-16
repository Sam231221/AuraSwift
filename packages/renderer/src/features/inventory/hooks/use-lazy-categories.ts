/**
 * Lazy Category Loading Hook
 *
 * Implements on-demand loading of category hierarchies to improve performance
 * with large category trees (1000+ categories). Only loads categories as they
 * are expanded by the user, rather than loading all categories upfront.
 *
 * Features:
 * - Lazy loading: Load category children only when parent is expanded
 * - Caching: Store loaded categories to avoid redundant API calls
 * - Pagination: Support for paginated category loading
 * - Optimistic updates: Immediate UI feedback with background refresh
 */

import { useState, useCallback, useEffect } from "react";
import type { Category } from "./use-product-data";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("use-lazy-categories");

interface CategoryCache {
  [parentId: string]: {
    categories: Category[];
    hasMore: boolean;
    page: number;
    timestamp: number;
  };
}

interface UseLazyCategoriesOptions {
  businessId: string;
  pageSize?: number;
  cacheTimeout?: number; // milliseconds
}

interface UseLazyCategoriesResult {
  // Root categories
  rootCategories: Category[];

  // Loading states
  loading: boolean;
  loadingParentId: string | null;

  // Load children for a specific parent
  loadChildren: (parentId: string | null) => Promise<Category[]>;

  // Get cached children for a parent
  getChildren: (parentId: string | null) => Category[];

  // Check if more pages available for a parent
  hasMore: (parentId: string | null) => boolean;

  // Load next page for a parent
  loadMore: (parentId: string | null) => Promise<Category[]>;

  // Refresh categories (invalidate cache)
  refresh: () => Promise<void>;

  // Check if children are loaded for a parent
  isLoaded: (parentId: string | null) => boolean;
}

const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PAGE_SIZE = 50;

/**
 * Hook for lazy loading categories on-demand
 *
 * @example
 * ```tsx
 * const {
 *   rootCategories,
 *   loadChildren,
 *   getChildren,
 *   isLoaded,
 * } = useLazyCategories({ businessId: user.businessId });
 *
 * // On initial render, rootCategories are loaded
 * // When user expands a category:
 * const handleExpand = async (categoryId: string) => {
 *   if (!isLoaded(categoryId)) {
 *     await loadChildren(categoryId);
 *   }
 * };
 * ```
 */
export function useLazyCategories({
  businessId,
  pageSize = DEFAULT_PAGE_SIZE,
  cacheTimeout = CACHE_TIMEOUT,
}: UseLazyCategoriesOptions): UseLazyCategoriesResult {
  const [cache, setCache] = useState<CategoryCache>({});
  const [loading, setLoading] = useState(false);
  const [loadingParentId, setLoadingParentId] = useState<string | null>(null);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback(
    (parentId: string | null): boolean => {
      const cacheKey = parentId || "root";
      const cached = cache[cacheKey];
      if (!cached) return false;

      const age = Date.now() - cached.timestamp;
      return age < cacheTimeout;
    },
    [cache, cacheTimeout]
  );

  /**
   * Get categories from cache
   */
  const getFromCache = useCallback(
    (parentId: string | null): Category[] => {
      const cacheKey = parentId || "root";
      return cache[cacheKey]?.categories || [];
    },
    [cache]
  );

  /**
   * Update cache with new categories
   */
  const updateCache = useCallback(
    (
      parentId: string | null,
      categories: Category[],
      page: number,
      hasMore: boolean
    ) => {
      const cacheKey = parentId || "root";
      setCache((prev) => ({
        ...prev,
        [cacheKey]: {
          categories,
          hasMore,
          page,
          timestamp: Date.now(),
        },
      }));
    },
    []
  );

  /**
   * Load children for a specific parent (or root categories if parentId is null)
   */
  const loadChildren = useCallback(
    async (parentId: string | null): Promise<Category[]> => {
      const cacheKey = parentId || "root";

      // Return cached data if valid
      if (isCacheValid(parentId)) {
        logger.debug(`Using cached categories for parent: ${cacheKey}`);
        return getFromCache(parentId);
      }

      logger.debug(`Loading categories for parent: ${cacheKey}`);
      setLoading(true);
      setLoadingParentId(parentId);

      try {
        const response = await window.categoryAPI.getChildren(
          businessId,
          parentId,
          { page: 1, pageSize }
        );

        if (response.success && response.data) {
          const categories = response.data.items;
          const hasMore = response.data.pagination.hasMore;

          updateCache(parentId, categories, 1, hasMore);

          // Update root categories if loading root level
          if (parentId === null) {
            setRootCategories(categories);
          }

          logger.debug(
            `Loaded ${categories.length} categories for parent: ${cacheKey}`
          );
          return categories;
        }

        logger.error("Failed to load categories:", response.error);
        return [];
      } catch (error) {
        logger.error("Error loading categories:", error);
        return [];
      } finally {
        setLoading(false);
        setLoadingParentId(null);
      }
    },
    [businessId, pageSize, isCacheValid, getFromCache, updateCache]
  );

  /**
   * Load next page for a parent
   */
  const loadMore = useCallback(
    async (parentId: string | null): Promise<Category[]> => {
      const cacheKey = parentId || "root";
      const cached = cache[cacheKey];

      if (!cached || !cached.hasMore) {
        logger.debug(`No more categories to load for parent: ${cacheKey}`);
        return cached?.categories || [];
      }

      logger.debug(`Loading more categories for parent: ${cacheKey}`);
      setLoading(true);
      setLoadingParentId(parentId);

      try {
        const nextPage = cached.page + 1;
        const response = await window.categoryAPI.getChildren(
          businessId,
          parentId,
          { page: nextPage, pageSize }
        );

        if (response.success && response.data) {
          const newCategories = response.data.items;
          const allCategories = [...cached.categories, ...newCategories];
          const hasMore = response.data.pagination.hasMore;

          updateCache(parentId, allCategories, nextPage, hasMore);

          // Update root categories if loading root level
          if (parentId === null) {
            setRootCategories(allCategories);
          }

          logger.debug(
            `Loaded ${newCategories.length} more categories for parent: ${cacheKey}`
          );
          return allCategories;
        }

        logger.error("Failed to load more categories:", response.error);
        return cached.categories;
      } catch (error) {
        logger.error("Error loading more categories:", error);
        return cached.categories;
      } finally {
        setLoading(false);
        setLoadingParentId(null);
      }
    },
    [businessId, pageSize, cache, updateCache]
  );

  /**
   * Get children from cache (non-async version)
   */
  const getChildren = useCallback(
    (parentId: string | null): Category[] => {
      return getFromCache(parentId);
    },
    [getFromCache]
  );

  /**
   * Check if more categories available for a parent
   */
  const hasMore = useCallback(
    (parentId: string | null): boolean => {
      const cacheKey = parentId || "root";
      return cache[cacheKey]?.hasMore || false;
    },
    [cache]
  );

  /**
   * Check if children are loaded for a parent
   */
  const isLoaded = useCallback(
    (parentId: string | null): boolean => {
      const cacheKey = parentId || "root";
      return Boolean(cache[cacheKey]);
    },
    [cache]
  );

  /**
   * Refresh all categories (invalidate cache)
   */
  const refresh = useCallback(async () => {
    logger.debug("Refreshing categories - clearing cache");
    setCache({});
    await loadChildren(null);
  }, [loadChildren]);

  // Load root categories on mount
  useEffect(() => {
    if (businessId && rootCategories.length === 0 && !loading) {
      loadChildren(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]); // Only run on businessId change to avoid infinite loops

  return {
    rootCategories,
    loading,
    loadingParentId,
    loadChildren,
    getChildren,
    hasMore,
    loadMore,
    refresh,
    isLoaded,
  };
}
