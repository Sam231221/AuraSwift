/**
 * Transaction Manager for Viva Wallet transactions
 * Handles transaction initiation, status polling, and lifecycle management
 */

import { getLogger } from "../../utils/logger.js";
import { VivaWalletHTTPClient } from "./http-client.js";
import { TransactionRequestBuilder } from "./transaction-builder.js";
import { TransactionStateMachine } from "./transaction-state-machine.js";
import { TransactionPoller } from "./transaction-poller.js";
import type {
  Terminal,
  VivaWalletSaleRequest,
  VivaWalletRefundRequest,
  VivaWalletTransactionResponse,
  TransactionStatus,
} from "./types.js";

const logger = getLogger("TransactionManager");

// =============================================================================
// TRANSACTION MANAGER
// =============================================================================

export class TransactionManager {
  private activeTransactions: Map<string, ActiveTransaction> = new Map();
  private requestBuilder: TransactionRequestBuilder;
  private transactionPoller: TransactionPoller;

  constructor() {
    this.requestBuilder = new TransactionRequestBuilder();
    this.transactionPoller = new TransactionPoller(this);
  }

  /**
   * Initiate sale transaction
   */
  async initiateSale(
    terminal: Terminal,
    request: VivaWalletSaleRequest
  ): Promise<{ transactionId: string; terminalTransactionId: string }> {
    logger.info(
      `Initiating sale transaction: ${request.amount} ${request.currency}`
    );

    const transactionId = this.generateTransactionId();
    const stateMachine = new TransactionStateMachine("idle");
    const httpClient = new VivaWalletHTTPClient(terminal);

    try {
      stateMachine.transition("initiating", "Starting transaction");

      const response = await httpClient.post<VivaWalletTransactionResponse>(
        "/api/transactions/sale",
        request
      );

      if (!response.transactionId) {
        throw new Error("Transaction ID not returned from terminal");
      }

      stateMachine.transition("pending", "Transaction initiated on terminal");

      // Store active transaction
      const activeTransaction: ActiveTransaction = {
        id: transactionId,
        terminalTransactionId: response.transactionId,
        terminal,
        request,
        status: "pending",
        stateMachine,
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      this.activeTransactions.set(transactionId, activeTransaction);

      logger.info(
        `Transaction initiated: ${transactionId} -> ${response.transactionId}`
      );

      // Start polling for status
      await this.transactionPoller.startPolling(
        transactionId,
        response.transactionId,
        terminal
      );

      return {
        transactionId,
        terminalTransactionId: response.transactionId,
      };
    } catch (error) {
      logger.error(`Failed to initiate transaction ${transactionId}:`, error);
      stateMachine.transition(
        "failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    terminal: Terminal,
    terminalTransactionId: string
  ): Promise<TransactionStatus | null> {
    try {
      const httpClient = new VivaWalletHTTPClient(terminal);
      const response = await httpClient.get<VivaWalletTransactionResponse>(
        `/api/transactions/${terminalTransactionId}/status`
      );

      return {
        transactionId: terminalTransactionId,
        status: response.status,
        progress: this.calculateProgress(response.status),
        message: this.getStatusMessage(response.status),
        error: response.error
          ? {
              code: response.error.code,
              message: response.error.message,
              retryable: response.error.retryable,
            }
          : undefined,
      };
    } catch (error) {
      logger.error(
        `Failed to get transaction status for ${terminalTransactionId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Initiate refund transaction
   */
  async initiateRefund(
    terminal: Terminal,
    request: VivaWalletRefundRequest
  ): Promise<{ transactionId: string; terminalTransactionId: string }> {
    logger.info(
      `Initiating refund transaction: ${request.amount} ${request.currency} for original transaction ${request.originalTransactionId}`
    );

    const transactionId = this.generateTransactionId();
    const stateMachine = new TransactionStateMachine("idle");
    const httpClient = new VivaWalletHTTPClient(terminal);

    try {
      stateMachine.transition("initiating", "Starting refund transaction");

      const response = await httpClient.post<VivaWalletTransactionResponse>(
        "/api/transactions/refund",
        request
      );

      if (!response.transactionId) {
        throw new Error("Transaction ID not returned from terminal");
      }

      stateMachine.transition(
        "pending",
        "Refund transaction initiated on terminal"
      );

      // Store active transaction
      const activeTransaction: ActiveTransaction = {
        id: transactionId,
        terminalTransactionId: response.transactionId,
        terminal,
        request: request as VivaWalletSaleRequest, // Type compatibility - refund requests have same structure
        status: "pending",
        stateMachine,
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      this.activeTransactions.set(transactionId, activeTransaction);

      logger.info(
        `Refund transaction initiated: ${transactionId} -> ${response.transactionId}`
      );

      // Start polling for status
      await this.transactionPoller.startPolling(
        transactionId,
        response.transactionId,
        terminal
      );

      return {
        transactionId,
        terminalTransactionId: response.transactionId,
      };
    } catch (error) {
      logger.error(
        `Failed to initiate refund transaction ${transactionId}:`,
        error
      );
      stateMachine.transition(
        "failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(
    terminal: Terminal,
    terminalTransactionId: string
  ): Promise<boolean> {
    try {
      // Find the transaction by terminal transaction ID
      let transactionId: string | undefined;
      for (const [id, transaction] of this.activeTransactions.entries()) {
        if (transaction.terminalTransactionId === terminalTransactionId) {
          transactionId = id;
          break;
        }
      }

      const httpClient = new VivaWalletHTTPClient(terminal);
      const response = await httpClient.post<{
        success: boolean;
        message?: string;
      }>(`/api/transactions/${terminalTransactionId}/cancel`);

      if (response.success) {
        logger.info(`Transaction cancelled: ${terminalTransactionId}`);

        // Stop polling and update state machine
        if (transactionId) {
          const transaction = this.activeTransactions.get(transactionId);
          if (transaction?.stateMachine) {
            transaction.stateMachine.transition(
              "cancelled",
              "Transaction cancelled"
            );
          }
          this.transactionPoller.stopPolling(transactionId);
        }

        return true;
      }

      return false;
    } catch (error) {
      logger.error(
        `Failed to cancel transaction ${terminalTransactionId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get active transaction
   */
  getActiveTransaction(transactionId: string): ActiveTransaction | undefined {
    return this.activeTransactions.get(transactionId);
  }

  /**
   * Remove active transaction
   */
  removeActiveTransaction(transactionId: string): void {
    this.activeTransactions.delete(transactionId);
    this.transactionPoller.stopPolling(transactionId);
  }

  /**
   * Get transaction poller (for event subscription)
   */
  getTransactionPoller(): TransactionPoller {
    return this.transactionPoller;
  }

  /**
   * Get request builder
   */
  getRequestBuilder(): TransactionRequestBuilder {
    return this.requestBuilder;
  }

  private generateTransactionId(): string {
    return `viva_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private calculateProgress(status: string): number {
    const statusProgress: Record<string, number> = {
      pending: 10,
      processing: 30,
      awaiting_card: 50,
      completed: 100,
      failed: 0,
      cancelled: 0,
    };
    return statusProgress[status] || 0;
  }

  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      pending: "Transaction pending",
      processing: "Processing payment...",
      awaiting_card: "Please present your card",
      completed: "Payment successful",
      failed: "Transaction failed",
      cancelled: "Transaction cancelled",
    };
    return messages[status] || "Processing...";
  }
}

interface ActiveTransaction {
  id: string;
  terminalTransactionId: string;
  terminal: Terminal;
  request: VivaWalletSaleRequest;
  status: string;
  stateMachine?: TransactionStateMachine;
  startedAt: Date;
  lastUpdatedAt: Date;
}

export interface TransactionManagerEvents {
  "transaction-status-update": (data: {
    transactionId: string;
    status: TransactionStatus;
    timestamp: Date;
  }) => void;
  "transaction-complete": (data: {
    transactionId: string;
    status: string;
    data: VivaWalletTransactionResponse;
  }) => void;
  "transaction-timeout": (data: {
    transactionId: string;
    elapsedTime: number;
  }) => void;
}
