/**
 * Payment Flow Business Logic for BBPOS WisePad 3
 * Handles state management, retry logic, and error handling for card transactions
 */

import { toast } from "sonner";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('payment-flow');

// Payment flow step definitions
export const PaymentStep = {
  IDLE: "idle",
  INITIALIZING: "initializing",
  CREATING_INTENT: "creating_intent",
  WAITING_FOR_CARD: "waiting_for_card",
  READING_CARD: "reading_card",
  PROCESSING: "processing",
  CONFIRMING: "confirming",
  COMPLETE: "complete",
  ERROR: "error",
  CANCELLED: "cancelled",
  TIMEOUT: "timeout",
} as const;

export type PaymentStepType = (typeof PaymentStep)[keyof typeof PaymentStep];

// Payment method types
export const PaymentMethodType = {
  CARD_SWIPE: "card_swipe",
  CARD_TAP: "card_tap",
  CARD_INSERT: "card_insert",
} as const;

export type PaymentMethodTypeValue =
  (typeof PaymentMethodType)[keyof typeof PaymentMethodType];

// Error categories for better handling
export const PaymentErrorType = {
  READER_ERROR: "reader_error",
  NETWORK_ERROR: "network_error",
  PAYMENT_ERROR: "payment_error",
  USER_ERROR: "user_error",
  TIMEOUT_ERROR: "timeout_error",
  DECLINED_ERROR: "declined_error",
} as const;

export type PaymentErrorTypeValue =
  (typeof PaymentErrorType)[keyof typeof PaymentErrorType];

export interface PaymentError {
  type: PaymentErrorTypeValue;
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface PaymentFlowConfig {
  amount: number; // in cents
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
  timeout?: number; // in milliseconds
  maxRetries?: number;
  autoRetry?: boolean;
}

export interface PaymentFlowState {
  step: PaymentStepType;
  progress: number; // 0-100
  message: string;
  canCancel: boolean;
  error?: PaymentError;
  startTime?: number;
  paymentIntentId?: string;
}

export interface PaymentFlowResult {
  success: boolean;
  paymentIntent?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    payment_method?: {
      type: string;
      card?: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
      };
    };
  };
  transactionId?: string;
  receiptData?: {
    authCode?: string;
    transactionReference?: string;
    cardBrand?: string;
    cardLast4?: string;
  };
  error?: PaymentError;
  duration?: number; // in milliseconds
}

/**
 * Main Payment Flow class with comprehensive state management
 */
export class PaymentFlow {
  private config: PaymentFlowConfig;
  private state: PaymentFlowState;
  private retryCount: number = 0;
  private timeoutHandle?: NodeJS.Timeout;
  private onStateChange?: (state: PaymentFlowState) => void;
  private onComplete?: (result: PaymentFlowResult) => void;

  constructor(
    config: PaymentFlowConfig,
    callbacks?: {
      onStateChange?: (state: PaymentFlowState) => void;
      onComplete?: (result: PaymentFlowResult) => void;
    }
  ) {
    this.config = {
      timeout: 60000, // 60 seconds default
      maxRetries: 3,
      autoRetry: false,
      ...config,
    };

    this.state = {
      step: PaymentStep.IDLE,
      progress: 0,
      message: "Ready to process payment",
      canCancel: false,
    };

    this.onStateChange = callbacks?.onStateChange;
    this.onComplete = callbacks?.onComplete;
  }

  /**
   * Execute the complete payment flow
   */
  public async execute(): Promise<PaymentFlowResult> {
    const startTime = Date.now();
    this.state.startTime = startTime;

    try {
      logger.info("Starting payment flow:", {
        amount: this.config.amount,
        currency: this.config.currency,
      });

      // Step 1: Initialize payment
      await this.stepInitialize();

      // Step 2: Create payment intent
      await this.stepCreatePaymentIntent();

      // Step 3: Collect payment method
      await this.stepCollectPaymentMethod();

      // Step 4: Process payment
      const paymentResult = await this.stepProcessPayment();

      // Step 5: Confirm and complete
      const result = await this.stepComplete(paymentResult);

      const duration = Date.now() - startTime;
      logger.info(`Payment flow completed in ${duration}ms`);

      const finalResult: PaymentFlowResult = {
        ...result,
        duration,
      };

      this.onComplete?.(finalResult);
      return finalResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("❌ Payment flow failed:", error);

      const paymentError = this.createPaymentError(error);

      this.updateState({
        step: PaymentStep.ERROR,
        progress: 0,
        message: paymentError.message,
        canCancel: false,
        error: paymentError,
      });

      const failureResult: PaymentFlowResult = {
        success: false,
        error: paymentError,
        duration,
      };

      this.onComplete?.(failureResult);
      return failureResult;
    } finally {
      this.clearTimeout();
    }
  }

  /**
   * Step 1: Initialize payment flow
   */
  private async stepInitialize(): Promise<void> {
    this.updateState({
      step: PaymentStep.INITIALIZING,
      progress: 5,
      message: "Initializing payment...",
      canCancel: true,
    });

    // Check if reader is connected
    const readerStatus = await window.paymentAPI.getReaderStatus();
    if (!readerStatus.connected) {
      throw new Error("Card reader not connected");
    }

    // Set timeout for entire flow
    this.setTimeout();

    await this.delay(500); // Brief pause for UI feedback
  }

