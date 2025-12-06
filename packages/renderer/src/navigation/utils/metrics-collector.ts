import { useEffect, useRef } from "react";
import { performanceMonitor } from "./performance-monitor";

/**
 * Hook to collect and report performance metrics
 */
export function usePerformanceMetrics() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Report metrics every 30 seconds
    intervalRef.current = setInterval(() => {
      const metrics = performanceMonitor.getMetrics();
      const cacheHitRate = performanceMonitor.getCacheHitRate();

      // Send to main process (Electron)
      if (typeof window !== "undefined" && (window as any).electron?.ipc) {
        (window as any).electron.ipc.send("performance-summary", {
          ...metrics,
          cacheHitRate,
          timestamp: Date.now(),
        });
      }
    }, 30000); // Every 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    getMetrics: () => performanceMonitor.getMetrics(),
    getCacheHitRate: () => performanceMonitor.getCacheHitRate(),
    exportMetrics: () => performanceMonitor.exportMetrics(),
  };
}
