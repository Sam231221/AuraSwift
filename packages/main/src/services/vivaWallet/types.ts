/**
 * Type definitions for Viva Wallet Local Terminal API integration
 * Includes support for device-as-terminal capability
 */

// =============================================================================
// TERMINAL TYPES
// =============================================================================

export interface Terminal {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  status: "online" | "offline" | "busy";
  firmwareVersion?: string;
  capabilities: string[];
  lastSeen: Date;
  connectionType: "wifi" | "ethernet";

  // Device-as-Terminal Properties
  terminalType: "dedicated" | "device-based";
  deviceInfo?: {
    platform: "android" | "ios" | "paydroid";
    deviceModel?: string;
    osVersion?: string;
  };
  paymentCapabilities: {
    supportsNFC: boolean;
    supportsCardReader: boolean;
    supportsChip: boolean;
    supportsSwipe: boolean;
    supportsTap: boolean;
  };
  apiKey?: string; // Optional, stored separately in config
}

export interface TerminalCapabilities {
  isDeviceBased: boolean;
  deviceType?: "android" | "ios" | "paydroid";
  hasCardReader: boolean;
  supportedPaymentMethods: ("tap" | "chip" | "swipe")[];
  nfcEnabled: boolean;
}

export interface TerminalStatus {
  terminalId: string;
  status: "ready" | "busy" | "offline";
  firmwareVersion?: string;
  capabilities: string[];
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface TerminalConfig {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  apiKey: string;
  enabled: boolean;
  autoConnect: boolean;
  terminalType?: "dedicated" | "device-based";
  deviceInfo?: {
    platform?: "android" | "ios" | "paydroid";
    deviceModel?: string;
    osVersion?: string;
  };
  lastSeen?: Date;
}

export interface VivaWalletConfig {
  enabled: boolean;
  terminals: TerminalConfig[];
  defaultTerminalId?: string;
  timeout: {
    connection: number; // milliseconds
    transaction: number; // milliseconds
    polling: number; // milliseconds
  };
  retry: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  network: {
    scanRange?: string; // e.g., "192.168.1.0/24"
    scanPort?: number;
    useMDNS?: boolean;
  };
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export interface VivaWalletSaleRequest {
  amount: number; // in minor units (cents)
  currency: string; // ISO 4217 currency code
  reference: string; // Unique reference from POS
  description?: string;
  metadata?: Record<string, string>;
}

export interface VivaWalletRefundRequest {
  originalTransactionId: string; // Terminal transaction ID of original sale
  amount: number; // in minor units (cents)
  currency: string; // ISO 4217 currency code
  reference: string; // Unique reference from POS for refund
  description?: string;
  metadata?: Record<string, string>;
}

export interface VivaWalletTransactionResponse {
  transactionId: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  amount: number;
  currency: string;
  cardDetails?: {
    last4: string;
    brand: string;
    type: "DEBIT" | "CREDIT";
    expiryMonth?: number;
    expiryYear?: number;
  };
  authCode?: string;
  timestamp: string;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface TransactionStatus {
  transactionId: string;
  status:
    | "pending"
    | "processing"
    | "awaiting_card"
    | "completed"
    | "failed"
    | "cancelled";
  progress?: number; // 0-100 for UI progress indicator
  message?: string;
  requiresAction?: boolean;
  error?: TransactionError;
}

export interface TransactionError {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, any>;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export enum ErrorCode {
  // Network Errors
  NETWORK_CONNECTION_REFUSED = "NETWORK_CONNECTION_REFUSED",
  NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
  NETWORK_UNREACHABLE = "NETWORK_UNREACHABLE",
  DNS_RESOLUTION_FAILED = "DNS_RESOLUTION_FAILED",
  SSL_HANDSHAKE_FAILED = "SSL_HANDSHAKE_FAILED",

  // Terminal Errors
  TERMINAL_OFFLINE = "TERMINAL_OFFLINE",
  TERMINAL_BUSY = "TERMINAL_BUSY",
  TERMINAL_ERROR = "TERMINAL_ERROR",
  TERMINAL_FIRMWARE_MISMATCH = "TERMINAL_FIRMWARE_MISMATCH",
  TERMINAL_NOT_FOUND = "TERMINAL_NOT_FOUND",
  TERMINAL_AUTH_FAILED = "TERMINAL_AUTH_FAILED",

  // Transaction Errors
  TRANSACTION_DECLINED = "TRANSACTION_DECLINED",
  TRANSACTION_INSUFFICIENT_FUNDS = "TRANSACTION_INSUFFICIENT_FUNDS",
  TRANSACTION_EXPIRED_CARD = "TRANSACTION_EXPIRED_CARD",
  TRANSACTION_CANCELLED = "TRANSACTION_CANCELLED",
  TRANSACTION_TIMEOUT = "TRANSACTION_TIMEOUT",
  TRANSACTION_INVALID_AMOUNT = "TRANSACTION_INVALID_AMOUNT",

  // Configuration Errors
  CONFIG_INVALID_IP = "CONFIG_INVALID_IP",
  CONFIG_INVALID_PORT = "CONFIG_INVALID_PORT",
  CONFIG_MISSING_API_KEY = "CONFIG_MISSING_API_KEY",
  CONFIG_INVALID_CREDENTIALS = "CONFIG_INVALID_CREDENTIALS",
  CONFIG_TERMINAL_NOT_CONFIGURED = "CONFIG_TERMINAL_NOT_CONFIGURED",

  // System Errors
  SYSTEM_STATE_INCONSISTENT = "SYSTEM_STATE_INCONSISTENT",
  SYSTEM_DATA_CORRUPTION = "SYSTEM_DATA_CORRUPTION",
  SYSTEM_UNKNOWN_ERROR = "SYSTEM_UNKNOWN_ERROR",
}

export enum ErrorSeverity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export interface VivaWalletError extends Error {
  code: ErrorCode;
  severity: ErrorSeverity;
  retryable: boolean;
  terminalId?: string;
  transactionId?: string;
  context?: Record<string, any>;
  timestamp: Date;
  originalError?: Error;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

export interface StatusUpdateEvent {
  transactionId: string;
  status: TransactionStatus;
  timestamp: Date;
}

export interface TerminalEvent {
  type: "connected" | "disconnected" | "status_changed";
  terminalId: string;
  data?: any;
  timestamp: Date;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface TerminalStatusResponse {
  terminalId: string;
  status: "ready" | "busy" | "offline";
  firmwareVersion?: string;
  capabilities: string[];
  deviceType?: string;
  platform?: string;
  hasCardReader?: boolean;
  nfcEnabled?: boolean;
}

export interface DiscoverTerminalsResponse {
  success: boolean;
  terminals?: Terminal[];
  error?: string;
}

export interface ConnectTerminalResponse {
  success: boolean;
  terminal?: Terminal;
  error?: string;
}

export interface TransactionResponse {
  success: boolean;
  transactionId?: string;
  terminalTransactionId?: string;
  status?: TransactionStatus;
  error?: string;
}
