/**
 * Circuit Breaker Pattern for Viva Wallet terminals
 * Prevents cascading failures by temporarily blocking requests to failing terminals
 */

import { getLogger } from "../../../utils/logger.js";
import { TerminalError } from "../error-handler.js";
import { ErrorCode } from "../types.js";

const logger = getLogger("CircuitBreaker");

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================

export enum CircuitState {
  CLOSED = "closed", // Normal operation
  OPEN = "open", // Failing, reject requests
  HALF_OPEN = "half-open", // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Successes needed in half-open to close
  timeout: number; // Time in OPEN state before trying half-open (milliseconds)
  resetTimeout: number; // Time to wait before resetting failure count (milliseconds)
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: Date | null = null;
  private nextAttemptTime: Date | null = null;

  constructor(
    private readonly terminalId: string,
    private readonly config: CircuitBreakerConfig
  ) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if we should attempt the operation
    if (this.state === CircuitState.OPEN) {
      if (this.nextAttemptTime && new Date() < this.nextAttemptTime) {
        const waitTime = Math.ceil(
          (this.nextAttemptTime.getTime() - Date.now()) / 1000
        );
        throw new TerminalError(
          ErrorCode.TERMINAL_ERROR,
          `Circuit breaker is OPEN for terminal ${this.terminalId}. Please try again in ${waitTime} second(s).`,
          this.terminalId
        );
      }
      // Transition to half-open
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      logger.info(
        `Circuit breaker transitioning to HALF_OPEN for terminal: ${this.terminalId}`
      );
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        this.nextAttemptTime = null;
        logger.info(
          `Circuit breaker CLOSED for terminal: ${this.terminalId} (recovered)`
        );
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      if (this.failureCount > 0) {
        this.failureCount = 0;
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed again in half-open, go back to open
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
      logger.warn(
        `Circuit breaker OPENED for terminal: ${this.terminalId} (half-open test failed)`
      );
    } else if (this.failureCount >= this.config.failureThreshold) {
      // Too many failures, open the circuit
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
      logger.warn(
        `Circuit breaker OPENED for terminal: ${this.terminalId} (failure threshold: ${this.config.failureThreshold})`
      );
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      isOpen: this.state === CircuitState.OPEN,
      canAttempt: this.canAttempt(),
    };
  }

  /**
   * Check if operation can be attempted
   */
  canAttempt(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.HALF_OPEN) {
      return true;
    }

    // OPEN state - check if timeout has passed
    if (this.nextAttemptTime && new Date() >= this.nextAttemptTime) {
      return true;
    }

    return false;
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    logger.info(`Circuit breaker RESET for terminal: ${this.terminalId}`);
  }
}
