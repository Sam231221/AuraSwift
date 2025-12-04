/**
 * Polling Strategy for Viva Wallet transaction status polling
 * Implements adaptive polling intervals based on transaction state
 */

import type { TransactionState } from "./transaction-state-machine.js";

// =============================================================================
// POLLING STRATEGY
// =============================================================================

export class PollingStrategy {
  private readonly BASE_INTERVAL = 500; // 500ms base interval
  private readonly MAX_INTERVAL = 5000; // 5 seconds max
  private readonly FAST_POLLING_INTERVAL = 500; // Fast polling for active states
  private readonly SLOW_POLLING_INTERVAL = 2000; // Slow polling for pending

  /**
   * Get polling interval based on transaction state and attempt number
   */
  getPollingInterval(state: TransactionState, attempt: number): number {
    switch (state) {
      case "processing":
      case "awaiting_card":
      case "authorizing":
      case "card_present":
        // Fast polling for active states where user interaction is expected
        return this.FAST_POLLING_INTERVAL;

      case "pending":
        // Exponential backoff up to max interval
        return Math.min(
          this.BASE_INTERVAL * Math.pow(1.5, attempt),
          this.MAX_INTERVAL
        );

      case "initiating":
        // Medium polling for initiation
        return this.BASE_INTERVAL;

      default:
        // Slow polling for other states
        return this.SLOW_POLLING_INTERVAL;
    }
  }

  /**
   * Determine if polling should continue
   */
  shouldContinuePolling(
    state: TransactionState,
    elapsedTime: number,
    maxDuration: number
  ): boolean {
    // Stop if transaction is in final state
    if (["completed", "failed", "cancelled", "refunded"].includes(state)) {
      return false;
    }

    // Stop if timeout exceeded
    if (elapsedTime > maxDuration) {
      return false;
    }

    return true;
  }

  /**
   * Get retry interval for error scenarios
   */
  getRetryInterval(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.BASE_INTERVAL * Math.pow(2, attempt);
    const jitter = Math.random() * 500; // Add up to 500ms jitter
    return Math.min(Math.round(baseDelay + jitter), this.MAX_INTERVAL * 2);
  }

  /**
   * Get default max polling duration
   */
  getDefaultMaxDuration(): number {
    return 5 * 60 * 1000; // 5 minutes
  }
}
