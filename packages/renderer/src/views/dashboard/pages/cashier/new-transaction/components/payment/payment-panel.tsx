/**
 * Payment panel component
 * Main container for payment processing
 */

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { PaymentMethodSelector } from "./payment-method-selector";
import { CashPaymentForm } from "./cash-payment-form";
import { PaymentActions } from "./payment-actions";
import type { PaymentMethod } from "../../types/transaction.types";

interface PaymentPanelProps {
  paymentStep: boolean;
  paymentMethod: PaymentMethod | null;
  total: number;
  cashAmount: number;
  cardReaderReady: boolean;
  onPaymentMethodSelect: (method: PaymentMethod["type"]) => void;
  onCashAmountChange: (amount: number) => void;
  onCompleteTransaction: () => void;
  onCancel: () => void;
}

export function PaymentPanel({
  paymentStep,
  paymentMethod,
  total,
  cashAmount,
  cardReaderReady,
  onPaymentMethodSelect,
  onCashAmountChange,
  onCompleteTransaction,
  onCancel,
}: PaymentPanelProps) {
  if (!paymentStep) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 py-2 sm:py-3 px-4 sm:px-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 text-slate-700 text-sm sm:text-base">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
              Payment Method
            </div>
            {/* Card Reader Status */}
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div
                className={`h-2 w-2 rounded-full shrink-0 ${
                  cardReaderReady ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span
                className={
                  cardReaderReady ? "text-green-600" : "text-red-600"
                }
              >
                Card Reader {cardReaderReady ? "Ready" : "Not Ready"}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-4 px-4 sm:px-6">
          {!paymentMethod ? (
            <PaymentMethodSelector
              cardReaderReady={cardReaderReady}
              onSelect={onPaymentMethodSelect}
              onCancel={onCancel}
            />
          ) : (
            <div>
              {paymentMethod.type === "cash" && (
                <CashPaymentForm
                  total={total}
                  cashAmount={cashAmount}
                  onCashAmountChange={onCashAmountChange}
                />
              )}
              <PaymentActions
                paymentMethod={paymentMethod}
                cashAmount={cashAmount}
                total={total}
                onComplete={onCompleteTransaction}
                onCancel={onCancel}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

