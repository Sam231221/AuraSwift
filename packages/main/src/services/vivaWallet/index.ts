/**
 * Viva Wallet Service - Public API Exports
 * Main entry point for Viva Wallet integration
 */

export { vivaWalletService, VivaWalletService } from "./vivaWalletService.js";
export * from "./types.js";
export {
  ErrorClassifier,
  RetryManager,
  NetworkError,
  TerminalError,
  TransactionErrorClass,
  ConfigurationError,
} from "./error-handler.js";
export type { RetryConfig } from "./error-handler.js";
export { ErrorMessageMapper } from "./errors/error-messages.js";
export { ErrorLogger } from "./errors/error-logger.js";
export type { ErrorMetrics } from "./errors/error-logger.js";
export { CircuitBreaker, CircuitState } from "./retry/circuit-breaker.js";
export type { CircuitBreakerConfig } from "./retry/circuit-breaker.js";
export {
  TransactionRecovery,
  PendingTransactionStorage,
} from "./recovery/transaction-recovery.js";
export { StatePersistence } from "./recovery/state-persistence.js";
export { VivaWalletConfigManager } from "./config.js";
export { TerminalDiscovery } from "./terminal-discovery.js";
export { NetworkScanner } from "./network-scanner.js";
export { TerminalCache } from "./terminal-cache.js";
export { TerminalConnection } from "./terminal-connection.js";
export { TransactionManager } from "./transaction-manager.js";
export { TransactionRequestBuilder } from "./transaction-builder.js";
export { TransactionStateMachine } from "./transaction-state-machine.js";
export { TransactionPoller } from "./transaction-poller.js";
export { PollingStrategy } from "./polling-strategy.js";
export { VivaWalletHTTPClient } from "./http-client.js";
