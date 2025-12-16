/**
 * Virtualized Product Grid Component
 *
 * Uses @tanstack/react-virtual for efficient rendering of large product catalogs.
 * Only renders visible items plus a small overscan, maintaining 60fps scrolling
 * even with 60k+ products.
 *
 * Key features:
 * - Row virtualization with dynamic column count based on container width
 * - Infinite scroll with onLoadMore callback
 * - Same visual appearance as original ProductGrid
 * - Responsive grid that adapts to screen size
 */

import { useRef, useCallback, useMemo, useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Package, Search, Loader2 } from "lucide-react";
import { ProductCard } from "./product-card";
import type { Product } from "@/types/domain";

interface VirtualizedProductGridProps {
  products: Product[];
  searchQuery: string;
  selectedWeightProductId: string | null;
  onProductClick: (product: Product) => void;
  onGenericItemClick?: (product: Product) => void;
  /** Callback when user scrolls near the end - for loading more items */
  onLoadMore?: () => void;
  /** Whether there are more items to load */
  hasMore?: boolean;
  /** Whether more items are currently being loaded */
  isLoadingMore?: boolean;
}

// Grid configuration constants
const ROW_HEIGHT = 160; // Height of each product card row (including gap)
const OVERSCAN = 3; // Number of rows to render outside viewport

/**
 * Calculate number of columns based on container width
 * Matches the responsive breakpoints from the original ProductGrid:
 * - Default (mobile): 2 columns
 * - sm (640px+): 3 columns
 * - lg (1024px+): 4 columns
 * - xl (1280px+): 5 columns
 */
function calculateColumnCount(containerWidth: number): number {
  if (containerWidth >= 1280) return 5; // xl
  if (containerWidth >= 1024) return 4; // lg
  if (containerWidth >= 640) return 3; // sm
  return 2; // default (mobile)
}

export function VirtualizedProductGrid({
  products,
  searchQuery,
  selectedWeightProductId,
  onProductClick,
  onGenericItemClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: VirtualizedProductGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(4);
  const [isReady, setIsReady] = useState(false);

  // Update column count on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateColumns = () => {
      const width = container.offsetWidth;
      const newColumnCount = calculateColumnCount(width);
      // Use queueMicrotask to avoid flushSync warning from ResizeObserver
      queueMicrotask(() => {
        setColumnCount(newColumnCount);
      });
    };

    // Initial calculation (safe to call directly on mount)
    const width = container.offsetWidth;
    setColumnCount(calculateColumnCount(width));

    // Mark as ready after initial setup to avoid flushSync during first render
    requestAnimationFrame(() => {
      setIsReady(true);
    });

    // Create ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(updateColumns);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate row count based on products and columns
  const rowCount = useMemo(() => {
    return Math.ceil(products.length / columnCount);
  }, [products.length, columnCount]);

  // Setup virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !onLoadMore || !hasMore || isLoadingMore)
      return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Load more when 80% scrolled
    if (scrollPercentage > 0.8) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Empty state: No products in category
  if (products.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12">
        <Package className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-slate-300 mb-3 sm:mb-4" />
        <p className="text-slate-500 text-center text-xs sm:text-sm">
          No products in this category
        </p>
      </div>
    );
  }

  // Empty state: No search results
  if (products.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12">
        <Search className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-slate-300 mb-3 sm:mb-4" />
        <p className="text-slate-500 text-center text-xs sm:text-sm">
          No products found for "{searchQuery}"
        </p>
      </div>
    );
  }

  // Safety check
  if (products.length === 0) return null;

  // Get virtual rows only when ready (prevents flushSync warning)
  const virtualRows = isReady ? rowVirtualizer.getVirtualItems() : [];

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Scrollable virtualized container */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto"
        onScroll={handleScroll}
      >
        {/* Virtual content wrapper - provides the full height for scrollbar */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {/* Render only visible rows */}
          {virtualRows.map((virtualRow) => {
            const startIndex = virtualRow.index * columnCount;
            const rowProducts = products.slice(
              startIndex,
              startIndex + columnCount
            );

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Grid row with responsive columns */}
                <div
                  className="grid gap-2 sm:gap-3 h-full"
                  style={{
                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                  }}
                >
                  {rowProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSelected={selectedWeightProductId === product.id}
                      onProductClick={onProductClick}
                      onGenericItemClick={onGenericItemClick}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading indicator for infinite scroll */}
        {isLoadingMore && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            <span className="ml-2 text-xs text-slate-500">
              Loading more products...
            </span>
          </div>
        )}

        {/* End of list indicator */}
        {!hasMore && products.length > 0 && (
          <div className="text-center py-3 text-xs text-slate-400">
            {products.length} product{products.length !== 1 ? "s" : ""} total
          </div>
        )}
      </div>
    </div>
  );
}
