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
// Component Cache (LRU Implementation)
// ============================================================================

interface CachedComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  timestamp: number;
  accessCount: number;
}

class ComponentCache {
  private cache = new Map<string, CachedComponent>();
  private readonly maxSize: number;
  private readonly maxAge: number; // milliseconds
  private logger = getLogger("component-cache");

  constructor(maxSize = 20, maxAge = 30 * 60 * 1000) {
    // 30 minutes default
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(viewId: string): ComponentType<any> | null {
    const cached = this.cache.get(viewId);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(viewId);
      return null;
    }

    // Update access info (LRU)
    cached.accessCount++;
    cached.timestamp = Date.now();
    return cached.component;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(viewId: string, component: ComponentType<any>): void {
    // Safety check: never cache non-function components
    if (typeof component !== "function") {
      this.logger.error(
        `Attempted to cache invalid component for "${viewId}". Type: ${typeof component}. Skipping cache.`
      );
      return;
    }

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
      accessCount: 1,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Global component cache instance
const componentCache = new ComponentCache();

// ============================================================================
// Electron Session Cache Integration
// ============================================================================

/**
 * Electron-specific: Leverage Chromium's disk cache for chunk persistence
 * Similar to VS Code's approach - chunks cached on disk survive app restarts
 */
class ElectronChunkCache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private session: any | null = null;

  constructor() {
    // Get default session (Electron API)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).electron?.session) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.session = (window as any).electron.session;
    }
  }

  /**
   * Preload chunk into Electron's disk cache
   * This ensures chunks are cached on disk for instant loading
   */
  async preloadChunk(chunkPath: string): Promise<void> {
    if (!this.session) return;

    try {
      // Electron's session cache will automatically cache the chunk
      // when it's first loaded, but we can preload it
      const response = await fetch(chunkPath, { cache: "force-cache" });
      if (response.ok) {
        await response.text(); // Read to trigger cache
      }
    } catch {
      // Silently fail - chunk will load normally
    }
  }

  /**
   * Clear Electron session cache (useful for development)
   */
  async clearCache(): Promise<void> {
    if (!this.session) return;
    await this.session.clearCache();
  }
}

const electronChunkCache = new ElectronChunkCache();

// ============================================================================
// Retry Mechanism with Exponential Backoff
// ============================================================================

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

/**
 * Electron-optimized: Simplified retry for local file system
 * Local files rarely fail, so we use minimal retries
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Electron: Local files are reliable, use fewer retries
  const {
    maxRetries = 1,
    initialDelay = 100,
    maxDelay = 500,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Electron: Only retry on actual file system errors
      if (attempt < maxRetries && error instanceof Error) {
        logger.warn(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
          lastError
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw lastError || new Error("Retry failed");
}

// ============================================================================
// Component Validation
// ============================================================================

/**
 * Validates that a value is a valid React component (function or class)
 * and not a JSX element or other invalid type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidComponent(component: any): component is ComponentType<any> {
  if (!component) return false;

  // Check if it's a function (function component)
  if (typeof component === "function") return true;

  // Check if it's a class (class component)
  if (
    typeof component === "object" &&
    component.prototype &&
    typeof component.prototype.render === "function"
  ) {
    return true;
  }

  // Check if it's a forwardRef or memo component
  if (
    typeof component === "object" &&
    (component.$$typeof === Symbol.for("react.forward_ref") ||
      component.$$typeof === Symbol.for("react.memo"))
  ) {
    return true;
  }

  // Check if it's a JSX element (React element has $$typeof === Symbol.for('react.element'))
  // This is NOT a valid component
  if (
    typeof component === "object" &&
    component !== null &&
    component.$$typeof === Symbol.for("react.element")
  ) {
    logger.error(
      `Invalid component detected: JSX element instead of component. Type: ${component.type}`
    );
    return false;
  }

  return false;
}

// ============================================================================
// Component Loader
// ============================================================================

interface LazyComponentLoaderProps {
  config: ViewConfig;
  props: ViewComponentProps;
  fallback?: ReactNode;
  errorFallback?: (error: Error, retry: () => void) => ReactNode;
}

/**
 * Minimal loading fallback - plain like VS Code
 * No spinner, no text - just blank space
 */
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

/**
 * Accessible error fallback with retry functionality
 */
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

/**
 * Production-ready Lazy Component Loader
 *
 * Features:
 * - Component caching (LRU) to prevent re-loading
 * - Retry mechanism with exponential backoff
 * - Performance metrics collection
 * - Memory leak prevention
 * - Accessibility-first design
 */
export function LazyComponentLoader({
  config,
  props,
  fallback = <DefaultLoadingFallback />,
  errorFallback,
}: LazyComponentLoaderProps) {
  // Initialize state intelligently - check cache/static component immediately
  const getInitialState = () => {
    const viewId = config.id;

    // Check if static component
    if (isStaticViewConfig(config) && config.component) {
      return {
        component: config.component,
        loading: false,
        error: null as Error | null,
      };
    }

    // Check if cached
    if (isLazyViewConfig(config)) {
      const cached = componentCache.get(viewId);
      if (cached) {
        return {
          component: cached,
          loading: false,
          error: null as Error | null,
        };
      }
    }

    // Otherwise, start loading
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component: null as ComponentType<any> | null,
      loading: true,
      error: null as Error | null,
    };
  };

