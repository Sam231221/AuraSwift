/**
 * Hook for managing payment processing
 * Handles payment method selection, cash/card payments, transaction completion, and receipt handling
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import type { PaymentMethod } from "../types/transaction.types";
import type { TransactionData } from "@/types/printer";
import type { CartSession, CartItemWithProduct } from "../../types/cart.types";
import {
  validateCashPayment,
  validateCart,
  validateBusinessId,
} from "../utils/validation";

interface UsePaymentProps {
  cartSession: CartSession | null;
  cartItems: CartItemWithProduct[];
  subtotal: number;
  tax: number;
  total: number;
  userId: string | undefined;
  businessId: string | undefined;
  userFirstName: string | undefined;
  userLastName: string | undefined;
  userBusinessName: string | undefined;
  cardReaderReady: boolean;
  cardProcessing: boolean;
  processQuickPayment: (
    amountInCents: number,
    currency: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  cancelPayment: () => Promise<void>;
  startPrintingFlow: (data: TransactionData) => Promise<boolean>;
  isShowingStatus: boolean;
  onResetPrintStatus?: () => void;
  onCartSessionInit?: () => Promise<void>;
}

/**
 * Default business details constants
 */
const DEFAULT_BUSINESS_DETAILS = {
  address: "123 Main Street, London, W1A 1AA",
  phone: "+44 20 1234 5678",
  vatNumber: "GB123456789",
} as const;

/**
 * Helper: Calculate payment amounts based on payment method
 */
const calculatePaymentAmounts = (
  paymentMethod: PaymentMethod["type"],
  cashAmount: number,
  total: number
): { cashAmount: number | undefined; cardAmount: number | undefined } => {
  switch (paymentMethod) {
    case "cash":
      return { cashAmount, cardAmount: undefined };
    case "card":
    case "mobile":
      return { cashAmount: undefined, cardAmount: total };
    case "voucher":
    case "split":
    default:
      return { cashAmount: undefined, cardAmount: undefined };
  }
};

/**
 * Helper: Get success message for transaction completion
 * FIX #14: Centralized success message logic to avoid duplication
 * This function is used consistently for all transaction completion success messages
 */
const getTransactionSuccessMessage = (
  paymentMethod: PaymentMethod | null,
  cashAmount: number,
  total: number,
  skipPaymentValidation: boolean
): string => {
  if (paymentMethod?.type === "cash") {
    const change = cashAmount - total;
    return change > 0
      ? `Transaction complete! Change: £${change.toFixed(2)}`
      : "Transaction complete! Exact change received.";
  }

  if (skipPaymentValidation) {
    return "Transaction complete! Paid by card";
  }

  return `Transaction complete! Paid by ${paymentMethod?.type || "unknown"}`;
};

/**
 * Helper: Create receipt data from transaction details
 */
const createReceiptData = (
  receiptNumber: string,
  cartItems: CartItemWithProduct[],
  subtotal: number,
  tax: number,
  total: number,
  userId: string,
  userFirstName: string | undefined,
  userLastName: string | undefined,
  businessId: string,
  userBusinessName: string | undefined,
  paymentMethod: PaymentMethod | null,
  cashAmount: number,
  skipPaymentValidation: boolean
): TransactionData => {
  const amountPaid = skipPaymentValidation
    ? total
    : paymentMethod?.type === "cash"
    ? cashAmount
    : total;

  const change = skipPaymentValidation
    ? 0
    : paymentMethod?.type === "cash"
    ? Math.max(0, cashAmount - total)
    : 0;

  return {
    id: receiptNumber,
    timestamp: new Date(),
    cashierId: userId,
    cashierName: `${userFirstName || ""} ${userLastName || ""}`.trim(),
    businessId,
    businessName: userBusinessName || "AuraSwift POS",
    items: cartItems.map((item) => ({
      id: item.productId || item.categoryId || item.id || "",
      name: item.itemName || item.product?.name || "Unknown Item",
      quantity: item.itemType === "UNIT" ? item.quantity || 1 : 1,
      price: item.unitPrice,
      total: item.totalPrice,
      sku: item.product?.sku || "",
      category: item.product?.category || "",
    })),
    subtotal,
    tax,
    discount: 0,
    total,
    amountPaid,
    change,
    paymentMethods: [
      {
        type: skipPaymentValidation
          ? "card"
          : paymentMethod?.type === "mobile"
          ? "digital"
          : paymentMethod?.type === "voucher" || paymentMethod?.type === "split"
          ? "other"
          : paymentMethod?.type || "cash",
        amount: skipPaymentValidation
          ? total
          : paymentMethod?.type === "cash"
          ? cashAmount
          : total,
      },
    ],
    receiptNumber,
  };
};

