/**
 * Cash payment form component
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CashPaymentFormProps {
  total: number;
  cashAmount: number;
  onCashAmountChange: (amount: number) => void;
}

export function CashPaymentForm({
  total,
  cashAmount,
  onCashAmountChange,
}: CashPaymentFormProps) {
  const change = cashAmount >= total ? cashAmount - total : 0;
  const shortfall = cashAmount > 0 && cashAmount < total ? total - cashAmount : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-between text-slate-700 text-sm sm:text-base">
        <span>Amount Due:</span>
        <span className="font-semibold">£{total.toFixed(2)}</span>
      </div>

      <div>
        <label className="text-xs sm:text-sm text-slate-600">Cash Received:</label>
        <Input
          type="number"
          step="0.01"
          placeholder="Enter cash amount"
          value={cashAmount ? cashAmount.toFixed(2) : ""}
          onChange={(e) =>
            onCashAmountChange(parseFloat(e.target.value) || 0)
          }
          className={`mt-1 h-10 sm:h-11 text-sm sm:text-base ${
            cashAmount > 0 && cashAmount < total
              ? "border-red-300 bg-red-50"
              : "bg-white border-slate-300"
          }`}
        />
        {shortfall > 0 && (
          <p className="text-red-600 text-xs sm:text-sm mt-1">
            Insufficient funds. Need £{shortfall.toFixed(2)} more.
          </p>
        )}
      </div>

      <div
        className={`flex justify-between font-bold text-base sm:text-lg pt-2 border-t border-slate-200 ${
          cashAmount >= total
            ? "text-sky-700"
            : cashAmount > 0
            ? "text-red-600"
            : "text-slate-600"
        }`}
      >
        <span>Change:</span>
        <span>
          {cashAmount >= total
            ? `£${change.toFixed(2)}`
            : cashAmount > 0
            ? `-£${shortfall.toFixed(2)}`
            : "£0.00"}
        </span>
      </div>

      {/* Quick cash amount buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[5, 10, 20, 50].map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            onClick={() => onCashAmountChange(amount)}
            className="text-[10px] sm:text-xs h-9 sm:h-10 touch-manipulation"
          >
            £{amount}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCashAmountChange(total)}
          className="flex-1 text-[10px] sm:text-xs h-9 sm:h-10 touch-manipulation"
        >
          Exact Amount
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCashAmountChange(Math.ceil(total))}
          className="flex-1 text-[10px] sm:text-xs h-9 sm:h-10 touch-manipulation"
        >
          Round Up
        </Button>
      </div>
    </div>
  );
}

