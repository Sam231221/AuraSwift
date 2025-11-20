/**
 * Hook for managing payment processing
 * Handles payment method selection, cash/card payments, transaction completion, and receipt handling
 */

import { useState, useCallback } from "react";
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
  isShowingStatus,
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

  /**
   * Handle payment method selection
   */
  const handlePayment = useCallback(
    async (method: PaymentMethod["type"]) => {
      // Reset any previous payment state before starting new payment
      setShowCardPayment(false);

      setPaymentMethod({ type: method });

      if (method === "cash") {
        setCashAmount(total);
      } else if (method === "card" || method === "mobile") {
        // Start card payment flow
        await handleCardPayment();
      }
    },
    [total]
  );

  /**
   * Handle card payment
   */
  const handleCardPayment = useCallback(async () => {
    try {
      if (!cardReaderReady) {
        toast.error("Card reader not ready. Please check connection.");
        return;
      }

      setShowCardPayment(true);

      // Convert total from dollars to cents
      const amountInCents = Math.round(total * 100);

      console.log("💳 Starting card payment:", {
        amount: amountInCents,
        total: total,
        currency: "gbp",
      });

      const result = await processQuickPayment(amountInCents, "gbp");

      if (result.success) {
        toast.success("Card payment successful!");

        // Automatically complete the transaction
        await completeTransactionWithCardPayment();
      } else {
        toast.error(`Card payment failed: ${result.error}`);
        // Reset payment state on failure
        setShowCardPayment(false);
        setPaymentMethod(null);
        setPaymentStep(false);
      }
    } catch (error) {
      console.error("Card payment error:", error);
      toast.error("Card payment failed");
      // Reset payment state on error
      setShowCardPayment(false);
      setPaymentMethod(null);
      setPaymentStep(false);
    }
  }, [cardReaderReady, total, processQuickPayment]);

  /**
   * Complete transaction with card payment (already processed)
   */
  const completeTransactionWithCardPayment = useCallback(async () => {
    // Continue with the existing transaction completion logic
    // but skip the payment validation since card payment is already processed
    await completeTransaction(true);
  }, []);

  /**
   * Complete transaction
   */
  const completeTransaction = useCallback(
    async (skipPaymentValidation = false) => {
      // Validate payment method (skip for card payments already processed)
      if (!skipPaymentValidation) {
        if (!paymentMethod) {
          toast.error("Please select a payment method");
          return;
        }

        // Validate cash payment
        if (paymentMethod.type === "cash") {
          const validation = validateCashPayment(cashAmount, total);
          if (!validation.valid) {
            toast.error(validation.error || "Invalid cash payment");
            return;
          }
        }
      }

      // Check printer status only for non-cash payments (cash payments show receipt options modal)
      // Skip printer check for cash payments since they'll get receipt options modal
      const isCashPayment =
        !skipPaymentValidation && paymentMethod?.type === "cash";
      if (!isCashPayment && window.printerAPI) {
        try {
          const printerStatus = await window.printerAPI.getStatus();

          if (!printerStatus.connected) {
            const proceed = window.confirm(
              "⚠️ Printer is not connected. Receipt cannot be printed.\n\n" +
                "Do you want to complete the transaction without printing a receipt?\n" +
                "You can manually print the receipt later from transaction history."
            );

            if (!proceed) {
              toast.warning(
                "Transaction cancelled. Please connect printer first."
              );
              return;
            }

            toast.warning(
              "Transaction will complete without printed receipt.",
              {
                duration: 5000,
              }
            );
          }
        } catch (error) {
          console.error("Failed to check printer status:", error);
          // Continue anyway - don't block transaction on printer status check failure
        }
      }

      // Validate cart
      const cartValidation = validateCart(cartItems);
      if (!cartValidation.valid) {
        toast.error(cartValidation.error || "Cart validation failed");
        return;
      }

      // Validate business ID
      const businessValidation = validateBusinessId(businessId);
      if (!businessValidation.valid) {
        toast.error(businessValidation.error || "Business validation failed");
        return;
      }

      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      try {
        // Get active shift for the cashier
        const shiftResponse = await window.shiftAPI.getActive(userId);
        if (!shiftResponse.success || !shiftResponse.data) {
          toast.error("No active shift found. Please start your shift first.");
          return;
        }

        const activeShift = shiftResponse.data as { id: string };

        // Generate receipt number
        const receiptNumber = `RCP-${Date.now()}`;

        // Map payment method to backend format
        let backendPaymentMethod: "cash" | "card" | "mixed";
        if (skipPaymentValidation) {
          // Card payment already processed
          backendPaymentMethod = "card";
        } else if (paymentMethod?.type === "cash") {
          backendPaymentMethod = "cash";
        } else if (
          paymentMethod?.type === "card" ||
          paymentMethod?.type === "mobile"
        ) {
          backendPaymentMethod = "card";
        } else {
          backendPaymentMethod = "mixed"; // For voucher/split payments
        }

        // Use createFromCart API to create transaction from cart session
        const transactionResponse = await window.transactionAPI.createFromCart({
          cartSessionId: cartSession!.id,
          shiftId: activeShift.id,
          businessId: businessId!,
          paymentMethod: backendPaymentMethod,
          cashAmount: skipPaymentValidation
            ? undefined
            : paymentMethod?.type === "cash"
            ? cashAmount
            : undefined,
          cardAmount: skipPaymentValidation
            ? total
            : paymentMethod?.type === "card" || paymentMethod?.type === "mobile"
            ? total
            : undefined,
          receiptNumber,
        });

        if (!transactionResponse.success) {
          const errorMessage =
            transactionResponse.message || "Failed to record transaction";
          console.error("Transaction creation error:", errorMessage);
          toast.error(errorMessage);
          return;
        }

        // Complete the cart session
        await window.cartAPI.completeSession(cartSession!.id);

        setTransactionComplete(true);

        // Prepare receipt data for thermal printing
        const receiptData: TransactionData = {
          id: receiptNumber,
          timestamp: new Date(),
          cashierId: userId,
          cashierName: `${userFirstName || ""} ${userLastName || ""}`.trim(),
          businessId: businessId!,
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
          amountPaid: skipPaymentValidation
            ? total
            : paymentMethod?.type === "cash"
            ? cashAmount
            : total,
          change: skipPaymentValidation
            ? 0
            : paymentMethod?.type === "cash"
            ? Math.max(0, cashAmount - total)
            : 0,
          paymentMethods: [
            {
              type: skipPaymentValidation
                ? "card"
                : paymentMethod?.type === "mobile"
                ? "digital"
                : paymentMethod?.type === "voucher" ||
                  paymentMethod?.type === "split"
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

        // For cash payments, show receipt options modal instead of auto-printing
        if (!skipPaymentValidation && paymentMethod?.type === "cash") {
          // Reset any printer status FIRST to ensure printer modal doesn't show
          // This must happen before setting showReceiptOptions to prevent modal conflict
          if (onResetPrintStatus) {
            onResetPrintStatus();
          }

          // Ensure printer status is cleared before showing receipt options
          // Set receipt options AFTER resetting printer status
          setShowReceiptOptions(true);
          setCompletedTransactionData(receiptData);
          setTransactionComplete(true);

          // Show success message with payment details
          const change = cashAmount - total;
          if (change > 0) {
            toast.success(
              `Transaction complete! Change: £${change.toFixed(2)}`
            );
          } else {
            toast.success("Transaction complete! Exact change received.");
          }

          // TODO: Update inventory levels for sold products
          // TODO: Open cash drawer for cash payments
          return; // Don't proceed with auto-printing
        }

        // Start thermal printing flow with enhanced error handling (for card/other payments)
        try {
          const printResult = await startPrintingFlow(receiptData);

          if (!printResult) {
            // Print failed but transaction is already saved
            toast.error(
              "⚠️ Receipt failed to print. Transaction saved. You can reprint from transaction history.",
              { duration: 10000 }
            );
          }
        } catch (printError) {
          console.error("Print error:", printError);
          toast.error(
            "⚠️ Receipt printing error. Transaction completed but receipt not printed. Check printer connection.",
            { duration: 10000 }
          );
        }

        // Show success message with payment details
        // Check actual payment method first, not skipPaymentValidation flag
        if (paymentMethod?.type === "cash") {
          const change = cashAmount - total;
          if (change > 0) {
            toast.success(
              `Transaction complete! Change: £${change.toFixed(2)}`
            );
          } else {
            toast.success("Transaction complete! Exact change received.");
          }
        } else if (skipPaymentValidation) {
          // Card payment already processed
          toast.success("Transaction complete! Paid by card");
        } else {
          toast.success(`Transaction complete! Paid by ${paymentMethod?.type}`);
        }

        // TODO: Update inventory levels for sold products
        // TODO: Open cash drawer for cash payments
      } catch (error) {
        console.error("Transaction error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to complete transaction";
        toast.error(errorMessage);
        return;
      }

      // Only reset automatically if no printer modal is showing
      if (!isShowingStatus) {
        setTimeout(async () => {
          // Create new cart session for next customer
          if (onCartSessionInit) {
            await onCartSessionInit();
          }
          setPaymentStep(false);
          setPaymentMethod(null);
          setTransactionComplete(false);
          setCashAmount(0);
          setShowCardPayment(false);
        }, 3000);
      }
    },
    [
      cartSession,
      cartItems,
      subtotal,
      tax,
      total,
      paymentMethod,
      cashAmount,
      userId,
      businessId,
      userFirstName,
      userLastName,
      userBusinessName,
      startPrintingFlow,
      isShowingStatus,
      onResetPrintStatus,
      onCartSessionInit,
    ]
  );

  /**
   * Handler for downloading receipt as PDF
   */
  const handleDownloadReceipt = useCallback(async () => {
    if (!completedTransactionData || !userId) return;

    // Show loading toast with ID so we can update it
    const loadingToast = toast.loading("Generating PDF receipt...");

    try {
      // Fetch business details from database
      let businessDetails = {
        name: completedTransactionData.businessName || "AuraSwift POS",
        address: "",
        phone: "",
        vatNumber: "",
      };
      // Then show a toast warning if fields are empty after fetch
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
                "123 Main Street, London, W1A 1AA",
              phone: businessResponse.business.phone || "+44 20 1234 5678",
              vatNumber: businessResponse.business.vatNumber || "GB123456789",
            };
          }
        } catch (error) {
          console.warn(
            "Failed to fetch business details, using defaults:",
            error
          );
        }
      }

      // Prepare receipt data for PDF generation
      const receiptData = {
        // Store Information
        storeName: businessDetails.name,
        storeAddress: businessDetails.address,
        storePhone: businessDetails.phone,
        vatNumber: businessDetails.vatNumber,

        // Transaction Details
        receiptNumber: completedTransactionData.receiptNumber,
        transactionId:
          completedTransactionData.id || completedTransactionData.receiptNumber,
        date: new Date(completedTransactionData.timestamp).toLocaleDateString(
          "en-GB"
        ),
        time: new Date(completedTransactionData.timestamp).toLocaleTimeString(
          "en-GB",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        cashierId: userId || "unknown",
        cashierName: completedTransactionData.cashierName || "Unknown",

        // Items
        items: completedTransactionData.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.total,
          sku: item.sku || "",
        })),

        // Financial
        subtotal: completedTransactionData.subtotal,
        tax: completedTransactionData.tax,
        total: completedTransactionData.total,
        paymentMethod: "cash" as const,
        cashAmount: completedTransactionData.amountPaid,
        change: completedTransactionData.change,
      };

      // Generate PDF via IPC bridge (main process)
      const result = await window.pdfReceiptAPI.generatePDF(receiptData);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to generate PDF");
      }

      // Decode base64 string to binary data
      const binaryString = atob(result.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob from binary data
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Create anchor element to trigger download with save dialog
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt_${completedTransactionData.receiptNumber}.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Update loading toast to success
      toast.success("PDF receipt downloaded successfully!", {
        id: loadingToast,
      });

      // Cleanup blob URL after a delay to ensure download completes
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
   * Handler for printing receipt
   */
  const handlePrintReceipt = useCallback(async () => {
    if (!completedTransactionData) return;

    try {
      toast.info("Printing receipt...");
      const printResult = await startPrintingFlow(completedTransactionData);

      if (printResult) {
        toast.success("Receipt printed successfully!");

        // Close modal and reset after successful print
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
  }, [completedTransactionData, startPrintingFlow]);

  /**
   * Handler for emailing receipt
   */
  const handleEmailReceiptOption = useCallback(async () => {
    if (!completedTransactionData) return;

    try {
      // For now, just show info - implement email functionality later
      toast.info("Email receipt feature coming soon!");

      // Close modal after a delay
      setTimeout(() => {
        handleCloseReceiptOptions();
      }, 2000);
    } catch (error) {
      console.error("Email error:", error);
      toast.error("Failed to send receipt email");
    }
  }, [completedTransactionData]);

  /**
   * Handler for closing receipt options modal (skip receipt)
   */
  const handleCloseReceiptOptions = useCallback(async () => {
    setShowReceiptOptions(false);

    // Create new cart session for next customer
    if (onCartSessionInit) {
      await onCartSessionInit();
    }
    setPaymentStep(false);
    setPaymentMethod(null);
    setTransactionComplete(false);
    setCashAmount(0);
    setCompletedTransactionData(null);

    toast.success("Ready for next customer!");
  }, [onCartSessionInit]);

  /**
   * Handler for canceling payment from receipt modal
   */
  const handleCancelPayment = useCallback(async () => {
    // Show confirmation dialog
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

      // Create new cart session for next customer
      if (onCartSessionInit) {
        await onCartSessionInit();
      }
      setPaymentStep(false);
      setPaymentMethod(null);
      setCashAmount(0);

      toast.info("Receipt skipped. Transaction saved in history.");
    }
  }, [onCartSessionInit]);

  /**
   * Cancel card payment
   */
  const handleCancelCardPayment = useCallback(async () => {
    if (cardProcessing) {
      await cancelPayment();
    }
    // Fully reset payment state
    setShowCardPayment(false);
    setPaymentMethod(null);
    setPaymentStep(false);
  }, [cardProcessing, cancelPayment]);

  /**
   * Retry card payment
   */
  const handleRetryCardPayment = useCallback(async () => {
    await handleCardPayment();
  }, [handleCardPayment]);

  return {
    paymentStep,
    paymentMethod,
    cashAmount,
    transactionComplete,
    showCardPayment,
    showReceiptOptions,
    completedTransactionData,
    setPaymentStep,
    setCashAmount,
    setPaymentMethod: (method: PaymentMethod | null) =>
      setPaymentMethod(method),
    setTransactionComplete: (complete: boolean) =>
      setTransactionComplete(complete),
    setShowCardPayment: (show: boolean) => setShowCardPayment(show),
    handlePayment,
    handleCardPayment,
    completeTransaction,
    completeTransactionWithCardPayment,
    handleDownloadReceipt,
    handlePrintReceipt,
    handleEmailReceiptOption,
    handleCloseReceiptOptions,
    handleCancelPayment,
    handleCancelCardPayment,
    handleRetryCardPayment,
  };
}
