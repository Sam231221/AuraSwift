/**
 * Category price input display component
 */

import { DollarSign } from "lucide-react";
import type { Category } from "@/types/domain/category";

interface CategoryPriceInputDisplayProps {
  pendingCategory: Category | null;
  categoryDisplayPrice: string;
}

export function CategoryPriceInputDisplay({
  pendingCategory,
  categoryDisplayPrice,
}: CategoryPriceInputDisplayProps) {
  if (!pendingCategory) return null;

  return (
    <div className="mt-1 flex flex-col gap-2 p-2 sm:p-3 rounded bg-blue-50 border border-blue-200">
      <div className="flex items-center gap-2">
        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
        <span className="text-xs sm:text-sm text-blue-700 font-medium line-clamp-1">
          Amount for {pendingCategory.name}:
        </span>
      </div>
      {/* Price Display */}
      <div className="bg-white p-3 sm:p-4 rounded-lg text-center border border-blue-200">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900">
          £{categoryDisplayPrice}
        </div>
      </div>
    </div>
  );
}
