import { Package, Search } from "lucide-react";
import { ProductCard } from "./product-card";
import type { Product } from "@/types/domain";

interface ProductGridProps {
  products: Product[];
  searchQuery: string;
  selectedWeightProductId: string | null;
  onProductClick: (product: Product) => void;
  onGenericItemClick?: (product: Product) => void;
}

export function ProductGrid({
  products,
  searchQuery,
  selectedWeightProductId,
  onProductClick,
  onGenericItemClick,
}: ProductGridProps) {
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

  if (products.length === 0) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 flex-1 min-h-0 overflow-y-auto">
        {products.map((product) => (
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
}
