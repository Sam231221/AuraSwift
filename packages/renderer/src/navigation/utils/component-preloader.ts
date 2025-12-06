import { getView, getNestedViews } from "../registry/view-registry";
import { componentCache } from "./lazy-component-loader";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("component-preloader");

interface PreloadQueue {
  viewId: string;
  priority: number;
  timestamp: number;
}

class ComponentPreloader {
  private preloadQueue: PreloadQueue[] = [];
  private preloading = new Set<string>();
  private readonly maxConcurrent = 2; // Load 2 components in parallel

  /**
   * Preload a view component
   */
  async preload(viewId: string, priority = 5): Promise<void> {
    // Skip if already cached, loading, or in queue
    if (
      componentCache.get(viewId) ||
      this.preloading.has(viewId) ||
      this.preloadQueue.some((item) => item.viewId === viewId)
    ) {
      return;
    }

    const view = getView(viewId);
    if (!view || !("componentLoader" in view) || !view.componentLoader) {
      return;
    }

    // Add to queue with priority
    this.preloadQueue.push({
      viewId,
      priority: view.loadPriority || priority,
      timestamp: Date.now(),
    });

    // Sort by priority (higher first)
    this.preloadQueue.sort((a, b) => b.priority - a.priority);

    // Process queue
    this.processQueue();
  }

  /**
   * Preload nested views of a parent view
   */
  async preloadNestedViews(parentViewId: string): Promise<void> {
    const nestedViews = getNestedViews(parentViewId);
    for (const view of nestedViews) {
      if (view.preloadStrategy === "preload") {
        await this.preload(view.id, view.loadPriority || 7);
      }
    }
  }

  /**
   * Process preload queue
   */
  private async processQueue(): Promise<void> {
    // Don't exceed max concurrent
    while (
      this.preloading.size < this.maxConcurrent &&
      this.preloadQueue.length > 0
    ) {
      const item = this.preloadQueue.shift();
      if (!item) break;

      this.preloading.add(item.viewId);
      this.loadComponent(item.viewId)
        .catch((error) => {
          logger.warn(`Failed to preload ${item.viewId}:`, error);
        })
        .finally(() => {
          this.preloading.delete(item.viewId);
          // Continue processing
          this.processQueue();
        });
    }
  }

  /**
   * Load component (low priority, no error throwing)
   */
  private async loadComponent(viewId: string): Promise<void> {
    const view = getView(viewId);
    if (!view || !("componentLoader" in view) || !view.componentLoader) {
      return;
    }

    try {
      const module = await view.componentLoader();
      if (module.default) {
        componentCache.set(viewId, module.default);
        logger.debug(`Preloaded component: ${viewId}`);
      }
    } catch (error) {
      // Silently fail for preloading
      logger.debug(`Preload failed for ${viewId}:`, error);
    }
  }

  /**
   * Prefetch on hover/focus (low priority)
   * Electron: Instant loading from local disk, so we can be more aggressive
   */
  prefetch(viewId: string): void {
    // Electron: Local files load instantly, so we can prefetch immediately
    // Use requestIdleCallback for non-blocking prefetch
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(
        () => {
          this.preload(viewId, 1); // Low priority
        },
        { timeout: 1000 } // Max 1s wait
      );
    } else {
      // Fallback: Immediate prefetch (local files are fast)
      setTimeout(() => {
        this.preload(viewId, 1);
      }, 0);
    }
  }

  /**
   * Electron-specific: Preload chunks during app startup
   * Similar to VS Code's extension preloading strategy
   */
  async preloadCriticalChunks(viewIds: string[]): Promise<void> {
    // Preload critical views in parallel (local files = fast)
    const promises = viewIds.map((viewId) => this.preload(viewId, 10));
    await Promise.allSettled(promises);
  }

  /**
   * Clear preload queue
   */
  clear(): void {
    this.preloadQueue = [];
  }
}

// Global preloader instance
export const componentPreloader = new ComponentPreloader();

/**
 * Hook to preload components on hover/focus
 */
export function usePreloadOnHover(viewId: string): {
  onMouseEnter: () => void;
  onFocus: () => void;
} {
  return {
    onMouseEnter: () => componentPreloader.prefetch(viewId),
    onFocus: () => componentPreloader.prefetch(viewId),
  };
}
