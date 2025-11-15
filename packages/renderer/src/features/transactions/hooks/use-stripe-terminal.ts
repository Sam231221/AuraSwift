/**
 * React Hook for BBPOS WisePad 3 Card Reader and Stripe Payment Integration
 * Manages card reader state, payment processing, and error handling
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

// Payment flow state interface
interface PaymentFlowState {
  step:
    | "idle"
    | "connecting"
    | "waiting_for_card"
    | "reading_card"
    | "processing"
    | "complete"
    | "error"
    | "cancelled";
  message: string;
  canCancel: boolean;
  progress?: number;
}

// Card reader status interface
interface CardReaderStatus {
  connected: boolean;
  deviceType: string;
  connectionType: "usb" | "bluetooth" | "none";
  batteryLevel?: number;
  firmwareVersion?: string;
  lastActivity?: string;
  error?: string;
}

// Payment result interface
interface PaymentResult {
  success: boolean;
  paymentIntent?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
  };
  error?: string;
  errorCode?: string;
}

// Card reader configuration
interface CardReaderConfig {
  type: "bbpos_wisepad3" | "simulated";
  connectionType: "usb" | "bluetooth";
  deviceId?: string;
  simulated?: boolean;
}

/**
 * Main hook for managing Stripe Terminal and BBPOS WisePad 3 integration
 */
