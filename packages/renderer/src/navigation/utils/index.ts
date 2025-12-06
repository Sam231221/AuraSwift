export {
  LazyComponentLoader,
  componentCache,
  ComponentCache,
} from "./lazy-component-loader";
export { componentPreloader, usePreloadOnHover } from "./component-preloader";
export { mapActionToView, hasViewMapping } from "./navigation-mapper";
export {
  performanceMonitor,
  type ComponentLoadMetric,
  type CacheMetrics,
  type PerformanceMetrics,
} from "./performance-monitor";
export { usePerformanceMetrics } from "./metrics-collector";
export { exposeMetricsToDevTools } from "./devtools-integration";
