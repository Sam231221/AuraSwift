/**
 * Sales Unit Settings Hook
 *
 * Manages sales unit settings with caching, invalidation, and event system
 * for robust, scalable settings management.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { getLogger } from "@/shared/utils/logger";
import type {
  SalesUnitSettings,
  SalesUnitMode,
  SalesUnit,
} from "@/types/domain/sales-unit";
import {
  DEFAULT_SALES_UNIT_MODE as DEFAULT_MODE,
  DEFAULT_FIXED_SALES_UNIT as DEFAULT_FIXED,
  DEFAULT_PRODUCT_SALES_UNIT as DEFAULT_PRODUCT,
  isValidSalesUnitMode,
  isValidSalesUnit,
} from "@/types/domain/sales-unit";

const logger = getLogger("use-sales-unit-settings");

// Global cache to share settings across all hook instances
let globalCache: SalesUnitSettings | null = null;
const cacheListeners: Set<() => void> = new Set();
let isLoading = false;
let loadPromise: Promise<SalesUnitSettings> | null = null;

/**
 * Load settings from database with validation
 */
async function loadSettings(businessId: string): Promise<SalesUnitSettings> {
  try {
    const response = await window.salesUnitSettingsAPI.get(businessId);

    if (!response.success || !response.settings) {
      throw new Error(response.message || "Failed to load settings");
    }

    const settings = response.settings;
    const mode: SalesUnitMode = isValidSalesUnitMode(
      settings.salesUnitMode || ""
    )
      ? settings.salesUnitMode
      : DEFAULT_MODE;

    const fixedUnit: SalesUnit = isValidSalesUnit(settings.fixedSalesUnit || "")
      ? settings.fixedSalesUnit
      : DEFAULT_FIXED;

    return {
      mode,
      fixedUnit,
      isLoading: false,
      error: null,
    };
  } catch (error) {
    logger.error("Error loading sales unit settings:", error);
    const err = error instanceof Error ? error : new Error("Unknown error");
    return {
      mode: DEFAULT_MODE,
      fixedUnit: DEFAULT_FIXED,
      isLoading: false,
      error: err,
    };
  }
}

/**
 * Invalidate the global cache and reload settings
 */
export async function invalidateSalesUnitSettingsCache(
  businessId: string
): Promise<void> {
  globalCache = null;
  isLoading = false;
  loadPromise = null;

  // Notify all listeners to reload with the new businessId
  // The listeners will use their own businessId from their hook instance
  cacheListeners.forEach((listener) => listener());

  // Suppress unused parameter warning - businessId is kept for API consistency
  void businessId;
}

/**
 * Hook to get sales unit settings
 *
 * Features:
 * - Shared cache across all instances
 * - Automatic cache invalidation on changes
 * - Error handling and validation
 * - Loading states
 *
 * @param businessId - Business ID to load settings for
 * @example
 * ```tsx
 * const { mode, fixedUnit, isLoading, error } = useSalesUnitSettings(businessId);
 * ```
 */
export function useSalesUnitSettings(
  businessId: string | undefined
): SalesUnitSettings {
  const [settings, setSettings] = useState<SalesUnitSettings>(() => {
    // Initialize from cache if available
    if (globalCache) {
      return globalCache;
    }
    return {
      mode: DEFAULT_MODE,
      fixedUnit: DEFAULT_FIXED,
      isLoading: true,
      error: null,
    };
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Listener for cache invalidation
  const handleCacheInvalidation = useCallback(() => {
    if (!isMountedRef.current || !businessId) return;

    // Reload settings
    if (loadPromise) {
      loadPromise.then((newSettings) => {
        if (isMountedRef.current) {
          setSettings(newSettings);
        }
      });
    } else {
      loadSettings(businessId).then((newSettings) => {
        if (isMountedRef.current) {
          globalCache = newSettings;
          setSettings(newSettings);
        }
      });
    }
  }, [businessId]);

  useEffect(() => {
    // Register cache listener
    cacheListeners.add(handleCacheInvalidation);

    // Load settings if not cached and businessId is available
    if (businessId && !globalCache && !isLoading && !loadPromise) {
      isLoading = true;
      loadPromise = loadSettings(businessId)
        .then((loadedSettings) => {
          globalCache = loadedSettings;
          isLoading = false;
          loadPromise = null;

          if (isMountedRef.current) {
            setSettings(loadedSettings);
          }

          return loadedSettings;
        })
        .catch((error) => {
          logger.error("Failed to load settings:", error);
          isLoading = false;
          loadPromise = null;

          const errorSettings: SalesUnitSettings = {
            mode: DEFAULT_MODE,
            fixedUnit: DEFAULT_FIXED,
            isLoading: false,
            error:
              error instanceof Error
                ? error
                : new Error("Failed to load settings"),
          };

          if (isMountedRef.current) {
            setSettings(errorSettings);
          }

          return errorSettings;
        });
    } else if (globalCache) {
      // Use cached settings
      setSettings(globalCache);
    }

    return () => {
      cacheListeners.delete(handleCacheInvalidation);
    };
  }, [handleCacheInvalidation, businessId]);

  return settings;
}

/**
 * Get the effective sales unit for a product based on settings
 *
 * @param productSalesUnit - The product's own sales unit
 * @param settings - The current sales unit settings
 * @returns The effective sales unit to use
 */
export function getEffectiveSalesUnit(
  productSalesUnit: string | undefined,
  settings: SalesUnitSettings
): SalesUnit {
  // During loading, use product's unit as fallback
  if (settings.isLoading) {
    return (
      isValidSalesUnit(productSalesUnit || "")
        ? productSalesUnit
        : DEFAULT_PRODUCT
    ) as SalesUnit;
  }

  // If there's an error, use product's unit
  if (settings.error) {
    return (
      isValidSalesUnit(productSalesUnit || "")
        ? productSalesUnit
        : DEFAULT_PRODUCT
    ) as SalesUnit;
  }

  // Use fixed unit if mode is Fixed
  if (settings.mode === "Fixed") {
    return settings.fixedUnit;
  }

  // Use product's own unit when mode is Varying
  return (
    isValidSalesUnit(productSalesUnit || "")
      ? productSalesUnit
      : DEFAULT_PRODUCT
  ) as SalesUnit;
}
