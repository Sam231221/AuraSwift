/**
 * React hook for managing Viva Wallet transactions
 * Handles transaction initiation, status polling, and cancellation
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("use-viva-wallet-transaction");

// =============================================================================
// TYPES
// =============================================================================

export interface TransactionStatus {
  transactionId: string;
  status:
    | "pending"
    | "processing"
    | "awaiting_card"
    | "completed"
    | "failed"
    | "cancelled";
  progress?: number;
  message?: string;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

// =============================================================================
// HOOK
// =============================================================================

export function useVivaWalletTransaction() {
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenerCleanupRef = useRef<(() => void) | null>(null);

  /**
   * Cleanup polling and event listeners on unmount
   */
  useEffect(() => {
    return () => {
      stopPolling();
      if (eventListenerCleanupRef.current) {
        eventListenerCleanupRef.current();
      }
    };
  }, []);

  /**
   * Set up event listeners for transaction updates from main process
   */
  const setupEventListeners = useCallback((_transactionId: string) => {
    if (!window.vivaWalletAPI) return;

    // Listen for transaction events from main process
    // Note: Currently relying on polling for status updates
    // This structure allows for future event-based updates if implemented
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleTransactionEvent = (_event: any, _data: any) => {
      // TODO: Implement event listener when IPC events are set up
      // This function is reserved for future event-based status updates
      // Will use _transactionId to filter events for this specific transaction
    };

    // Listen for transaction events (if supported via IPC)
    // Note: This depends on how events are forwarded from main process
    // For now, we'll rely on polling but this structure allows for event-based updates

    return () => {
      // Cleanup function (if events are implemented)
      void handleTransactionEvent; // Suppress unused variable warning
    };
  }, []);

  /**
   * Initiate a transaction
   */
  const initiateTransaction = useCallback(
    async (amount: number, currency: string): Promise<string | null> => {
      setIsProcessing(true);

      try {
        if (!window.vivaWalletAPI) {
          throw new Error("Viva Wallet API not available");
        }

        logger.info(`Initiating transaction: ${amount} ${currency}`);

        const result = await window.vivaWalletAPI.initiateSale(amount, currency);

        if (result.success && result.transactionId) {
          setTransactionStatus({
            transactionId: result.transactionId,
            status: "pending",
            progress: 0,
            message: "Transaction initiated",
          });

          // Set up event listeners
          setupEventListeners(result.transactionId);

          // Start polling for status
          startPolling(result.transactionId);

          logger.info(`Transaction initiated: ${result.transactionId}`);
          return result.transactionId;
        } else {
          throw new Error(result.error || "Failed to initiate transaction");
        }
      } catch (error) {
        logger.error("Failed to initiate transaction:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to initiate transaction";
        toast.error(errorMessage);
        setIsProcessing(false);
        return null;
      }
    },
    [setupEventListeners]
  );

  /**
   * Start polling for transaction status
   */
  const startPolling = useCallback((transactionId: string) => {
    // Clear existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const poll = async () => {
      try {
        const result = await window.vivaWalletAPI?.getTransactionStatus(transactionId);

        if (result?.success && result.status) {
          const status = result.status;
          setTransactionStatus({
            transactionId: status.transactionId,
            status: status.status,
            progress: status.progress,
            message: status.message,
            error: status.error,
          });

          // Stop polling if transaction is in final state
          if (["completed", "failed", "cancelled"].includes(status.status)) {
            stopPolling();
            setIsProcessing(false);

            if (status.status === "completed") {
              toast.success("Payment successful!");
            } else if (status.status === "failed") {
              toast.error(status.error?.message || "Transaction failed");
            }
          }
        }
      } catch (error) {
        logger.error("Failed to poll transaction status:", error);
        // Continue polling on error - don't stop
      }
    };

    // Poll every 500ms for active transactions
    pollingIntervalRef.current = setInterval(poll, 500);

    // Initial poll
    poll();
  }, []);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Cancel transaction
   */
  const cancelTransaction = useCallback(async () => {
    if (!transactionStatus) return;

    try {
      if (!window.vivaWalletAPI) {
        throw new Error("Viva Wallet API not available");
      }

      logger.info(`Cancelling transaction: ${transactionStatus.transactionId}`);

      const result = await window.vivaWalletAPI.cancelTransaction(
        transactionStatus.transactionId
      );

      if (result?.success) {
        stopPolling();
        setTransactionStatus({
          ...transactionStatus,
          status: "cancelled",
          message: "Transaction cancelled",
        });
        setIsProcessing(false);
        toast.info("Transaction cancelled");
        return true;
      } else {
        throw new Error(result?.error || "Failed to cancel transaction");
      }
    } catch (error) {
      logger.error("Failed to cancel transaction:", error);
      toast.error("Failed to cancel transaction");
      return false;
    }
  }, [transactionStatus, stopPolling]);

  /**
   * Reset transaction state
   */
  const resetTransaction = useCallback(() => {
    stopPolling();
    setTransactionStatus(null);
    setIsProcessing(false);
  }, [stopPolling]);

  return {
    transactionStatus,
    isProcessing,
    initiateTransaction,
    cancelTransaction,
    resetTransaction,
    stopPolling,
  };
}

