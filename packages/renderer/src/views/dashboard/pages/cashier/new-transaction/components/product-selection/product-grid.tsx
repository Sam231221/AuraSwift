/**
 * Product grid component
 */

import { Package, Search } from "lucide-react";
import { ProductCard } from "./product-card";
import type { Product } from "@/features/products/types/product.types";

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
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-slate-500 text-center">
          No products in this category
        </p>
      </div>
    );
  }

  if (products.length === 0 && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Search className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-slate-500 text-center">
          No products found for "{searchQuery}"
        </p>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
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

