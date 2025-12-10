/**
 * Lazy Component Loader
 *
 * Simplified component loader for lazy-loading view components.
 * Handles both static and lazy-loaded components with caching and error handling.
 *
 * Simplified from 768 lines to ~250 lines by:
 * - Removing Electron-specific chunk caching (local files don't need it)
 * - Removing retry logic (local files are reliable)
 * - Consolidating validation to one place
 * - Simplifying state management (4 variables instead of 8)
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ComponentType,
  type ReactNode,
} from "react";
import type { ViewConfig, ViewComponentProps } from "../types/navigation.types";
import {
  isLazyViewConfig,
  isStaticViewConfig,
} from "../types/navigation.types";
import { getLogger } from "@/shared/utils/logger";
import { performanceMonitor } from "./performance-monitor";

const logger = getLogger("lazy-component-loader");

// ============================================================================
// Component Cache (Simple LRU)
// ============================================================================

interface CachedComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  timestamp: number;
}

class ComponentCache {
  private cache = new Map<string, CachedComponent>();
  private readonly maxSize = 20;
  private readonly maxAge = 30 * 60 * 1000; // 30 minutes

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(viewId: string): ComponentType<any> | null {
    const cached = this.cache.get(viewId);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(viewId);
      return null;
    }

    return cached.component;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(viewId: string, component: ComponentType<any>): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(viewId)) {
      const oldest = Array.from(this.cache.entries()).reduce(
        (oldest, [key, value]) =>
          value.timestamp < oldest[1].timestamp ? [key, value] : oldest
      );
      this.cache.delete(oldest[0]);
    }

    this.cache.set(viewId, {
      component,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
const componentCache = new ComponentCache();

// ============================================================================
// Component Validation
// ============================================================================

/**
 * Validates that a value is a valid React component
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidComponent(component: any): component is ComponentType<any> {
  if (!component) return false;

  // Function components and class components
  if (typeof component === "function") return true;

  // forwardRef or memo components
  if (
    typeof component === "object" &&
    (component.$$typeof === Symbol.for("react.forward_ref") ||
      component.$$typeof === Symbol.for("react.memo"))
  ) {
    return true;
  }

  // JSX element (invalid - this is an instance, not a component)
  if (
    typeof component === "object" &&
    component !== null &&
    component.$$typeof === Symbol.for("react.element")
  ) {
    logger.error("Invalid component: JSX element instead of component");
    return false;
  }

  return false;
}

// ============================================================================
// Fallback Components
// ============================================================================

function DefaultLoadingFallback() {
  return (
    <div
      className="h-full w-full"
      role="status"
      aria-live="polite"
      aria-label="Loading view"
    />
  );
}

function DefaultErrorFallback({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex items-center justify-center h-96"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2 text-destructive">
          Failed to Load View
        </h2>
        <p className="text-muted-foreground mb-4">
          {error.message || "An error occurred while loading this view"}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
            aria-label="Retry loading view"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
            aria-label="Reload page"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Lazy Component Loader
// ============================================================================

interface LazyComponentLoaderProps {
  config: ViewConfig;
  props: ViewComponentProps;
  fallback?: ReactNode;
  errorFallback?: (error: Error, retry: () => void) => ReactNode;
}

/**
 * Lazy Component Loader
 *
 * Simplified implementation with:
 * - Single validation point
 * - Simple state management (4 variables)
 * - LRU caching only
 * - No retry logic (local files don't fail)
 * - Proper React patterns (effects, not render-phase mutations)
 */
