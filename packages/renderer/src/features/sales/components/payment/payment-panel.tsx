/**
 * Payment panel component
 * Main container for payment processing
 * Supports Viva Wallet for contactless card payments
 */

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { PaymentMethodSelector } from "./payment-method-selector";
import { CashPaymentForm } from "./cash-payment-form";
import { PaymentActions } from "./payment-actions";
import { VivaWalletStatus } from "./viva-wallet-status";
import { useVivaWallet } from "../../hooks/use-viva-wallet";
import { useVivaWalletTransaction } from "../../hooks/use-viva-wallet-transaction";
import { useEffect } from "react";
import type { PaymentMethod } from "@/types/domain/payment";

interface PaymentPanelProps {
  paymentStep: boolean;
  paymentMethod: PaymentMethod | null;
  total: number;
  cashAmount: number;
  cardReaderReady: boolean;
  currency?: string;
  onPaymentMethodSelect: (method: PaymentMethod["type"]) => void;
  onCashAmountChange: (amount: number) => void;
  onCompleteTransaction: (
    skipPaymentValidation?: boolean,
    actualPaymentMethod?: PaymentMethod["type"],
    vivaWalletTransactionId?: string
  ) => void;
  onCancel: () => void;
}

export function PaymentPanel({
  paymentStep,
  paymentMethod,
  total,
  cashAmount,
  cardReaderReady,
  currency = "GBP",
  onPaymentMethodSelect,
  onCashAmountChange,
  onCompleteTransaction,
  onCancel,
}: PaymentPanelProps) {
  const { selectedTerminal, connectionStatus } = useVivaWallet();
  const {
    transactionStatus,
    isProcessing,
    initiateTransaction,
    cancelTransaction,
    resetTransaction,
  } = useVivaWalletTransaction();

  // Handle Viva Wallet transaction initiation when payment method is selected
  useEffect(() => {
    if (
      paymentMethod?.type === "viva_wallet" &&
      !transactionStatus &&
      !isProcessing &&
      selectedTerminal &&
      connectionStatus === "connected"
    ) {
      // Initiate transaction automatically when Viva Wallet is selected
      initiateTransaction(total, currency);
    }
  }, [
    paymentMethod?.type,
    total,
    currency,
    selectedTerminal,
    connectionStatus,
    transactionStatus,
    isProcessing,
    initiateTransaction,
  ]);

  // Handle transaction completion
  useEffect(() => {
    if (
      transactionStatus?.status === "completed" &&
      paymentMethod?.type === "viva_wallet"
    ) {
      // Transaction completed, call onCompleteTransaction
      // Pass skipPaymentValidation=true since payment was already processed
      // Pass the Viva Wallet transaction ID for tracking
      onCompleteTransaction(
        true,
        "viva_wallet",
        transactionStatus.transactionId
      );
    }
  }, [
    transactionStatus?.status,
    transactionStatus?.transactionId,
    paymentMethod?.type,
    onCompleteTransaction,
  ]);

  // Reset transaction state when payment method changes away from Viva Wallet
  useEffect(() => {
    if (paymentMethod?.type !== "viva_wallet" && transactionStatus) {
      resetTransaction();
    }
  }, [paymentMethod?.type, transactionStatus, resetTransaction]);

  if (!paymentStep) return null;

  const handleVivaWalletCancel = async () => {
    if (transactionStatus) {
      await cancelTransaction();
    }
    resetTransaction();
    onCancel();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 py-2 sm:py-3 px-4 sm:px-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 text-slate-700 text-sm sm:text-base">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
              Payment Method
            </div>
            {/* Terminal/Reader Status */}
            {paymentMethod?.type === "viva_wallet" && selectedTerminal ? (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <div
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    connectionStatus === "connected"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
                <span
                  className={
                    connectionStatus === "connected"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {selectedTerminal.name}{" "}
                  {connectionStatus === "connected"
                    ? "Connected"
                    : "Not Connected"}
                </span>
              </div>
            ) : (
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
                  Terminal {cardReaderReady ? "Ready" : "Not Ready"}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-4 px-4 sm:px-6">
          {!paymentMethod ? (
            <PaymentMethodSelector
              cardReaderReady={cardReaderReady}
              onSelect={onPaymentMethodSelect}
              onCancel={onCancel}
            />
          ) : paymentMethod.type === "viva_wallet" && transactionStatus ? (
            // Show Viva Wallet transaction status
            <VivaWalletStatus
              transactionStatus={transactionStatus}
              amount={total}
              currency={currency}
              terminalName={selectedTerminal?.name || "Unknown Terminal"}
              onCancel={handleVivaWalletCancel}
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
