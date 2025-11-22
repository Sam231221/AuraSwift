/**
 * TypeScript type definitions for Payment API
 * Defines interfaces for BBPOS WisePad 3
 */

export interface PaymentAPI {
  // Card Reader Operations
  initializeReader: (
    config: CardReaderConfig
  ) => Promise<{ success: boolean; error?: string }>;
  discoverReaders: () => Promise<{
    success: boolean;
    readers: Array<{
      type: string;
      id: string;
      name: string;
      connectionType: "usb" | "bluetooth";
    }>;
  }>;
  getReaderStatus: () => Promise<CardReaderStatus>;
  testReader: () => Promise<{ success: boolean; error?: string }>;
  disconnectReader: () => Promise<{ success: boolean }>;

  // Payment Processing
  createPaymentIntent: (data: PaymentIntentData) => Promise<{
    success: boolean;
    clientSecret?: string;
    error?: string;
  }>;
  processCardPayment: (paymentIntentId: string) => Promise<PaymentResult>;
  cancelPayment: () => Promise<{ success: boolean; error?: string }>;

  // Connection Token
  getConnectionToken: () => Promise<{
    success: boolean;
    secret?: string;
    error?: string;
  }>;
}

export interface CardReaderConfig {
  type: "bbpos_wisepad3" | "simulated";
  connectionType: "usb" | "bluetooth";
  deviceId?: string;
  simulated?: boolean;
}

export interface PaymentIntentData {
  amount: number; // in cents
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
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
  error?: string;
  errorCode?: string;
  requiresAction?: boolean;
  clientSecret?: string;
}

export interface CardReaderStatus {
  connected: boolean;
  deviceType: string;
  connectionType: "usb" | "bluetooth" | "none";
  batteryLevel?: number;
  firmwareVersion?: string;
  lastActivity?: string;
  error?: string;
}

export interface PaymentFlowState {
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
  progress?: number; // 0-100
}

export interface CardTransaction {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: "card_swipe" | "card_tap" | "card_insert";
  cardInfo?: {
    brand: string;
    last4: string;
    expiry?: string;
  };
  timestamp: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  receiptData?: {
    receiptNumber: string;
    authCode?: string;
    transactionId?: string;
  };
}

export interface PaymentError {
  code: string;
  message: string;
  type: "reader_error" | "network_error" | "payment_error" | "user_error";
  retryable: boolean;
  details?: Record<string, any>;
}

export interface ReaderCapabilities {
  supportsSwipe: boolean;
  supportsTap: boolean;
  supportsChip: boolean;
  supportsPinEntry: boolean;
  batteryPowered: boolean;
  firmwareUpdatable: boolean;
}

export interface PaymentSettings {
  currency: string;
  merchantId: string;
  applicationName: string;
  timeout: number; // seconds
  enableTip: boolean;
  enableReceipts: boolean;
  autoCompletePayments: boolean;
}

// Global type augmentation for window.paymentAPI
declare global {
  interface Window {
    paymentAPI: PaymentAPI;
  }
}
