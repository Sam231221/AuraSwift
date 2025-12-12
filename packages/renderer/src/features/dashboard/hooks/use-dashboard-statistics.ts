/**
 * useDashboardStatistics Hook
 *
 * Hook for fetching dashboard statistics including revenue, sales count, and other metrics.
 * Provides caching and automatic refresh.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/shared/hooks";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("use-dashboard-statistics");

interface DashboardStatistics {
  revenue: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  salesToday: number;
  averageOrderValue: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
}

interface UseDashboardStatisticsReturn {
  statistics: DashboardStatistics | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache (reduced for more frequent updates)
let statisticsCache: {
  data: DashboardStatistics;
  timestamp: number;
  businessId: string;
} | null = null;

// Store refetch callbacks to trigger refresh when cache is invalidated
const refetchCallbacks = new Set<() => void>();

/**
 * Invalidate dashboard statistics cache
 * Call this after creating/updating transactions to force refresh
 */
export function invalidateDashboardStatisticsCache(businessId?: string) {
  if (businessId) {
    if (statisticsCache?.businessId === businessId) {
      statisticsCache = null;
      // Trigger all registered refetch callbacks
      refetchCallbacks.forEach((callback) => callback());
    }
  } else {
    statisticsCache = null;
    // Trigger all registered refetch callbacks
    refetchCallbacks.forEach((callback) => callback());
  }
}

// Expose cache invalidation globally for use in transaction hooks
if (typeof window !== "undefined") {
  (
    window as typeof window & {
      invalidateDashboardCache?: typeof invalidateDashboardStatisticsCache;
    }
  ).invalidateDashboardCache = invalidateDashboardStatisticsCache;
}

export function useDashboardStatistics(): UseDashboardStatisticsReturn {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!user?.businessId) {
      setStatistics(null);
      setIsLoading(false);
      setError(null);
      statisticsCache = null;
      return;
    }

    // Check cache first
    if (
      statisticsCache &&
      statisticsCache.businessId === user.businessId &&
      Date.now() - statisticsCache.timestamp < CACHE_TTL_MS
    ) {
      logger.info(
        `[useDashboardStatistics] Using cached statistics for business ${user.businessId}`
      );
      setStatistics(statisticsCache.data);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const sessionToken = await window.authStore.get("token");
      if (!sessionToken) {
        setStatistics(null);
        setIsLoading(false);
        return;
      }

      if (!window.dashboardAPI) {
        throw new Error("Dashboard API not available");
      }

      const response = await window.dashboardAPI.getStatistics(
        sessionToken,
        user.businessId
      );

      if (response.success && response.data) {
        setStatistics(response.data);

        // Update cache
        statisticsCache = {
          data: response.data,
          timestamp: Date.now(),
          businessId: user.businessId,
        };

        logger.info(
          `[useDashboardStatistics] Loaded statistics for business ${user.businessId}`
        );
      } else {
        throw new Error(
          response.message || "Failed to load dashboard statistics"
        );
      }
    } catch (err) {
      logger.error("[useDashboardStatistics] Failed to load statistics:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to load dashboard statistics")
      );
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Register refetch callback for cache invalidation
  useEffect(() => {
    refetchCallbacks.add(fetchStatistics);
    return () => {
      refetchCallbacks.delete(fetchStatistics);
    };
  }, [fetchStatistics]);

  // Clear cache when business changes
  useEffect(() => {
    if (!user?.businessId) {
      statisticsCache = null;
      setStatistics(null);
    }
  }, [user?.businessId]);

  return {
    statistics,
    isLoading,
    error,
    refetch: fetchStatistics,
  };
}
