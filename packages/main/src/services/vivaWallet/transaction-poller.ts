/**
 * Transaction Poller for Viva Wallet
 * Handles polling for transaction status updates
 */

import { EventEmitter } from "events";
import { getLogger } from "../../utils/logger.js";
import { VivaWalletHTTPClient } from "./http-client.js";
import { PollingStrategy } from "./polling-strategy.js";
import type {
  Terminal,
  TransactionStatus,
  VivaWalletTransactionResponse,
} from "./types.js";
import type { TransactionManager } from "./transaction-manager.js";

const logger = getLogger("TransactionPoller");

// =============================================================================
// TRANSACTION POLLER
// =============================================================================

interface PollingContext {
  transactionId: string;
  terminalTransactionId: string;
  terminal: Terminal;
  startTime: number;
  attempt: number;
  httpClient: VivaWalletHTTPClient;
}

export class TransactionPoller extends EventEmitter {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private pollingContexts: Map<string, PollingContext> = new Map();
  private pollingStrategy: PollingStrategy;
  private transactionManager: TransactionManager;

  constructor(transactionManager: TransactionManager) {
    super();
    this.pollingStrategy = new PollingStrategy();
    this.transactionManager = transactionManager;
  }

  /**
   * Start polling for transaction status
   */
  async startPolling(
    transactionId: string,
    terminalTransactionId: string,
    terminal: Terminal
  ): Promise<void> {
    // Stop existing polling if any
    this.stopPolling(transactionId);

    const httpClient = new VivaWalletHTTPClient(terminal);
    const context: PollingContext = {
      transactionId,
      terminalTransactionId,
      terminal,
      startTime: Date.now(),
      attempt: 0,
      httpClient,
    };

    this.pollingContexts.set(transactionId, context);

    logger.info(`Starting polling for transaction: ${transactionId}`);

    // Start polling loop
    this.poll(context);
  }

  /**
   * Poll for transaction status
   */
  private poll(context: PollingContext): void {
    const { transactionId, terminalTransactionId, httpClient, startTime } =
      context;

    const pollInternal = async () => {
      try {
        // Check if transaction still exists
        const activeTransaction =
          this.transactionManager.getActiveTransaction(transactionId);
        if (!activeTransaction) {
          logger.warn(
            `Transaction ${transactionId} no longer active, stopping polling`
          );
          this.stopPolling(transactionId);
          return;
        }

        const elapsedTime = Date.now() - startTime;
        const maxDuration = this.pollingStrategy.getDefaultMaxDuration();

        // Check if should continue polling
        const currentState =
          activeTransaction.stateMachine?.getCurrentState() || "pending";
        if (
          !this.pollingStrategy.shouldContinuePolling(
            currentState,
            elapsedTime,
            maxDuration
          )
        ) {
          logger.info(
            `Polling timeout or terminal state reached for transaction: ${transactionId}`
          );
          this.stopPolling(transactionId);

          // Emit timeout event if timeout exceeded
          if (elapsedTime > maxDuration) {
            this.emit("transaction-timeout", {
              transactionId,
              elapsedTime,
            });
          }

          return;
        }

        // Poll for status
        const statusResponse =
          await httpClient.get<VivaWalletTransactionResponse>(
            `/api/transactions/${terminalTransactionId}/status`
          );

        // Update transaction status
        await this.handleStatusUpdate(transactionId, statusResponse);

        // Calculate next polling interval
        const interval = this.pollingStrategy.getPollingInterval(
          currentState,
          context.attempt
        );

        context.attempt++;

        // Schedule next poll
        const timeout = setTimeout(() => pollInternal(), interval);
        this.pollingIntervals.set(transactionId, timeout);
      } catch (error) {
        logger.error(`Polling error for transaction ${transactionId}:`, error);

        // Retry with backoff on error
        const retryInterval = this.pollingStrategy.getRetryInterval(
          context.attempt
        );
        context.attempt++;

        // Check if we should continue retrying
        const elapsedTime = Date.now() - startTime;
        const maxDuration = this.pollingStrategy.getDefaultMaxDuration();

        if (elapsedTime < maxDuration) {
          const timeout = setTimeout(() => pollInternal(), retryInterval);
          this.pollingIntervals.set(transactionId, timeout);
        } else {
          logger.error(
            `Polling timeout exceeded for transaction: ${transactionId}`
          );
          this.stopPolling(transactionId);
          this.emit("transaction-timeout", {
            transactionId,
            elapsedTime,
          });
        }
      }
    };

    // Start initial poll immediately
    pollInternal();
  }

