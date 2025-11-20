/**
 * Weight input display component
 */

import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/features/products/types/product.types";

interface WeightInputDisplayProps {
  selectedProduct: Product | null;
  weightDisplayPrice: string;
  onShowScaleDisplay?: () => void;
}

export function WeightInputDisplay({
  selectedProduct,
  weightDisplayPrice,
  onShowScaleDisplay,
}: WeightInputDisplayProps) {
  if (!selectedProduct) return null;

  return (
    <div className="mt-1 flex flex-col gap-2 p-2 rounded bg-blue-50 border border-blue-200">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-blue-600" />
        <span className="text-sm text-blue-700 font-medium">
          Weight for {selectedProduct.name}:
        </span>
      </div>
      {/* Weight Display */}
      <div className="bg-white p-4 rounded-lg text-center border border-blue-200">
        <div className="text-3xl font-bold text-slate-900">
          {weightDisplayPrice} {selectedProduct.unit || "units"}
        </div>
      </div>
      {/* Button to switch back to scale */}
      {onShowScaleDisplay && (
        <Button
          variant="outline"
          onClick={onShowScaleDisplay}
          className="w-full mt-2"
        >
          <Scale className="h-4 w-4 mr-2" />
          Use Scale Instead
        </Button>
      )}
    </div>
  );
}