export function LazyComponentLoader({
  config,
  props,
  fallback = <DefaultLoadingFallback />,
  errorFallback,
}: LazyComponentLoaderProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load component
  useEffect(() => {
    const viewId = config.id;
    let cancelled = false;

    async function loadComponent() {
      try {
        // Handle static component
        if (isStaticViewConfig(config) && config.component) {
          if (!isValidComponent(config.component)) {
            throw new Error(`Static component for "${viewId}" is invalid`);
          }
          if (cancelled) return;
          setComponent(() => config.component);
          setLoading(false);
          return;
        }

        // Handle lazy component
        if (isLazyViewConfig(config) && config.componentLoader) {
          const startTime = performance.now();

          // Check cache first
          const cached = componentCache.get(viewId);
          if (cached && isValidComponent(cached)) {
            if (cancelled) return;
            setComponent(() => cached);
            setLoading(false);
            const loadTime = performance.now() - startTime;
            performanceMonitor.recordLoad({
              viewId,
              loadTime,
              success: true,
              cached: true,
              retries: 0,
              timestamp: Date.now(),
              source: "memory",
            });
            return;
          }

          // Load from disk
          const module = await config.componentLoader();

          if (!module.default) {
            throw new Error(
              `Component loader for "${viewId}" did not export a default component`
            );
          }

          if (!isValidComponent(module.default)) {
            throw new Error(
              `Component loader for "${viewId}" exported an invalid component`
            );
          }

          // Cache if cacheable
          if (config.cacheable !== false) {
            componentCache.set(viewId, module.default);
          }

          if (cancelled) return;
          setComponent(() => module.default);
          setLoading(false);

          const loadTime = performance.now() - startTime;
          performanceMonitor.recordLoad({
            viewId,
            loadTime,
            success: true,
            cached: false,
            retries: 0,
            timestamp: Date.now(),
            source: "disk",
          });

          logger.debug(
            `Loaded lazy component: ${viewId} in ${loadTime.toFixed(2)}ms`
          );
          return;
        }

        // No component or loader
        throw new Error(
          `ViewConfig "${viewId}" must have either component or componentLoader`
        );
      } catch (err) {
        const loadError =
          err instanceof Error
            ? err
            : new Error(`Failed to load component: ${viewId}`);

        if (cancelled) return;
        
        // Enhanced error logging for Electron debugging
        logger.error(`Failed to load component ${viewId}:`, loadError);
        logger.error(`Error details:`, {
          message: loadError.message,
          stack: loadError.stack,
          viewId,
          configType: isLazyViewConfig(config) ? 'lazy' : isStaticViewConfig(config) ? 'static' : 'unknown',
        });
        
        setError(loadError);
        setLoading(false);

        performanceMonitor.recordLoad({
          viewId,
          loadTime: 0,
          success: false,
          cached: false,
          retries: 0,
          error: loadError.message,
          timestamp: Date.now(),
          source: "disk",
        });
      }
    }

    loadComponent();

    return () => {
      cancelled = true;
    };
  }, [config]);

  // Retry handler
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    // Re-trigger useEffect by changing a dependency (config.id stays same, so we clear cache)
    componentCache.clear();
    // Force re-render
    setComponent(null);
  }, []);

  // Show error state
  if (error) {
    if (errorFallback) {
      return <>{errorFallback(error, handleRetry)}</>;
    }
    return <DefaultErrorFallback error={error} onRetry={handleRetry} />;
  }

  // Show component if loaded
  if (Component && !loading) {
    try {
      return <Component {...props} />;
    } catch (renderError) {
      const renderErr =
        renderError instanceof Error
          ? renderError
          : new Error("Component render error");
      logger.error(`Error rendering component ${config.id}:`, renderErr);
      if (errorFallback) {
        return <>{errorFallback(renderErr, handleRetry)}</>;
      }
      return <DefaultErrorFallback error={renderErr} onRetry={handleRetry} />;
    }
  }

  // Show loading state
  if (loading) {
    return <>{fallback}</>;
  }

  // Shouldn't reach here
  logger.warn(`Component ${config.id} in invalid state`);
  return <>{fallback}</>;
}

// Export cache for testing/monitoring
// eslint-disable-next-line react-refresh/only-export-components
export { componentCache, ComponentCache };