  /**
   * Handle status update from terminal
   */
  private async handleStatusUpdate(
    transactionId: string,
    statusResponse: VivaWalletTransactionResponse
  ): Promise<void> {
    const context = this.pollingContexts.get(transactionId);
    if (!context) {
      return;
    }

    const activeTransaction =
      this.transactionManager.getActiveTransaction(transactionId);
    if (!activeTransaction) {
      return;
    }

    // Map terminal status to our transaction status
    const transactionStatus: TransactionStatus = {
      transactionId,
      status: statusResponse.status,
      progress: this.calculateProgress(statusResponse.status),
      message: this.getStatusMessage(statusResponse.status),
      error: statusResponse.error
        ? {
            code: statusResponse.error.code,
            message: statusResponse.error.message,
            retryable: statusResponse.error.retryable,
          }
        : undefined,
    };

    // Update state machine if available
    if (activeTransaction.stateMachine) {
      try {
        const newState = this.mapTerminalStatusToState(statusResponse.status);
        if (activeTransaction.stateMachine.canTransition(newState)) {
          activeTransaction.stateMachine.transition(
            newState,
            statusResponse.error?.message || transactionStatus.message
          );
        }
      } catch (error) {
        logger.warn(`State transition failed for ${transactionId}:`, error);
      }
    }

    // Emit status update event
    this.emit("transaction-status-update", {
      transactionId,
      status: transactionStatus,
      timestamp: new Date(),
    });

    // Handle final states
    if (["completed", "failed", "cancelled"].includes(statusResponse.status)) {
      logger.info(
        `Transaction ${transactionId} reached final state: ${statusResponse.status}`
      );
      this.stopPolling(transactionId);
      this.emit("transaction-complete", {
        transactionId,
        status: statusResponse.status,
        data: statusResponse,
      });
    }
  }

  /**
   * Map terminal status to transaction state
   */
  private mapTerminalStatusToState(
    terminalStatus: string
  ):
    | "pending"
    | "processing"
    | "awaiting_card"
    | "completed"
    | "failed"
    | "cancelled" {
    switch (terminalStatus.toLowerCase()) {
      case "pending":
        return "pending";
      case "processing":
        return "processing";
      case "awaiting_card":
        return "awaiting_card";
      case "completed":
      case "approved":
        return "completed";
      case "failed":
      case "declined":
        return "failed";
      case "cancelled":
      case "canceled":
        return "cancelled";
      default:
        return "processing";
    }
  }

  /**
   * Stop polling for transaction
   */
  stopPolling(transactionId: string): void {
    const interval = this.pollingIntervals.get(transactionId);
    if (interval) {
      clearTimeout(interval);
      this.pollingIntervals.delete(transactionId);
      logger.debug(`Stopped polling for transaction: ${transactionId}`);
    }

    this.pollingContexts.delete(transactionId);
  }

  /**
   * Stop all polling
   */
  stopAllPolling(): void {
    for (const transactionId of this.pollingIntervals.keys()) {
      this.stopPolling(transactionId);
    }
    logger.info("Stopped all transaction polling");
  }

  /**
   * Calculate progress percentage based on status
   */
  private calculateProgress(status: string): number {
    const progressMap: Record<string, number> = {
      pending: 10,
      processing: 30,
      awaiting_card: 50,
      card_present: 60,
      authorizing: 80,
      completed: 100,
      failed: 0,
      cancelled: 0,
    };

    return progressMap[status.toLowerCase()] || 0;
  }

  /**
   * Get status message
   */
  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      pending: "Transaction pending",
      processing: "Processing payment...",
      awaiting_card: "Please present your card",
      card_present: "Card detected",
      authorizing: "Authorizing transaction",
      completed: "Payment successful",
      failed: "Transaction failed",
      cancelled: "Transaction cancelled",
    };

    return messages[status.toLowerCase()] || "Processing...";
  }
}
