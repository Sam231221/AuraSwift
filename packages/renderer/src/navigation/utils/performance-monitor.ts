import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("performance-monitor");

export interface ComponentLoadMetric {
  viewId: string;
  loadTime: number;
  success: boolean;
  cached: boolean;
  retries: number;
  error?: string;
  timestamp: number;
  chunkSize?: number;
  source: "memory" | "disk" | "network";
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
}

export interface PerformanceMetrics {
  componentLoads: ComponentLoadMetric[];
  cacheMetrics: CacheMetrics;
  errorRate: number;
  averageLoadTime: number;
  p95LoadTime: number;
  p99LoadTime: number;
}

class PerformanceMonitor {
  private metrics: ComponentLoadMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private cacheHits = 0;
  private cacheMisses = 0;
  private cacheEvictions = 0;

  /**
   * Record a component load metric
   */
  recordLoad(metric: ComponentLoadMetric): void {
    // Add to metrics array
    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Update cache stats
    if (metric.cached) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    // Log for debugging
    logger.debug(`Component load: ${metric.viewId}`, {
      loadTime: `${metric.loadTime.toFixed(2)}ms`,
      cached: metric.cached,
      source: metric.source,
    });

    // Performance API mark
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(`component-load-${metric.viewId}`, {
        detail: metric,
      });
    }

    // Send to analytics if available (Electron IPC)
    this.sendToAnalytics(metric);
  }

  /**
   * Record cache eviction
   */
  recordEviction(): void {
    this.cacheEvictions++;
  }

  /**
   * Get current metrics summary
   */
  getMetrics(): PerformanceMetrics {
    const successfulLoads = this.metrics.filter((m) => m.success);
    const loadTimes = successfulLoads.map((m) => m.loadTime);

    const sortedLoadTimes = [...loadTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedLoadTimes.length * 0.95);
    const p99Index = Math.floor(sortedLoadTimes.length * 0.99);

    return {
      componentLoads: this.metrics.slice(-100), // Last 100 for detailed view
      cacheMetrics: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        evictions: this.cacheEvictions,
        size: this.cacheHits + this.cacheMisses,
        maxSize: this.maxMetrics,
      },
      errorRate:
        this.metrics.filter((m) => !m.success).length / this.metrics.length ||
        0,
      averageLoadTime:
        loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length || 0,
      p95LoadTime: sortedLoadTimes[p95Index] || 0,
      p99LoadTime: sortedLoadTimes[p99Index] || 0,
    };
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? this.cacheHits / total : 0;
  }

  /**
   * Send metrics to analytics (Electron IPC)
   */
  private sendToAnalytics(metric: ComponentLoadMetric): void {
    // Electron: Send via IPC to main process
    if (typeof window !== "undefined" && (window as any).electron?.ipc) {
      (window as any).electron.ipc.send("performance-metric", metric);
    }

    // Or use custom analytics
    if (typeof window !== "undefined" && (window as any).analytics) {
      (window as any).analytics.track("component_load", metric);
    }
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.metrics = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.cacheEvictions = 0;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();
