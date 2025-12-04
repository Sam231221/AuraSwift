/**
 * Error Logging Utilities for Viva Wallet
 * Structured error logging with context and sensitive data exclusion
 */

import { getLogger } from "../../../utils/logger.js";
import type { VivaWalletError } from "../types.js";

const logger = getLogger("VivaWalletErrorLogger");

// =============================================================================
// ERROR LOGGER
// =============================================================================

export class ErrorLogger {
  private errorAggregation: Map<string, ErrorAggregation> = new Map();
  private readonly AGGREGATION_WINDOW = 5 * 60 * 1000; // 5 minutes

  /**
   * Log error with full context
   */
  logError(error: VivaWalletError, context?: Record<string, any>): void {
    // Create sanitized context (exclude sensitive data)
    const sanitizedContext = this.sanitizeContext({
      ...context,
      terminalId: error.terminalId,
      transactionId: error.transactionId,
      errorCode: error.code,
      severity: error.severity,
      retryable: error.retryable,
      timestamp: error.timestamp.toISOString(),
    });

    // Log based on severity
    const logData = {
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity,
        retryable: error.retryable,
        name: error.name,
      },
      context: sanitizedContext,
    };

    switch (error.severity) {
      case "critical":
        logger.error("CRITICAL ERROR:", logData);
        break;
      case "high":
        logger.error("HIGH SEVERITY ERROR:", logData);
        break;
      case "medium":
        logger.warn("MEDIUM SEVERITY ERROR:", logData);
        break;
      case "low":
        logger.warn("LOW SEVERITY ERROR:", logData);
        break;
      default:
        logger.error("ERROR:", logData);
    }

    // Aggregate error for metrics
    this.aggregateError(error);
  }

  /**
   * Sanitize context to exclude sensitive data
   */
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = { ...context };

    // Remove sensitive fields
    const sensitiveFields = [
      "apiKey",
      "api_key",
      "password",
      "token",
      "secret",
      "cardNumber",
      "card_number",
      "cvv",
      "pin",
      "authCode",
      "auth_code",
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (
        typeof sanitized[key] === "object" &&
        sanitized[key] !== null &&
        !Array.isArray(sanitized[key])
      ) {
        sanitized[key] = this.sanitizeContext(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Aggregate errors for metrics
   */
  private aggregateError(error: VivaWalletError): void {
    const errorKey = `${error.code}_${error.terminalId || "unknown"}`;
    const now = Date.now();

    const aggregation = this.errorAggregation.get(errorKey) || {
      errorCode: error.code,
      terminalId: error.terminalId,
      count: 0,
      firstOccurrence: now,
      lastOccurrence: now,
      severity: error.severity,
    };

    aggregation.count++;
    aggregation.lastOccurrence = now;

    this.errorAggregation.set(errorKey, aggregation);

    // Clean up old aggregations
    this.cleanupAggregations(now);
  }

  /**
   * Clean up old error aggregations
   */
  private cleanupAggregations(now: number): void {
    for (const [key, aggregation] of this.errorAggregation.entries()) {
      if (now - aggregation.lastOccurrence > this.AGGREGATION_WINDOW) {
        this.errorAggregation.delete(key);
      }
    }
  }

  /**
   * Get error metrics
   */
  getErrorMetrics(): ErrorMetrics {
    const metrics: ErrorMetrics = {
      totalErrors: 0,
      errorsByCode: {},
      errorsBySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      errorsByTerminal: {},
      recentErrors: [],
    };

    const now = Date.now();

    for (const aggregation of this.errorAggregation.values()) {
      // Skip old aggregations
      if (now - aggregation.lastOccurrence > this.AGGREGATION_WINDOW) {
        continue;
      }

      metrics.totalErrors += aggregation.count;
      metrics.errorsByCode[aggregation.errorCode] =
        (metrics.errorsByCode[aggregation.errorCode] || 0) + aggregation.count;
      metrics.errorsBySeverity[aggregation.severity] =
        (metrics.errorsBySeverity[aggregation.severity] || 0) +
        aggregation.count;

      if (aggregation.terminalId) {
        metrics.errorsByTerminal[aggregation.terminalId] =
          (metrics.errorsByTerminal[aggregation.terminalId] || 0) +
          aggregation.count;
      }

      metrics.recentErrors.push({
        errorCode: aggregation.errorCode,
        terminalId: aggregation.terminalId,
        count: aggregation.count,
        firstOccurrence: new Date(aggregation.firstOccurrence),
        lastOccurrence: new Date(aggregation.lastOccurrence),
        severity: aggregation.severity,
      });
    }

    // Sort recent errors by last occurrence
    metrics.recentErrors.sort(
      (a, b) => b.lastOccurrence.getTime() - a.lastOccurrence.getTime()
    );

    return metrics;
  }

  /**
   * Clear error aggregations
   */
  clearAggregations(): void {
    this.errorAggregation.clear();
  }
}

interface ErrorAggregation {
  errorCode: string;
  terminalId?: string;
  count: number;
  firstOccurrence: number;
  lastOccurrence: number;
  severity: "critical" | "high" | "medium" | "low";
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  errorsByTerminal: Record<string, number>;
  recentErrors: Array<{
    errorCode: string;
    terminalId?: string;
    count: number;
    firstOccurrence: Date;
    lastOccurrence: Date;
    severity: "critical" | "high" | "medium" | "low";
  }>;
}