/**
 * Hook for managing payment
 * @param props - Payment configuration props
 * @returns Payment state and operations
 */
export function usePayment({
  cartSession,
  cartItems,
  subtotal,
  tax,
  total,
  userId,
  businessId,
  userFirstName,
  userLastName,
  userBusinessName,
  cardReaderReady,
  cardProcessing,
  processQuickPayment,
  cancelPayment,
  startPrintingFlow,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isShowingStatus, // Unused - kept for interface compatibility, will be used in future
  onResetPrintStatus,
  onCartSessionInit,
}: UsePaymentProps) {
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [cashAmount, setCashAmount] = useState(0);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [showCardPayment, setShowCardPayment] = useState(false);
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [completedTransactionData, setCompletedTransactionData] =
    useState<TransactionData | null>(null);
  const [printerStatus, setPrinterStatus] = useState<{
    connected: boolean;
    error: string | null;
  }>({ connected: true, error: null });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Race condition protection: prevent concurrent transaction processing
  const isProcessingRef = useRef(false);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Reset payment state to initial values
   */
  const resetPaymentState = useCallback(() => {
    setPaymentStep(false);
    setPaymentMethod(null);
    setTransactionComplete(false);
    setCashAmount(0);
    setShowCardPayment(false);
    setCompletedTransactionData(null);
    setPrinterStatus({ connected: true, error: null });
  }, []);

  /**
   * Reset payment state and initialize new cart session
   */
  const resetAndInitCart = useCallback(async () => {
    try {
      resetPaymentState();
      if (onCartSessionInit) {
        await onCartSessionInit();
      }
    } catch (error) {
      console.error("Failed to reset and init cart:", error);
      toast.error("Failed to reset cart. Please refresh the page.");
    }
  }, [resetPaymentState, onCartSessionInit]);

  /**
   * Check printer status and handle warnings
   */
  const checkPrinterStatus = useCallback(async (): Promise<{
    connected: boolean;
    error: string | null;
  }> => {
    let status = { connected: true, error: null as string | null };

    if (!window.printerAPI) {
      return status;
    }

    try {
      const apiStatus = await window.printerAPI.getStatus();
      status = {
        connected: apiStatus.connected,
        error: apiStatus.error ?? null,
      };

      if (!status.connected) {
        toast.warning(
          "Printer is not connected. You can still complete the transaction and print later.",
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error("Failed to check printer status:", error);
      status = {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    return status;
  }, []);

  /**
   * Handle receipt generation and display after successful transaction
   * Shows receipt options modal for all payment types
   */
  const handleReceiptAfterTransaction = useCallback(
    async (
      receiptNumber: string,
      printerStatusResult: { connected: boolean; error: string | null },
      skipPaymentValidation: boolean,
      validatedUserId: string,
      validatedBusinessId: string
    ) => {
      // Create receipt data
      const receiptData = createReceiptData(
        receiptNumber,
        cartItems,
        subtotal,
        tax,
        total,
        validatedUserId,
        userFirstName,
        userLastName,
        validatedBusinessId,
        userBusinessName,
        paymentMethod,
        cashAmount,
        skipPaymentValidation
      );

      // FIX #5: Wrap state updates in try-catch to handle partial state update failures
      try {
        // Reset print status if callback provided
        if (onResetPrintStatus) {
          flushSync(() => {
            onResetPrintStatus();
          });
        }

        // Set printer status and show receipt options modal for all payment types
        setPrinterStatus(printerStatusResult);

        flushSync(() => {
          setCompletedTransactionData(receiptData);
          setShowReceiptOptions(true);
        });

        // Show success message
        const successMessage = getTransactionSuccessMessage(
          paymentMethod,
          cashAmount,
          total,
          skipPaymentValidation
        );
        toast.success(successMessage);
      } catch (error) {
        console.error("Failed to update UI state after transaction:", error);
        toast.error(
          "Transaction completed but UI update failed. Please refresh the page.",
          { duration: 10000 }
        );
        // Still show receipt options even if some state updates failed
        // This ensures user can still access receipt functionality
        try {
          setCompletedTransactionData(receiptData);
          setShowReceiptOptions(true);
        } catch (retryError) {
          console.error("Failed to set receipt data on retry:", retryError);
        }
      }
    },
    [
      cartItems,
      subtotal,
      tax,
      total,
      userFirstName,
      userLastName,
      userBusinessName,
      paymentMethod,
      cashAmount,
      onResetPrintStatus,
    ]
  );

  /**
   * Complete transaction - handles only transaction creation and cart completion
   */
  const completeTransaction = useCallback(
    async (
      skipPaymentValidation = false,
      actualPaymentMethod?: PaymentMethod["type"]
    ) => {
      // CRITICAL FIX #2: Race condition protection
      if (isProcessingRef.current) {
        toast.warning("Transaction is already being processed. Please wait...");
        return;
      }

      if (transactionComplete) {
        toast.warning("Transaction already completed.");
        return;
      }

      isProcessingRef.current = true;

      try {
        // Validate payment method
        if (!skipPaymentValidation) {
          if (!paymentMethod) {
            toast.error("Please select a payment method");
            isProcessingRef.current = false;
            return;
          }

          // CRITICAL FIX #3: Validate split and voucher payments
          if (paymentMethod.type === "split") {
            // For split payments, we need both cash and card amounts
            // Note: This assumes split payment UI provides both amounts
            // If not implemented yet, show error
            toast.error(
              "Split payment requires both cash and card amounts. Please select a different payment method."
            );
            isProcessingRef.current = false;
            return;
          }

          if (paymentMethod.type === "voucher") {
            // Voucher payments need voucher validation
            // If not implemented yet, show error
            toast.error(
              "Voucher payment is not yet implemented. Please select a different payment method."
            );
            isProcessingRef.current = false;
            return;
          }

          if (paymentMethod.type === "cash") {
            const validation = validateCashPayment(cashAmount, total);
            if (!validation.valid) {
              toast.error(validation.error || "Invalid cash payment");
              isProcessingRef.current = false;
              return;
            }
          }
        }

        // Validate prerequisites
        const cartValidation = validateCart(cartItems);
        if (!cartValidation.valid) {
          toast.error(cartValidation.error || "Cart validation failed");
          isProcessingRef.current = false;
          return;
        }

        if (!userId) {
          toast.error("User ID not found");
          isProcessingRef.current = false;
          return;
        }

        if (!cartSession) {
          toast.error("Cart session not found");
          isProcessingRef.current = false;
          return;
        }

        if (!businessId) {
          toast.error("Business ID not found");
          isProcessingRef.current = false;
          return;
        }

        const businessValidation = validateBusinessId(businessId);
        if (!businessValidation.valid) {
          toast.error(businessValidation.error || "Business validation failed");
          isProcessingRef.current = false;
          return;
        }

        // Check printer status (non-blocking)
        let printerStatusResult = {
          connected: true,
          error: null as string | null,
        };
        try {
          printerStatusResult = await checkPrinterStatus();
        } catch (error) {
          console.warn("Failed to check printer status:", error);
          // Continue with transaction - printer check is not critical
        }

        try {
          // Get active shift
          const shiftResponse = await window.shiftAPI.getActive(userId);
          if (!shiftResponse.success || !shiftResponse.data) {
            toast.error(
              "No active shift found. Please start your shift first."
            );
            isProcessingRef.current = false;
            return;
          }

          // FIX #13: Validate shift data structure before using
          const shiftData = shiftResponse.data;
          if (
            !shiftData ||
            typeof shiftData !== "object" ||
            !("id" in shiftData) ||
            typeof shiftData.id !== "string"
          ) {
            toast.error("Invalid shift data received. Please try again.");
            // FIX #6: Cleanup timeout before returning on error
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            isProcessingRef.current = false;
            return;
          }
          const activeShift = shiftData as { id: string };
          // FIX #9: Add random component to prevent receipt number collision
          const receiptNumber = `RCP-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 7)}`;

          // Determine payment details - FIX #4: Use actual payment method when provided
          let backendPaymentMethod: PaymentMethod["type"];
          if (skipPaymentValidation) {
            // When skipping validation, use the actual payment method if provided
            // Otherwise default to card (only valid if we know card payment was processed)
            backendPaymentMethod = actualPaymentMethod || "card";

            // Add validation warning if no payment method context
            if (!actualPaymentMethod && !paymentMethod) {
              console.warn(
                "skipPaymentValidation is true but no payment method context provided"
              );
            }
          } else {
            backendPaymentMethod = paymentMethod?.type || "cash";
          }

          const { cashAmount: finalCashAmount, cardAmount: finalCardAmount } =
            calculatePaymentAmounts(backendPaymentMethod, cashAmount, total);

          // FIX #12: Gate console.log for development only
          if (process.env.NODE_ENV === "development") {
            console.log("💳 Creating transaction with payment method:", {
              selectedPaymentMethod: paymentMethod?.type,
              skipPaymentValidation,
              backendPaymentMethod,
              cashAmount: finalCashAmount,
              cardAmount: finalCardAmount,
              total,
            });
          }

          // Create transaction
          const transactionResponse =
            await window.transactionAPI.createFromCart({
              cartSessionId: cartSession.id,
              shiftId: activeShift.id,
              businessId,
              paymentMethod: backendPaymentMethod,
              cashAmount: finalCashAmount,
              cardAmount: finalCardAmount,
              receiptNumber,
            });

          if (!transactionResponse.success) {
            const errorMessage =
              transactionResponse.message || "Failed to record transaction";
            console.error("Transaction creation error:", errorMessage);
            toast.error(errorMessage);
            // FIX #6: Cleanup timeout before returning on error
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            isProcessingRef.current = false;
            return;
          }

          // Get transaction ID for potential rollback
          const transactionId =
            (transactionResponse.data as { id?: string })?.id || null;

          // CRITICAL FIX #1: Complete cart session with rollback on failure
          try {
            await window.cartAPI.completeSession(cartSession.id);
          } catch (error) {
            console.error("Failed to complete cart session:", error);

            // Attempt to void the transaction to maintain data integrity
            if (transactionId && userId) {
              try {
                await window.voidAPI.voidTransaction({
                  transactionId,
                  cashierId: userId,
                  reason: "Cart session completion failed - automatic void",
                });
                console.log(
                  "Transaction voided successfully after cart completion failure"
                );
              } catch (voidError) {
                console.error(
                  "Failed to void transaction after cart completion failure:",
                  voidError
                );
                // Log critical error - transaction exists but cart not completed
                // This requires manual intervention
              }
            }

            toast.error(
              "Transaction created but cart session update failed. Transaction has been voided. Please contact support.",
              { duration: 10000 }
            );
            // FIX #6: Cleanup timeout before returning on error
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            isProcessingRef.current = false;
            return;
          }

          // Mark transaction as complete
          setTransactionComplete(true);

          // Handle receipt generation and display after successful transaction
          await handleReceiptAfterTransaction(
            receiptNumber,
            printerStatusResult,
            skipPaymentValidation,
            userId,
            businessId
          );
        } catch (error) {
          console.error("Transaction error:", error);
          // FIX #11: Consistent error message formatting with details
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to complete transaction";
          toast.error(`Transaction failed: ${errorMessage}`);
          // FIX #6: Cleanup timeout before returning on error
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          return;
        }
      } finally {
        // CRITICAL FIX #2: Always reset processing flag
        isProcessingRef.current = false;
      }
    },
    [
      paymentMethod,
      cashAmount,
      total,
      cartSession,
      cartItems,
      userId,
      businessId,
      checkPrinterStatus,
      handleReceiptAfterTransaction,
      transactionComplete,
    ]
  );

  /**
   * Handle payment method selection and process card payments
   */
  const handlePayment = useCallback(
    async (method: PaymentMethod["type"]) => {
      setShowCardPayment(false);
      setPaymentMethod({ type: method });

      if (method === "cash") {
        setCashAmount(total);
        return;
      }

      // Handle card/mobile payments
      if (method === "card" || method === "mobile") {
        try {
          // FIX #8: Initial card reader check
          if (!cardReaderReady) {
            toast.error("Card reader not ready. Please check connection.");
            return;
          }

          setShowCardPayment(true);

          const amountInCents = Math.round(total * 100);
          // FIX #12: Gate console.log for development only
          if (process.env.NODE_ENV === "development") {
            console.log("💳 Starting card payment:", {
              amount: amountInCents,
              total,
              currency: "gbp",
            });
          }

          // FIX #8: Re-check reader status right before processing payment
          // This prevents payment attempts if reader disconnects between check and processing
          if (!cardReaderReady) {
            toast.error(
              "Card reader disconnected. Please reconnect and try again."
            );
            resetPaymentState();
            return;
          }

          const result = await processQuickPayment(amountInCents, "gbp");

          if (result.success) {
            toast.success("Card payment successful!");
            // Complete transaction with skipPaymentValidation since card is already processed
            // FIX #4: Pass the actual payment method (card or mobile) to ensure correct recording
            // FIX #7: Wrap in try-catch to reset state if transaction completion fails
            try {
              await completeTransaction(true, method);
              // Only reset card payment UI if transaction completes successfully
              setShowCardPayment(false);
            } catch (error) {
              console.error(
                "Transaction completion failed after card payment:",
                error
              );
              // FIX #11: Consistent error message with details
              const errorDetails =
                error instanceof Error ? error.message : "Unknown error";
              toast.error(
                `Card payment succeeded but transaction failed: ${errorDetails}. Please contact support.`,
                { duration: 10000 }
              );
              resetPaymentState();
            }
          } else {
            // FIX #11: Consistent error message formatting
            const errorDetails = result.error || "Unknown error";
            toast.error(`Card payment failed: ${errorDetails}`);
            resetPaymentState();
          }
        } catch (error) {
          console.error("Card payment error:", error);
          // FIX #11: Consistent error message with details
          const errorDetails =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(`Card payment failed: ${errorDetails}`);
          resetPaymentState();
        }
      }
    },
    [
      total,
      cardReaderReady,
      processQuickPayment,
      resetPaymentState,
      completeTransaction,
    ]
  );

  /**
   * Handler for downloading receipt as PDF
   */
  const handleDownloadReceipt = useCallback(async () => {
    if (!completedTransactionData || !userId) return;

    const loadingToast = toast.loading("Generating PDF receipt...");

    try {
      // Fetch business details
      let businessDetails = {
        name: completedTransactionData.businessName || "AuraSwift POS",
        address: "",
        phone: "",
        vatNumber: "",
      };

      if (businessId) {
        try {
          const businessResponse = await window.authAPI.getBusinessById(
            businessId
          );
          if (businessResponse.success && businessResponse.business) {
            businessDetails = {
              name: businessResponse.business.businessName,
              address:
                businessResponse.business.address ||
                DEFAULT_BUSINESS_DETAILS.address,
              phone:
                businessResponse.business.phone ||
                DEFAULT_BUSINESS_DETAILS.phone,
              vatNumber:
                businessResponse.business.vatNumber ||
                DEFAULT_BUSINESS_DETAILS.vatNumber,
            };
          }
        } catch (error) {
          console.warn(
            "Failed to fetch business details, using defaults:",
            error
          );
        }
      }

      // Prepare receipt data for PDF
      const receiptData = {
        storeName: businessDetails.name,
        storeAddress: businessDetails.address,
        storePhone: businessDetails.phone,
        vatNumber: businessDetails.vatNumber,
        receiptNumber: completedTransactionData.receiptNumber,
        transactionId:
          completedTransactionData.id || completedTransactionData.receiptNumber,
        date: new Date(completedTransactionData.timestamp).toLocaleDateString(
          "en-GB"
        ),
        time: new Date(completedTransactionData.timestamp).toLocaleTimeString(
          "en-GB",
          { hour: "2-digit", minute: "2-digit" }
        ),
        cashierId: userId || "unknown",
        cashierName: completedTransactionData.cashierName || "Unknown",
        items: completedTransactionData.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.total,
          sku: item.sku || "",
        })),
        subtotal: completedTransactionData.subtotal,
        tax: completedTransactionData.tax,
        total: completedTransactionData.total,
        paymentMethod:
          completedTransactionData.paymentMethods[0]?.type || "cash",
        cashAmount: completedTransactionData.amountPaid,
        change: completedTransactionData.change,
      };

      // Generate PDF
      const result = await window.pdfReceiptAPI.generatePDF(receiptData);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to generate PDF");
      }

      // Decode and download PDF
      const binaryString = atob(result.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt_${completedTransactionData.receiptNumber}.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success("PDF receipt downloaded successfully!", {
        id: loadingToast,
      });

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error generating PDF receipt:", error);
      toast.error("Failed to generate PDF receipt. Please try again.", {
        id: loadingToast,
      });
    }
  }, [completedTransactionData, userId, businessId]);

  /**
   * Handler for closing receipt options modal
   */
  const handleCloseReceiptOptions = useCallback(async () => {
    setShowReceiptOptions(false);
    await resetAndInitCart();
    toast.success("Ready for next customer!");
  }, [resetAndInitCart]);

  /**
   * Handler for printing receipt
   */
  const handlePrintReceipt = useCallback(async () => {
    if (!completedTransactionData) return;

    try {
      toast.info("Printing receipt...");
      const printResult = await startPrintingFlow(completedTransactionData);

      if (printResult) {
        toast.success("Receipt printed successfully!");
        setTimeout(() => {
          handleCloseReceiptOptions();
        }, 1500);
      } else {
        toast.error(
          "Failed to print receipt. Please check printer connection."
        );
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print receipt");
    }
  }, [completedTransactionData, startPrintingFlow, handleCloseReceiptOptions]);

  /**
   * Handler for emailing receipt
   */
  const handleEmailReceiptOption = useCallback(async () => {
    if (!completedTransactionData) return;

    try {
      toast.info("Email receipt feature coming soon!");
      setTimeout(() => {
        handleCloseReceiptOptions();
      }, 2000);
    } catch (error) {
      console.error("Email error:", error);
      toast.error("Failed to send receipt email");
    }
  }, [completedTransactionData, handleCloseReceiptOptions]);

  /**
   * Handler for canceling payment from receipt modal
   */
  const handleCancelPayment = useCallback(async () => {
    const confirmed = window.confirm(
      "⚠️ Cancel Receipt?\n\n" +
        "The transaction has already been completed and saved.\n" +
        "Are you sure you want to skip the receipt?\n\n" +
        "You can print it later from transaction history."
    );

    if (confirmed) {
      setShowReceiptOptions(false);
      setCompletedTransactionData(null);
      setTransactionComplete(false);
      setPrinterStatus({ connected: true, error: null });
      await resetAndInitCart();
      toast.info("Receipt skipped. Transaction saved in history.");
    }
  }, [resetAndInitCart]);

  /**
   * Cancel card payment
   */
  const handleCancelCardPayment = useCallback(async () => {
    if (cardProcessing) {
      await cancelPayment();
    }
    resetPaymentState();
  }, [cardProcessing, cancelPayment, resetPaymentState]);

  /**
   * Retry card payment
   */
  const handleRetryCardPayment = useCallback(async () => {
    const method = paymentMethod?.type || "card";
    await handlePayment(method);
  }, [handlePayment, paymentMethod]);

  return {
    paymentStep,
    paymentMethod,
    cashAmount,
    transactionComplete,
    showCardPayment,
    showReceiptOptions,
    completedTransactionData,
    printerStatus,
    setPaymentStep,
    setCashAmount,
    setPaymentMethod: (method: PaymentMethod | null) =>
      setPaymentMethod(method),
    setTransactionComplete: (complete: boolean) =>
      setTransactionComplete(complete),
    setShowCardPayment: (show: boolean) => setShowCardPayment(show),
    handlePayment,
    completeTransaction,
    handleDownloadReceipt,
    handlePrintReceipt,
    handleEmailReceiptOption,
    handleCloseReceiptOptions,
    handleCancelPayment,
    handleCancelCardPayment,
    handleRetryCardPayment,
  };
}
