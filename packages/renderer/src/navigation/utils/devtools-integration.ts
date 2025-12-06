import { performanceMonitor } from "./performance-monitor";

/**
 * Expose performance metrics to DevTools
 * Useful for debugging and monitoring
 */
export function exposeMetricsToDevTools(): void {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    (window as any).__PERFORMANCE_METRICS__ = {
      getMetrics: () => performanceMonitor.getMetrics(),
      getCacheHitRate: () => performanceMonitor.getCacheHitRate(),
      clearMetrics: () => performanceMonitor.clear(),
      exportMetrics: () => performanceMonitor.exportMetrics(),
    };

    // Intentional: Inform developers about available debugging tools
    // eslint-disable-next-line no-console
    console.log(
      "Performance metrics available in DevTools: window.__PERFORMANCE_METRICS__"
    );
  }
}