  const initialState = getInitialState();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Component, setComponent] = useState<ComponentType<any> | null>(
    initialState.component
  );
  const [error, setError] = useState<Error | null>(initialState.error);
  const [loading, setLoading] = useState(initialState.loading);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const loadedViewIdRef = useRef<string | null>(
    initialState.component ? config.id : null
  );
  const hasTriggeredLoad = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const loadComponent = useCallback(
    async (viewConfig: ViewConfig, retries = 0): Promise<void> => {
      const viewId = viewConfig.id; // Extract id early to avoid type narrowing issues

      // Handle static component
      if (isStaticViewConfig(viewConfig) && viewConfig.component) {
        // Validate static component
        if (!isValidComponent(viewConfig.component)) {
          throw new Error(
            `Static component for "${viewId}" is invalid. Expected a function or class component.`
          );
        }
        if (!mountedRef.current) return;
        setComponent(() => viewConfig.component);
        setLoading(false);
        setError(null);
        loadedViewIdRef.current = viewId;
        return;
      }

      // Handle lazy-loaded component
      if (isLazyViewConfig(viewConfig) && viewConfig.componentLoader) {
        const startTime = performance.now();

        // Check cache first
        const cached = componentCache.get(viewId);
        if (cached) {
          // Validate cached component before using it
          if (!isValidComponent(cached)) {
            logger.warn(
              `Cached component for "${viewId}" is invalid, clearing cache and reloading`
            );
            componentCache.clear(); // Clear entire cache to prevent other corrupted entries
            // Fall through to load fresh component
          } else {
            if (!mountedRef.current) return;
            setComponent(() => cached);
            setLoading(false);
            setError(null);
            loadedViewIdRef.current = viewId;
            const loadTime = performance.now() - startTime;
            performanceMonitor.recordLoad({
              viewId,
              loadTime,
              success: true,
              cached: true,
              retries,
              timestamp: Date.now(),
              source: "memory",
            });
            return;
          }
        }

        try {
          // Electron: Load from local file system (instant, no network)
          // Minimal retry needed for local files
          const module = await retryWithBackoff(
            () => viewConfig.componentLoader!(),
            {
              maxRetries: 1, // Local files rarely fail
              initialDelay: 50, // Fast retry for local files
            }
          );

          if (!module.default) {
            throw new Error(
              `Component loader for "${viewId}" did not export a default component`
            );
          }

          // Log what we got for debugging
          logger.debug(
            `Loaded module for ${viewId}: type=${typeof module.default}, isFunction=${
              typeof module.default === "function"
            }, keys=${Object.keys(module).join(", ")}`
          );

          // Validate that the component is actually a component, not a JSX element
          if (!isValidComponent(module.default)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const constructorName = (module.default as any)?.constructor?.name;
            throw new Error(
              `Component loader for "${viewId}" exported an invalid component. Expected a function or class component, but got: ${typeof module.default} (constructor: ${constructorName})`
            );
          }

          // Cache component if cacheable
          if (viewConfig.cacheable !== false) {
            componentCache.set(viewId, module.default);
          }

          if (!mountedRef.current) return;

          setComponent(() => module.default);
          setLoading(false);
          setError(null);
          setRetryCount(0);
          loadedViewIdRef.current = viewId;

          const loadTime = performance.now() - startTime;
          performanceMonitor.recordLoad({
            viewId,
            loadTime,
            success: true,
            cached: false,
            retries,
            timestamp: Date.now(),
            source: "disk",
          });

          logger.debug(
            `Successfully loaded lazy component: ${viewId} in ${loadTime.toFixed(
              2
            )}ms`
          );
        } catch (err) {
          const loadError =
            err instanceof Error
              ? err
              : new Error(`Failed to load component: ${viewId}`);

          if (!mountedRef.current) return;

          logger.error(`Failed to load lazy component ${viewId}:`, loadError);

          const loadTime = performance.now() - startTime;
          performanceMonitor.recordLoad({
            viewId,
            loadTime,
            success: false,
            cached: false,
            retries,
            error: loadError.message,
            timestamp: Date.now(),
            source: "disk",
          });

          setError(loadError);
          setLoading(false);
        }
        return;
      }

      // No component or loader provided
      const configError = new Error(
        `ViewConfig "${viewId}" must have either component or componentLoader`
      );
      logger.error(configError.message);
      if (!mountedRef.current) return;
      setError(configError);
      setLoading(false);
    },
    []
  );

  // CRITICAL FIX: Trigger load synchronously during render if needed
  // This approach doesn't rely on effects, which can be unreliable in StrictMode
  // Check if we need to load: component is null AND this specific view hasn't been loaded yet
  // Use loadedViewIdRef to check if THIS view was loaded, not just if we triggered any load
  const needsLoad =
    Component === null &&
    isLazyViewConfig(config) &&
    loadedViewIdRef.current !== config.id;

  if (needsLoad) {
    // Check cache first
    const cached = componentCache.get(config.id);
    if (cached && isValidComponent(cached)) {
      // Component is cached and valid - use it immediately
      // Set the component directly in the next render
      hasTriggeredLoad.current = true;
      queueMicrotask(() => {
        setComponent(() => cached);
        setLoading(false);
        setError(null);
        loadedViewIdRef.current = config.id;
      });
    } else {
      // Cache miss or invalid cached component - clear cache if invalid and trigger async load
      if (cached && !isValidComponent(cached)) {
        logger.warn(
          `Cached component for "${config.id}" is invalid, clearing cache and reloading`
        );
        componentCache.clear(); // Clear entire cache to prevent other corrupted entries
      }
      // Not cached or invalid - trigger async load
      hasTriggeredLoad.current = true;
      // Use queueMicrotask to avoid state updates during render
      queueMicrotask(() => {
        loadComponent(config, 0).catch((err) => {
          logger.error(`Sync-triggered load failed for ${config.id}:`, err);
        });
      });
    }
  }

  // Load component when config changes
  // CRITICAL: This useEffect MUST run to trigger component loading
  useEffect(() => {
    const viewId = config.id;

    // Early return if component is already loaded for this exact view
    if (loadedViewIdRef.current === viewId && Component !== null && !error) {
      logger.debug(`Component ${viewId} already loaded, skipping reload`);
      return;
    }

    // If component was initialized from cache/static and matches current view, we're done
    if (Component !== null && !loading && loadedViewIdRef.current === viewId) {
      logger.debug(
        `Component ${viewId} initialized from cache/static, skipping load`
      );
      return;
    }

    // Check if component is already cached (for instant loading)
    if (isLazyViewConfig(config)) {
      const cached = componentCache.get(viewId);
      if (cached) {
        // Validate cached component before using it
        if (!isValidComponent(cached)) {
          logger.warn(
            `Cached component for "${viewId}" is invalid, clearing cache and reloading`
          );
          componentCache.clear(); // Clear entire cache to prevent other corrupted entries
          // Fall through to load fresh component
        } else {
          // Component is cached - load instantly without showing loading state
          logger.debug(`Component ${viewId} found in cache, loading instantly`);
          setComponent(() => cached);
          setLoading(false);
          setError(null);
          loadedViewIdRef.current = viewId;
          return;
        }
      }
    }

    // Handle static component immediately
    if (isStaticViewConfig(config) && config.component) {
      // Validate static component
      if (!isValidComponent(config.component)) {
        const configError = new Error(
          `Static component for "${viewId}" is invalid. Expected a function or class component.`
        );
        logger.error(configError.message);
        if (!mountedRef.current) return;
        setError(configError);
        setLoading(false);
        return;
      }
      logger.debug(`Component ${viewId} is static, loading immediately`);
      setComponent(() => config.component);
      setLoading(false);
      setError(null);
      loadedViewIdRef.current = viewId;
      return;
    }

    // Only load if we don't have a component yet
    if (Component === null) {
      logger.debug(`Loading component ${viewId} for the first time`);
      hasTriggeredLoad.current = true;
      setLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();
      loadComponent(config, 0);

      return () => {
        abortControllerRef.current?.abort();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.id]);

  // Retry handler
  const handleRetry = useCallback(() => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    setError(null);
    setLoading(true);
    loadComponent(config, newRetryCount);
  }, [config, retryCount, loadComponent]);

  // Show error if loading failed
  if (error) {
    logger.error(`Error state for ${config.id}:`, error);
    if (errorFallback) {
      return <>{errorFallback(error, handleRetry)}</>;
    }
    return <DefaultErrorFallback error={error} onRetry={handleRetry} />;
  }

  // Priority: Render component if available (even if loading is true)
  // This prevents the loading spinner from showing when component is already loaded
  if (Component) {
    // Final validation before rendering
    if (!isValidComponent(Component)) {
      const invalidComponentError = new Error(
        `Component for "${
          config.id
        }" is invalid. Expected a function or class component, but got: ${typeof Component}. This may be due to a circular dependency or incorrect export.`
      );
      logger.error(invalidComponentError.message);
      if (errorFallback) {
        return <>{errorFallback(invalidComponentError, handleRetry)}</>;
      }
      return (
        <DefaultErrorFallback
          error={invalidComponentError}
          onRetry={handleRetry}
        />
      );
    }

    try {
      logger.debug(
        `Rendering component ${config.id} (loading=${loading}, hasComponent=true)`
      );
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

  // Only show loading if we don't have a component AND we're actually loading
  if (loading) {
    logger.debug(
      `Showing loading for ${config.id} (loading=${loading}, hasComponent=false)`
    );
    return <>{fallback}</>;
  }

  // Fallback: if no component and not loading, something went wrong
  // This shouldn't happen, but provides a safety net
  // Note: error is null here because we checked it above
  logger.warn(
    `Component ${config.id} is in invalid state: loading=${loading}, Component=null`
  );
  return <>{fallback}</>;
}

// Export cache utilities for testing and monitoring
// Note: Fast Refresh warning is expected here - these utilities are needed for testing and monitoring
/* eslint-disable react-refresh/only-export-components */
export {
  componentCache,
  ComponentCache,
  electronChunkCache,
  ElectronChunkCache,
};