export const useStripeTerminal = () => {
  const [readerStatus, setReaderStatus] = useState<CardReaderStatus | null>(
    null
  );
  const [paymentState, setPaymentState] = useState<PaymentFlowState>({
    step: "idle",
    message: "Ready for payment",
    canCancel: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<CardReaderConfig | null>(
    null
  );
  const [availableReaders, setAvailableReaders] = useState<
    Array<{
      type: string;
      id: string;
      name: string;
      connectionType: "usb" | "bluetooth";
    }>
  >([]);

  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const currentPaymentRef = useRef<string | null>(null);

  /**
   * Start monitoring reader status
   */
  const startStatusMonitoring = useCallback(() => {
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
    }

    statusCheckInterval.current = setInterval(async () => {
      try {
        const status = await window.paymentAPI.getReaderStatus();
        setReaderStatus(status);
      } catch (error) {
        console.error("Status check failed:", error);
      }
    }, 5000); // Check every 5 seconds
  }, []);

  /**
   * Stop monitoring reader status
   */
  const stopStatusMonitoring = useCallback(() => {
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
  }, []);

  /**
   * Initialize card reader with configuration
   */
  const initializeReader = useCallback(
    async (config: CardReaderConfig): Promise<boolean> => {
      try {
        setPaymentState({
          step: "connecting",
          message: "Connecting to card reader...",
          canCancel: false,
          progress: 20,
        });

        console.log("Initializing card reader:", config);

        const response = await window.paymentAPI.initializeReader(config);

        if (response.success) {
          setCurrentConfig(config);
          setIsInitialized(true);

          // Start status monitoring
          startStatusMonitoring();

          setPaymentState({
            step: "idle",
            message: "Card reader connected and ready",
            canCancel: false,
          });

          toast.success(`Card reader connected: ${config.type}`);

          return true;
        } else {
          throw new Error(response.error || "Failed to initialize reader");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Connection failed";

        setPaymentState({
          step: "error",
          message: errorMessage,
          canCancel: false,
        });

        toast.error(`Reader connection failed: ${errorMessage}`);
        return false;
      }
    },
    [startStatusMonitoring]
  );
  /**
   * Discover available card readers
   */
  const discoverReaders = useCallback(async (): Promise<boolean> => {
    try {
      const response = await window.paymentAPI.discoverReaders();

      if (response.success) {
        setAvailableReaders(response.readers);

        return true;
      } else {
        console.warn("⚠️ Reader discovery failed");
        return false;
      }
    } catch (error) {
      console.error("❌ Error discovering readers:", error);
      return false;
    }
  }, []);

  /**
   * Process card payment
   */
  const processPayment = useCallback(
    async (
      amount: number,
      currency: string = "gbp",
      description?: string
    ): Promise<PaymentResult> => {
      try {
        if (!isInitialized || !readerStatus?.connected) {
          throw new Error("Card reader not connected");
        }

        // Step 1: Create payment intent
        setPaymentState({
          step: "connecting",
          message: "Creating payment intent...",
          canCancel: false,
          progress: 10,
        });

        const intentResponse = await window.paymentAPI.createPaymentIntent({
          amount,
          currency,
          description:
            description || `Payment for £${(amount / 100).toFixed(2)}`,
        });

        if (!intentResponse.success || !intentResponse.clientSecret) {
          throw new Error(
            intentResponse.error || "Failed to create payment intent"
          );
        }

        const paymentIntentId =
          intentResponse.clientSecret.split("_secret_")[0];
        currentPaymentRef.current = paymentIntentId;

        // Step 2: Wait for card
        setPaymentState({
          step: "waiting_for_card",
          message: "Please swipe, tap, or insert your card",
          canCancel: true,
          progress: 25,
        });

        // Step 3: Process card payment
        const paymentResult = await window.paymentAPI.processCardPayment(
          paymentIntentId
        );

        if (paymentResult.success) {
          // Step 4: Payment successful
          setPaymentState({
            step: "complete",
            message: "Payment successful!",
            canCancel: false,
            progress: 100,
          });

          console.log(
            "Payment completed successfully:",
            paymentResult.paymentIntent?.id
          );

          // Show success message
          toast.success(`Payment successful! £${(amount / 100).toFixed(2)}`);

          // Reset state after delay
          setTimeout(() => {
            setPaymentState({
              step: "idle",
              message: "Ready for next payment",
              canCancel: false,
            });
            currentPaymentRef.current = null;
          }, 3000);

          return paymentResult;
        } else {
          throw new Error(paymentResult.error || "Payment processing failed");
        }
      } catch (error) {
        console.error("❌ Payment processing failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Payment failed";

        setPaymentState({
          step: "error",
          message: errorMessage,
          canCancel: false,
        });

        toast.error(`Payment failed: ${errorMessage}`);

        // Reset state after error display
        setTimeout(() => {
          setPaymentState({
            step: "idle",
            message: "Ready for payment",
            canCancel: false,
          });
          currentPaymentRef.current = null;
        }, 5000);

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [isInitialized, readerStatus]
  );

  /**
   * Cancel current payment
   */
  const cancelPayment = useCallback(async (): Promise<boolean> => {
    if (!currentPaymentRef.current) {
      return false;
    }

    try {
      console.log("Cancelling payment:", currentPaymentRef.current);

      const response = await window.paymentAPI.cancelPayment();

      if (response.success) {
        setPaymentState({
          step: "cancelled",
          message: "Payment cancelled",
          canCancel: false,
        });

        toast.info("Payment cancelled");

        // Reset state
        setTimeout(() => {
          setPaymentState({
            step: "idle",
            message: "Ready for payment",
            canCancel: false,
          });
          currentPaymentRef.current = null;
        }, 2000);

        return true;
      } else {
        throw new Error(response.error || "Cancel failed");
      }
    } catch (error) {
      console.error("❌ Failed to cancel payment:", error);
      toast.error("Failed to cancel payment");
      return false;
    }
  }, []);

  /**
   * Test card reader connection
   */
  const testReader = useCallback(async (): Promise<boolean> => {
    try {
      console.log("Testing card reader...");

      const response = await window.paymentAPI.testReader();

      if (response.success) {
        toast.success("Card reader test successful");
        return true;
      } else {
        toast.error(`Reader test failed: ${response.error}`);
        return false;
      }
    } catch (error) {
      console.error("❌ Reader test failed:", error);
      toast.error("Reader test failed");
      return false;
    }
  }, []);

  /**
   * Disconnect card reader
   */
  const disconnectReader = useCallback(async (): Promise<boolean> => {
    try {
      console.log("Disconnecting card reader...");

      // Stop status monitoring
      stopStatusMonitoring();

      const response = await window.paymentAPI.disconnectReader();

      if (response.success) {
        setIsInitialized(false);
        setCurrentConfig(null);
        setReaderStatus(null);
        setPaymentState({
          step: "idle",
          message: "Card reader disconnected",
          canCancel: false,
        });

        toast.info("Card reader disconnected");
        return true;
      } else {
        toast.error("Failed to disconnect reader");
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to disconnect reader:", error);
      toast.error("Failed to disconnect reader");
      return false;
    }
  }, [stopStatusMonitoring]);

  /**
   * Get current reader status
   */
  const refreshStatus = useCallback(async () => {
    try {
      const status = await window.paymentAPI.getReaderStatus();
      setReaderStatus(status);
      return status;
    } catch (error) {
      console.error("Failed to refresh status:", error);
      return null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStatusMonitoring();
    };
  }, [stopStatusMonitoring]);

  return {
    // State
    readerStatus,
    paymentState,
    isInitialized,
    currentConfig,
    availableReaders,

    // Actions
    initializeReader,
    discoverReaders,
    processPayment,
    cancelPayment,
    testReader,
    disconnectReader,
    refreshStatus,

    // Utilities
    isProcessing:
      paymentState.step !== "idle" &&
      paymentState.step !== "error" &&
      paymentState.step !== "complete",
    canProcessPayment:
      isInitialized && readerStatus?.connected && paymentState.step === "idle",
  };
};

/**
 * Simplified hook for quick card payment processing
 */
export const useCardPayment = () => {
  const {
    readerStatus,
    paymentState,
    isInitialized,
    processPayment,
    cancelPayment,
    initializeReader,
  } = useStripeTerminal();

  const [autoInitialized, setAutoInitialized] = useState(false);

  // Auto-initialize with simulated reader for development
  useEffect(() => {
    const autoInit = async () => {
      if (!autoInitialized && !isInitialized) {
        const success = await initializeReader({
          type: "simulated",
          connectionType: "usb",
          simulated: true,
        });
        if (success) {
          setAutoInitialized(true);
        }
      }
    };

    // Auto-initialize after a short delay
    const timer = setTimeout(autoInit, 1000);
    return () => clearTimeout(timer);
  }, [autoInitialized, isInitialized, initializeReader]);

  /**
   * Quick payment method with automatic initialization
   */
  const processQuickPayment = useCallback(
    async (
      amount: number,
      currency: string = "gbp"
    ): Promise<PaymentResult> => {
      if (!isInitialized) {
        // Try to auto-initialize
        const initSuccess = await initializeReader({
          type: "simulated",
          connectionType: "usb",
          simulated: true,
        });

        if (!initSuccess) {
          return {
            success: false,
            error: "Failed to initialize card reader",
          };
        }
      }

      return await processPayment(amount, currency);
    },
    [isInitialized, initializeReader, processPayment]
  );

  return {
    readerStatus,
    paymentState,
    isReady: isInitialized && readerStatus?.connected,
    processQuickPayment,
    cancelPayment,
    isProcessing: paymentState.step !== "idle" && paymentState.step !== "error",
  };
};

/**
 * Hook for handling payment errors with retry logic
 */
export const usePaymentErrorHandler = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const handlePaymentError = useCallback(
    (error: string, retryable: boolean = true) => {
      setLastError(error);

      console.error("💳 Payment error:", error);

      // Categorize error types
      if (error.includes("timeout")) {
        toast.error("Payment timeout - please try again");
      } else if (error.includes("card")) {
        toast.error("Card read error - please try again");
      } else if (error.includes("network")) {
        toast.error("Network error - check connection");
      } else if (error.includes("declined")) {
        toast.error("Payment declined - try different card");
      } else {
        toast.error(`Payment failed: ${error}`);
      }

      return retryable && retryCount < 3;
    },
    [retryCount]
  );

  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    setLastError(null);
  }, []);

  const reset = useCallback(() => {
    setRetryCount(0);
    setLastError(null);
  }, []);

  return {
    handlePaymentError,
    retry,
    reset,
    retryCount,
    lastError,
    canRetry: retryCount < 3,
  };
};
