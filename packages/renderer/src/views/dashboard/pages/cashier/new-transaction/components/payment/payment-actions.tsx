/**
 * Payment actions component
 */

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";
import type { PaymentMethod } from "../../types/transaction.types";

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
        <div className="text-center py-4">
          <p className="text-slate-700">
            Processing {paymentMethod.type} payment...
          </p>
          <Progress value={50} className="mt-4 bg-slate-200" />
        </div>
      )}

      <Button
        className={`w-full mt-4 h-11 text-lg ${
          isDisabled
            ? "bg-slate-400 cursor-not-allowed"
            : "bg-sky-600 hover:bg-sky-700"
        }`}
        onClick={onComplete}
        disabled={isDisabled}
      >
        <CheckCircle className="h-5 w-5 mr-2" />
        {isCashPayment && !isCashValid
          ? `Need £${(total - cashAmount).toFixed(2)} More`
          : "Complete Transaction"}
      </Button>
      <Button
        variant="ghost"
        className="col-span-2 mt-2 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </>
  );
}

