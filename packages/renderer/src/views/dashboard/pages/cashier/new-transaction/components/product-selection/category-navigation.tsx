/**
 * Category navigation component
 */

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Category } from "../../types/transaction.types";
import type { Product } from "@/features/products/types/product.types";

interface CategoryNavigationProps {
  categories: Category[];
  products: Product[];
  currentCategories: Category[];
  searchQuery: string;
  lastClickTime: { productId: string; timestamp: number } | null;
  onCategoryClick: (category: Category, addToCart: boolean) => void;
  onSetLastClickTime: (time: { productId: string; timestamp: number } | null) => void;
  DOUBLE_CLICK_DELAY: number;
}

export function CategoryNavigation({
  categories,
  products,
  currentCategories,
  searchQuery,
  lastClickTime,
  onCategoryClick,
  onSetLastClickTime,
  DOUBLE_CLICK_DELAY,
}: CategoryNavigationProps) {
  if (searchQuery || currentCategories.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {currentCategories.map((category) => {
          const childCount = categories.filter(
            (c) => c.parentId === category.id
          ).length;
          const productCount = products.filter(
            (p) => p.category === category.id
          ).length;

          return (
            <motion.button
              key={category.id}
              onClick={() => {
                // Detect double-click for navigation
                const now = Date.now();
                if (
                  lastClickTime &&
                  lastClickTime.productId === category.id &&
                  now - lastClickTime.timestamp < DOUBLE_CLICK_DELAY
                ) {
                  // Double click detected - navigate to category (show nested categories/products)
                  onCategoryClick(category, false);
                  onSetLastClickTime(null);
                } else {
                  // Single click - add category to cart (show price input)
                  onCategoryClick(category, true);
                  onSetLastClickTime({
                    productId: category.id,
                    timestamp: now,
                  });
                  // Clear after delay
                  setTimeout(() => {
                    onSetLastClickTime(null);
                  }, DOUBLE_CLICK_DELAY);
                }
              }}
              onTouchEnd={(e) => {
                // Touch support for double-tap navigation
                e.preventDefault();
                const now = Date.now();
                if (
                  lastClickTime &&
                  lastClickTime.productId === category.id &&
                  now - lastClickTime.timestamp < DOUBLE_CLICK_DELAY
                ) {
                  // Double tap detected - navigate to category (show nested categories/products)
                  onCategoryClick(category, false);
                  onSetLastClickTime(null);
                } else {
                  // Single tap - add category to cart (show price input)
                  onCategoryClick(category, true);
                  onSetLastClickTime({
                    productId: category.id,
                    timestamp: now,
                  });
                  setTimeout(() => {
                    onSetLastClickTime(null);
                  }, DOUBLE_CLICK_DELAY);
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg p-3 sm:p-4 lg:p-6 shadow-md transition-all h-20 sm:h-24 lg:h-28 flex flex-col items-center justify-center touch-manipulation"
            >
              <div className="text-center min-w-0 w-full px-1">
                <p className="font-bold text-sm sm:text-base lg:text-lg uppercase tracking-wide mb-1 line-clamp-2">
                  {category.name}
                </p>
                <p className="text-[10px] sm:text-xs opacity-90">
                  {childCount > 0
                    ? `${childCount} subcategories`
                    : `${productCount} items`}
                </p>
              </div>
              {childCount > 0 && (
                <ChevronRight className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 opacity-75 shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

