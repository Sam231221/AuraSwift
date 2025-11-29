/**
 * Payment actions component
 */

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";
import type { PaymentMethod } from "@/types/domain/payment";

interface PaymentActionsProps {
  paymentMethod: PaymentMethod;
  cashAmount: number;
  total: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function PaymentActions({
  paymentMethod,
  cashAmount,
  total,
  onComplete,
  onCancel,
}: PaymentActionsProps) {
  const isCashPayment = paymentMethod.type === "cash";
  const isCashValid = isCashPayment && cashAmount >= total && cashAmount > 0;
  const isDisabled = isCashPayment && !isCashValid;

  return (
    <>
      {!isCashPayment && (
        <div className="text-center py-3 sm:py-4">
          <p className="text-slate-700 text-sm sm:text-base">
            Processing {paymentMethod.type} payment...
          </p>
          <Progress value={50} className="mt-3 sm:mt-4 bg-slate-200" />
        </div>
      )}

      <Button
        className={`w-full mt-3 sm:mt-4 min-h-[44px] h-10 sm:h-11 text-sm sm:text-base lg:text-lg touch-manipulation ${
          isDisabled
            ? "bg-slate-400 cursor-not-allowed"
            : "bg-sky-600 hover:bg-sky-700"
        }`}
        onClick={onComplete}
        disabled={isDisabled}
      >
        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 shrink-0" />
        <span className="truncate">
          {isCashPayment && !isCashValid
            ? `Need £${(total - cashAmount).toFixed(2)} More`
            : "Complete Transaction"}
        </span>
      </Button>
      <Button
        variant="ghost"
        className="col-span-2 mt-2 min-h-[44px] h-10 sm:h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-sm sm:text-base touch-manipulation"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </>
  );
}
