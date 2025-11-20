/**
 * Cart summary component
 */

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

export function CartSummary({
  subtotal,
  tax,
  total,
  itemCount,
}: CartSummaryProps) {
  return (
    <div className="mt-2 pt-2 border-t border-slate-200 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2 text-slate-700 font-medium text-sm">
        <span>
          Subtotal: <span className="font-semibold">£{subtotal.toFixed(2)}</span>
        </span>
        <span>
          Items: <span className="font-semibold">{itemCount}</span>
        </span>
        <span className="text-slate-500">
          Tax (8%): <span className="font-semibold">£{tax.toFixed(2)}</span>
        </span>
        <span className="text-sky-700 font-bold text-lg ml-auto">
          Total: £{total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