  /**
   * Step 2: Create payment intent
   */
  private async stepCreatePaymentIntent(): Promise<void> {
    this.updateState({
      step: PaymentStep.CREATING_INTENT,
      progress: 15,
      message: "Creating payment intent...",
      canCancel: true,
    });

    const intentResponse = await window.paymentAPI.createPaymentIntent({
      amount: this.config.amount,
      currency: this.config.currency,
      description: this.config.description,
      metadata: this.config.metadata,
    });

    if (!intentResponse.success || !intentResponse.clientSecret) {
      throw new Error(
        intentResponse.error || "Failed to create payment intent"
      );
    }

    // Extract payment intent ID
    const paymentIntentId = intentResponse.clientSecret.split("_secret_")[0];
    this.state.paymentIntentId = paymentIntentId;

    logger.info("Payment intent created:", paymentIntentId);
  }

  /**
   * Step 3: Collect payment method from card reader
   */
  private async stepCollectPaymentMethod(): Promise<void> {
    this.updateState({
      step: PaymentStep.WAITING_FOR_CARD,
      progress: 25,
      message: "Please swipe, tap, or insert your card",
      canCancel: true,
    });

    // Show helpful instructions
    this.showPaymentInstructions();

    await this.delay(1000); // Give user time to read instructions
  }

  /**
   * Step 4: Process the card payment
   */
  private async stepProcessPayment(): Promise<{
    success: boolean;
    paymentIntent?: {
      id: string;
      amount: number;
      currency: string;
      status: string;
    };
    error?: string;
  }> {
    if (!this.state.paymentIntentId) {
      throw new Error("No payment intent ID available");
    }

    this.updateState({
      step: PaymentStep.READING_CARD,
      progress: 40,
      message: "Reading card...",
      canCancel: true,
    });

    // Process card payment through BBPOS reader
    const paymentResult = await window.paymentAPI.processCardPayment(
      this.state.paymentIntentId
    );

    if (!paymentResult.success) {
      throw new Error(paymentResult.error || "Payment processing failed");
    }

    this.updateState({
      step: PaymentStep.PROCESSING,
      progress: 70,
      message: "Processing payment...",
      canCancel: false,
    });

    return paymentResult;
  }

  /**
   * Step 5: Complete and confirm payment
   */
  private async stepComplete(paymentResult: {
    success: boolean;
    paymentIntent?: {
      id: string;
      amount: number;
      currency: string;
      status: string;
    };
    error?: string;
  }): Promise<PaymentFlowResult> {
    this.updateState({
      step: PaymentStep.CONFIRMING,
      progress: 90,
      message: "Confirming payment...",
      canCancel: false,
    });

    await this.delay(1000); // Processing delay

    this.updateState({
      step: PaymentStep.COMPLETE,
      progress: 100,
      message: "Payment successful!",
      canCancel: false,
    });

    // Show success message
    const amount = (this.config.amount / 100).toFixed(2);
    toast.success(`Payment successful! $${amount}`);

    return {
      success: true,
      paymentIntent: paymentResult.paymentIntent,
      transactionId: paymentResult.paymentIntent?.id,
      receiptData: this.extractReceiptData(paymentResult),
    };
  }

  /**
   * Cancel the current payment flow
   */
  public async cancel(): Promise<boolean> {
    try {
      logger.info("Cancelling payment flow");

      if (this.state.paymentIntentId) {
        await window.paymentAPI.cancelPayment();
      }

      this.updateState({
        step: PaymentStep.CANCELLED,
        progress: 0,
        message: "Payment cancelled",
        canCancel: false,
      });

      this.clearTimeout();
      toast.info("Payment cancelled");

      return true;
    } catch (error) {
      logger.error("❌ Failed to cancel payment:", error);
      return false;
    }
  }

  /**
   * Retry the payment flow
   */
  public async retry(): Promise<PaymentFlowResult> {
    if (this.retryCount >= (this.config.maxRetries || 3)) {
      throw new Error("Maximum retry attempts exceeded");
    }

    this.retryCount++;
    logger.info(`Retrying payment (attempt ${this.retryCount})`);

    // Reset state
    this.state = {
      step: PaymentStep.IDLE,
      progress: 0,
      message: `Retrying payment (${this.retryCount}/${this.config.maxRetries})...`,
      canCancel: false,
      startTime: this.state.startTime,
    };

    return await this.execute();
  }

  /**
   * Get current payment flow state
   */
  public getState(): PaymentFlowState {
    return { ...this.state };
  }

  /**
   * Update payment flow state
   */
  private updateState(updates: Partial<PaymentFlowState>): void {
    this.state = { ...this.state, ...updates };
    this.onStateChange?.(this.state);
  }

  /**
   * Set timeout for payment flow
   */
  private setTimeout(): void {
    if (this.config.timeout) {
      this.timeoutHandle = setTimeout(() => {
        this.handleTimeout();
      }, this.config.timeout);
    }
  }

