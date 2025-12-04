/**
 * Viva Wallet API Type Definitions
 * Types for IPC communication with Viva Wallet service
 */

import type { APIResponse } from "./common";

// =============================================================================
// TERMINAL TYPES
// =============================================================================

export interface Terminal {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  status: "online" | "offline" | "busy";
  terminalType: "dedicated" | "device-based";
  paymentCapabilities: {
    supportsNFC: boolean;
    supportsCardReader: boolean;
    supportsChip: boolean;
    supportsSwipe: boolean;
    supportsTap: boolean;
  };
}

export interface DiscoverTerminalsResponse extends APIResponse {
  terminals?: Terminal[];
  error?: string;
}

export interface ConnectTerminalResponse extends APIResponse {
  terminal?: Terminal;
  error?: string;
}

export interface TerminalStatusResponse extends APIResponse {
  status?: "disconnected" | "connecting" | "connected";
  terminal?: Terminal;
  metrics?: {
    latency: number;
    uptime: number;
    lastConnectedAt: Date | null;
    reconnectAttempts: number;
    lastHealthCheck: Date | null;
  };
  error?: string;
}

// =============================================================================
// TRANSACTION TYPES
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

export interface TransactionResponse extends APIResponse {
  transactionId?: string;
  terminalTransactionId?: string;
  error?: string;
}

export interface TransactionStatusResponse extends APIResponse {
  status?: TransactionStatus;
  error?: string;
}

export interface CancelTransactionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface VivaWalletConfig {
  enabled: boolean;
  terminals: Array<{
    id: string;
    name: string;
    ipAddress: string;
    port: number;
    apiKey?: string;
    enabled: boolean;
    autoConnect: boolean;
    terminalType: "dedicated" | "device-based";
    deviceInfo?: {
      platform?: "android" | "ios" | "paydroid";
      deviceModel?: string;
      osVersion?: string;
    };
  }>;
  defaultTerminalId?: string;
  timeout?: {
    connection: number;
    transaction: number;
    polling: number;
  };
  retry?: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  network?: {
    scanRange?: string;
    scanPort?: number;
    useMDNS?: boolean;
  };
}

export interface ConfigResponse extends APIResponse {
  config?: VivaWalletConfig;
  error?: string;
}

export interface TestConnectionResponse extends APIResponse {
  isConnected?: boolean;
  capabilities?: {
    isDeviceBased: boolean;
    deviceType?: "android" | "ios" | "paydroid";
    hasCardReader: boolean;
    supportedPaymentMethods: ("tap" | "chip" | "swipe")[];
    nfcEnabled: boolean;
  };
  error?: string;
}

// =============================================================================
// API INTERFACE
// =============================================================================

export interface VivaWalletAPI {
  // Terminal Discovery
  discoverTerminals: () => Promise<DiscoverTerminalsResponse>;
  connectTerminal: (terminalId: string) => Promise<ConnectTerminalResponse>;
  disconnectTerminal: () => Promise<APIResponse>;
  getTerminalStatus: () => Promise<TerminalStatusResponse>;

  // Transactions
  initiateSale: (
    amount: number,
    currency: string
  ) => Promise<TransactionResponse>;
  initiateRefund: (
    originalTransactionId: string,
    amount: number,
    currency: string
  ) => Promise<TransactionResponse>;
  cancelTransaction: (
    transactionId: string
  ) => Promise<CancelTransactionResponse>;

  // Status
  getTransactionStatus: (
    transactionId: string
  ) => Promise<TransactionStatusResponse>;

  // Configuration
  getConfig: () => Promise<ConfigResponse>;
  saveConfig: (config: VivaWalletConfig) => Promise<APIResponse>;
  testConnection: (terminalId: string) => Promise<TestConnectionResponse>;
}

