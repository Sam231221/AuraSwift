/**
 * Cart summary component
 *
 * Displays cart totals including subtotal, tax, and total.
 * Tax percentage is calculated as a weighted average across all items.
 */

import { useMemo } from "react";
import type { CartItemWithProduct } from "../../../../types/cart.types";

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  items: CartItemWithProduct[];
}

/**
 * Calculate weighted average tax rate from cart items
 * @param items - Array of cart items
 * @param subtotal - Total subtotal before tax
 * @returns Weighted average tax rate as percentage (0-100)
 */
function calculateWeightedAverageTaxRate(
  items: CartItemWithProduct[],
  subtotal: number
): number {
  if (items.length === 0 || subtotal === 0) {
    return 0;
  }

  // Calculate effective tax rate: (totalTax / subtotal) * 100
  const totalTax = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const effectiveTaxRate = (totalTax / subtotal) * 100;

  // Round to 1 decimal place
  return Math.round(effectiveTaxRate * 10) / 10;
}

export function CartSummary({
  subtotal,
  tax,
  total,
  itemCount,
  items,
}: CartSummaryProps) {
  // Calculate weighted average tax rate
  const averageTaxRate = useMemo(
    () => calculateWeightedAverageTaxRate(items, subtotal),
    [items, subtotal]
  );

  // Format tax rate display
  const taxRateDisplay =
    averageTaxRate > 0 ? `${averageTaxRate.toFixed(1)}%` : "Tax";

  return (
    <div className="mt-2 pt-2 border-t border-slate-200 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2 text-slate-700 font-medium text-xs sm:text-sm">
        <span>
          Subtotal:{" "}
          <span className="font-semibold">£{subtotal.toFixed(2)}</span>
        </span>
        <span>
          Items: <span className="font-semibold">{itemCount}</span>
        </span>
        <span className="text-slate-500">
          Tax ({taxRateDisplay}):{" "}
          <span className="font-semibold">£{tax.toFixed(2)}</span>
        </span>
        <span className="text-sky-700 font-bold text-base sm:text-lg ml-auto">
          Total: £{total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
