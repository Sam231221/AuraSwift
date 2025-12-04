/**
 * Viva Wallet Transaction Status Component
 * Displays transaction progress and status for Viva Wallet payments
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  CreditCard,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { VivaWalletProgress } from "./viva-wallet-progress";
import { VivaWalletErrorDisplay } from "./viva-wallet-error-display";
import type { TransactionStatus } from "../../hooks/use-viva-wallet-transaction";

interface VivaWalletStatusProps {
  transactionStatus: TransactionStatus;
  amount: number;
  currency: string;
  terminalName: string;
  onCancel: () => void;
}

export function VivaWalletStatus({
  transactionStatus,
  amount,
  currency,
  terminalName,
  onCancel,
}: VivaWalletStatusProps) {
  const getStatusIcon = () => {
    switch (transactionStatus.status) {
      case "completed":
        return (
          <CheckCircle2 className="h-8 w-8 text-green-500 animate-in fade-in" />
        );
      case "failed":
        return (
          <XCircle className="h-8 w-8 text-red-500 animate-in fade-in" />
        );
      case "cancelled":
        return <X className="h-8 w-8 text-gray-500 animate-in fade-in" />;
      case "processing":
      case "awaiting_card":
        return (
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        );
      default:
        return (
          <CreditCard className="h-8 w-8 text-blue-500 animate-pulse" />
        );
    }
  };

  const getStatusMessage = () => {
    switch (transactionStatus.status) {
      case "pending":
        return "Preparing transaction...";
      case "processing":
        return "Processing payment...";
      case "awaiting_card":
        return "Please present your card to the terminal";
      case "completed":
        return "Payment successful!";
      case "failed":
        return (
          transactionStatus.error?.message || "Transaction failed"
        );
      case "cancelled":
        return "Transaction cancelled";
      default:
        return "Processing...";
    }
  };

  const getStatusColor = () => {
    switch (transactionStatus.status) {
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "cancelled":
        return "text-gray-600";
      default:
        return "text-blue-600";
    }
  };

  const canCancel = ["pending", "processing", "awaiting_card"].includes(
    transactionStatus.status
  );

  const isFinalState = ["completed", "failed", "cancelled"].includes(
    transactionStatus.status
  );

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardContent className="pt-6 px-6">
        <div className="flex flex-col items-center gap-4">
          {/* Status Icon */}
          <div className="flex items-center justify-center">
            {getStatusIcon()}
          </div>

          {/* Status Message */}
          <div className="text-center">
            <p
              className={`text-lg font-semibold ${getStatusColor()} mb-1`}
            >
              {getStatusMessage()}
            </p>
            <p className="text-sm text-slate-500">Terminal: {terminalName}</p>
          </div>

          {/* Amount Display */}
          <div className="text-2xl font-bold text-slate-900">
            {new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency: currency.toUpperCase(),
            }).format(amount / 100)}
          </div>

          {/* Progress Indicator */}
          {!isFinalState && (
            <div className="w-full max-w-xs">
              <VivaWalletProgress
                status={transactionStatus.status}
                progress={transactionStatus.progress || 0}
              />
            </div>
          )}

          {/* Error Display */}
          {transactionStatus.error && (
            <div className="w-full max-w-xs">
              <VivaWalletErrorDisplay error={transactionStatus.error} />
            </div>
          )}

          {/* Cancel Button */}
          {canCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="mt-2"
              disabled={!canCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Transaction
            </Button>
          )}

          {/* Success Badge */}
          {transactionStatus.status === "completed" && (
            <Badge
              variant="default"
              className="bg-green-600 text-white mt-2"
            >
              Payment Complete
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

