/**
 * Payment method selector component
 */

import { Button } from "@/components/ui/button";
import type { PaymentMethod } from "../../types/transaction.types";

interface PaymentMethodSelectorProps {
  cardReaderReady: boolean;
  onSelect: (method: PaymentMethod["type"]) => void;
  onCancel: () => void;
}

export function PaymentMethodSelector({
  cardReaderReady,
  onSelect,
  onCancel,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <Button
        variant="outline"
        className="h-14 sm:h-16 bg-white border-slate-300 hover:bg-slate-50 text-slate-700 text-sm sm:text-base touch-manipulation"
        onClick={() => onSelect("cash")}
      >
        <div className="flex flex-col items-center">
          <span>Cash</span>
          <span className="text-[10px] sm:text-xs text-slate-500">
            Physical currency
          </span>
        </div>
      </Button>
      <Button
        variant="outline"
        className={`h-14 sm:h-16 border-slate-300 text-slate-700 text-sm sm:text-base touch-manipulation ${
          cardReaderReady
            ? "bg-white hover:bg-slate-50"
            : "bg-gray-100 cursor-not-allowed opacity-60"
        }`}
        onClick={() => onSelect("card")}
        disabled={!cardReaderReady}
      >
        <div className="flex flex-col items-center">
          <span>Card</span>
          <span className="text-[10px] sm:text-xs text-slate-500">
            {cardReaderReady ? "Credit/Debit" : "Reader Not Ready"}
          </span>
        </div>
      </Button>
      <Button
        variant="outline"
        className="h-14 sm:h-16 bg-white border-slate-300 hover:bg-slate-50 text-slate-700 text-sm sm:text-base touch-manipulation"
        onClick={() => onSelect("mobile")}
      >
        <div className="flex flex-col items-center">
          <span>Mobile Pay</span>
          <span className="text-[10px] sm:text-xs text-slate-500">
            Apple/Google Pay
          </span>
        </div>
      </Button>
      <Button
        variant="outline"
        className="h-14 sm:h-16 bg-white border-slate-300 hover:bg-slate-50 text-slate-700 text-sm sm:text-base touch-manipulation"
        onClick={() => onSelect("voucher")}
      >
        <div className="flex flex-col items-center">
          <span>Voucher</span>
          <span className="text-[10px] sm:text-xs text-slate-500">
            Gift card/Coupon
          </span>
        </div>
      </Button>
      <Button
        variant="ghost"
        className="col-span-2 mt-2 h-10 sm:h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-sm sm:text-base touch-manipulation"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
}
