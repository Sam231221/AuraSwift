/**
 * Viva Wallet Error Display Component
 * Shows user-friendly error messages with actionable suggestions
 */

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface VivaWalletErrorDisplayProps {
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
  onRetry?: () => void;
}

export function VivaWalletErrorDisplay({
  error,
  onRetry,
}: VivaWalletErrorDisplayProps) {
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Payment Error</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="font-medium">{error.message}</p>
        {error.retryable && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
