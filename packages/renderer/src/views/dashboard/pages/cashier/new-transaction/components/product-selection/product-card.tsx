/**
 * Product card component
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale } from "lucide-react";
import type { Product } from "@/features/products/types/product.types";

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onProductClick: (product: Product) => void;
  onGenericItemClick?: (product: Product) => void;
}

export function ProductCard({
  product,
  isSelected,
  onProductClick,
  onGenericItemClick,
}: ProductCardProps) {
  const handleClick = async () => {
    if (product.isGenericButton && onGenericItemClick) {
      await onGenericItemClick(product);
      return;
    }
    await onProductClick(product);
  };

  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Button
        variant="outline"
        className={`h-auto py-4 flex flex-col items-center w-full transition-all ${
          isSelected
            ? "bg-blue-50 border-blue-300 hover:bg-blue-100"
            : "bg-white border-slate-200 hover:bg-slate-50"
        }`}
        onClick={handleClick}
        onTouchEnd={async (e) => {
          e.preventDefault();
          await handleClick();
        }}
      >
        <div className="w-16 h-16 bg-slate-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-slate-400">
              {product.name.charAt(0)}
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-slate-900 text-center line-clamp-2 mb-1">
          {product.name}
        </span>

        {product.requiresWeight && (
          <Badge variant="outline" className="mt-1 text-xs bg-blue-50">
            <Scale className="h-3 w-3 mr-1" />
            Weighed
          </Badge>
        )}
        {product.isGenericButton && (
          <Badge
            variant="outline"
            className="mt-1 text-xs bg-purple-50 text-purple-700 border-purple-200"
          >
            Generic
          </Badge>
        )}
      </Button>
    </motion.div>
  );
}
