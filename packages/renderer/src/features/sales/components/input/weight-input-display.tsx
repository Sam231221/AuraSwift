/**
 * Weight input display component
 */

import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/domain";
import {
  useSalesUnitSettings,
  getEffectiveSalesUnit,
} from "@/shared/hooks/use-sales-unit-settings";
import { getProductSalesUnit } from "@/features/sales/utils/product-helpers";

interface WeightInputDisplayProps {
  selectedProduct: Product | null;
  weightDisplayPrice: string;
  businessId: string | undefined;
  onShowScaleDisplay?: () => void;
}

export function WeightInputDisplay({
  selectedProduct,
  weightDisplayPrice,
  businessId,
  onShowScaleDisplay,
}: WeightInputDisplayProps) {
  const salesUnitSettings = useSalesUnitSettings(businessId);

  if (!selectedProduct) return null;

  const productSalesUnit = getProductSalesUnit(selectedProduct);
  const effectiveSalesUnit = getEffectiveSalesUnit(
    productSalesUnit,
    salesUnitSettings
  );

  return (
    <div className="mt-1 flex flex-col gap-2 p-2 sm:p-3 rounded bg-blue-50 border border-blue-200">
      <div className="flex items-center gap-2">
        <Scale className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
        <span className="text-xs sm:text-sm text-blue-700 font-medium line-clamp-1">
          Weight for {selectedProduct.name}:
        </span>
      </div>
      {/* Weight Display */}
      <div className="bg-white p-3 sm:p-4 rounded-lg text-center border border-blue-200">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900">
          {weightDisplayPrice} {effectiveSalesUnit}
        </div>
      </div>
      {/* Button to switch back to scale */}
      {onShowScaleDisplay && (
        <Button
          variant="outline"
          onClick={onShowScaleDisplay}
          className="w-full mt-2 min-h-[44px] h-9 sm:h-10 text-xs sm:text-sm touch-manipulation"
        >
          <Scale className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
          Use Scale Instead
        </Button>
      )}
    </div>
  );
}