  /**
   * Clear timeout
   */
  private clearTimeout(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = undefined;
    }
  }

  /**
   * Handle payment timeout
   */
  private handleTimeout(): void {
    logger.warn("⏰ Payment flow timeout");

    this.updateState({
      step: PaymentStep.TIMEOUT,
      progress: 0,
      message: "Payment timeout - please try again",
      canCancel: false,
      error: {
        type: PaymentErrorType.TIMEOUT_ERROR,
        code: "payment_timeout",
        message: "Payment timed out",
        retryable: true,
      },
    });

    toast.error("Payment timeout - please try again");
  }

  /**
   * Create a standardized payment error
   */
  private createPaymentError(error: unknown): PaymentError {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Categorize errors
    if (errorMessage.includes("timeout")) {
      return {
        type: PaymentErrorType.TIMEOUT_ERROR,
        code: "payment_timeout",
        message: "Payment timed out",
        retryable: true,
      };
    } else if (errorMessage.includes("declined")) {
      return {
        type: PaymentErrorType.DECLINED_ERROR,
        code: "card_declined",
        message: "Card was declined",
        retryable: false,
      };
    } else if (errorMessage.includes("network")) {
      return {
        type: PaymentErrorType.NETWORK_ERROR,
        code: "network_error",
        message: "Network connection error",
        retryable: true,
      };
    } else if (errorMessage.includes("reader")) {
      return {
        type: PaymentErrorType.READER_ERROR,
        code: "reader_error",
        message: "Card reader error",
        retryable: true,
      };
    } else {
      return {
        type: PaymentErrorType.PAYMENT_ERROR,
        code: "payment_failed",
        message: errorMessage,
        retryable: true,
      };
    }
  }

  /**
   * Extract receipt data from payment result
   */
  private extractReceiptData(paymentResult: {
    paymentIntent?: {
      id: string;
      charges?: { data?: Array<{ authorization_code?: string }> };
      payment_method?: { card?: { brand?: string; last4?: string } };
    };
  }): {
    authCode?: string;
    transactionReference?: string;
    cardBrand?: string;
    cardLast4?: string;
  } {
    return {
      authCode:
        paymentResult.paymentIntent?.charges?.data?.[0]?.authorization_code,
      transactionReference: paymentResult.paymentIntent?.id,
      cardBrand: paymentResult.paymentIntent?.payment_method?.card?.brand,
      cardLast4: paymentResult.paymentIntent?.payment_method?.card?.last4,
    };
  }

  /**
   * Show payment instructions to user
   */
  private showPaymentInstructions(): void {
    toast.info("Present your card to the reader", {
      duration: 5000,
      description: "Swipe, tap, or insert your card",
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Error handler utility class
 */
export class PaymentErrorHandler {
  private static readonly ERROR_MESSAGES: Record<string, string> = {
    card_declined: "Your card was declined. Please try a different card.",
    insufficient_funds: "Insufficient funds. Please try a different card.",
    card_read_error: "Card read error. Please try again.",
    reader_timeout: "Reader timeout. Please try again.",
    network_error: "Network error. Please check your connection.",
    reader_not_connected: "Card reader not connected. Please check connection.",
    payment_timeout: "Payment timed out. Please try again.",
    unknown_error: "An unknown error occurred. Please try again.",
  };

  public static getErrorMessage(error: PaymentError): string {
    return this.ERROR_MESSAGES[error.code] || error.message;
  }

  public static isRetryable(error: PaymentError): boolean {
    const nonRetryableErrors = [
      "card_declined",
      "insufficient_funds",
      "expired_card",
      "invalid_card",
    ];

    return error.retryable && !nonRetryableErrors.includes(error.code);
  }

  public static shouldAutoRetry(
    error: PaymentError,
    retryCount: number
  ): boolean {
    const autoRetryableErrors = [
      "network_error",
      "reader_timeout",
      "card_read_error",
    ];

    return (
      retryCount < 2 &&
      autoRetryableErrors.includes(error.code) &&
      error.retryable
    );
  }

  public static getRetryDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, retryCount), 5000);
  }
}

/**
 * Utility functions for payment processing
 */
export class PaymentUtils {
  /**
   * Format amount for display
   */
  public static formatAmount(amount: number, currency = "gbp"): string {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  /**
   * Validate payment amount
   */
  public static validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 999999; // Max $9,999.99
  }

  /**
   * Generate transaction ID
   */
  public static generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Mask card number for display
   */
  public static maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 4) return cardNumber;
    return "**** **** **** " + cardNumber.slice(-4);
  }

  /**
   * Get card brand from number
   */
  public static getCardBrand(cardNumber: string): string {
    const firstDigit = cardNumber.charAt(0);
    const firstTwoDigits = cardNumber.substring(0, 2);

    if (firstDigit === "4") return "visa";
    if (["51", "52", "53", "54", "55"].includes(firstTwoDigits))
      return "mastercard";
    if (["34", "37"].includes(firstTwoDigits)) return "amex";
    if (firstTwoDigits === "60") return "discover";

    return "unknown";
  }
}
