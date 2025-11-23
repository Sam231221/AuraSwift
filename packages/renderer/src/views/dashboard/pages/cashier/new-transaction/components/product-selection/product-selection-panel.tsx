/**
 * Product selection panel component
 * Main container for product browsing and selection
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Breadcrumb } from "./breadcrumb";
import { CategoryNavigation } from "./category-navigation";
import { ProductGrid } from "./product-grid";
import type { Product } from "@/features/products/types/product.types";
import type { Category, BreadcrumbItem } from "../../types/transaction.types";

interface ProductSelectionPanelProps {
  products: Product[];
  categories: Category[];
  currentCategories: Category[];
  breadcrumb: BreadcrumbItem[];
  searchQuery: string;
  selectedWeightProductId: string | null;
  loading: boolean;
  error: string | null;
  lastClickTime: { productId: string; timestamp: number } | null;
  onProductClick: (product: Product) => void;
  onGenericItemClick?: (product: Product) => void;
  onCategoryClick: (category: Category, addToCart: boolean) => void;
  onBreadcrumbClick: (index: number) => void;
  onSetLastClickTime: (time: { productId: string; timestamp: number } | null) => void;
  onRetry: () => void;
  DOUBLE_CLICK_DELAY: number;
}

export function ProductSelectionPanel({
  products,
  categories,
  currentCategories,
  breadcrumb,
  searchQuery,
  selectedWeightProductId,
  loading,
  error,
  lastClickTime,
  onProductClick,
  onGenericItemClick,
  onCategoryClick,
  onBreadcrumbClick,
  onSetLastClickTime,
  onRetry,
  DOUBLE_CLICK_DELAY,
}: ProductSelectionPanelProps) {
  return (
    <Card className="bg-white border-slate-200 flex-1 flex flex-col shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 py-1 px-3 sm:px-6">
        <div className="flex items-center justify-between">
          <Breadcrumb
            breadcrumb={breadcrumb}
            onBreadcrumbClick={onBreadcrumbClick}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-1 px-3 sm:px-6 flex-1 overflow-y-auto scroll-smooth">
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-slate-400" />
            <span className="ml-2 text-xs sm:text-sm text-slate-600">Loading products...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12">
            <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-red-500 mb-3 sm:mb-4" />
            <p className="text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">Failed to load products</p>
            <Button variant="outline" size="sm" onClick={onRetry} className="h-9 sm:h-10 text-xs sm:text-sm touch-manipulation">
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <CategoryNavigation
              categories={categories}
              products={products}
              currentCategories={currentCategories}
              searchQuery={searchQuery}
              lastClickTime={lastClickTime}
              onCategoryClick={onCategoryClick}
              onSetLastClickTime={onSetLastClickTime}
              DOUBLE_CLICK_DELAY={DOUBLE_CLICK_DELAY}
            />
            <ProductGrid
              products={products}
              searchQuery={searchQuery}
              selectedWeightProductId={selectedWeightProductId}
              onProductClick={onProductClick}
              onGenericItemClick={onGenericItemClick}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

