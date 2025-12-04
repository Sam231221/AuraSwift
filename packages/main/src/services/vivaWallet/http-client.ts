/**
 * HTTP Client for Viva Wallet Local Terminal API
 * Handles all HTTP communication with terminals, including retry logic and error handling
 * Uses Node.js built-in fetch API (Node 18+)
 */

import { getLogger } from "../../utils/logger.js";
import { ErrorClassifier, RetryManager, NetworkError, ErrorCode } from "./error-handler.js";
import type { Terminal } from "./types.js";

const logger = getLogger("VivaWalletHTTPClient");

// =============================================================================
// HTTP CLIENT
// =============================================================================

interface RequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export class VivaWalletHTTPClient {
  private baseURL: string;
  private terminal: Terminal;
  private errorClassifier: ErrorClassifier;
  private retryManager: RetryManager;
  private defaultHeaders: Record<string, string>;

  constructor(terminal: Terminal) {
    this.terminal = terminal;
    this.baseURL = `http://${terminal.ipAddress}:${terminal.port}`;
    this.errorClassifier = new ErrorClassifier();
    this.retryManager = new RetryManager();
    this.defaultHeaders = {
      Authorization: `Bearer ${terminal.apiKey || ""}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Make GET request with retry logic
   */
  async get<T = any>(url: string, options?: RequestOptions): Promise<T> {
    const fullUrl = url.startsWith("http") ? url : `${this.baseURL}${url}`;

    return this.retryManager.retryWithBackoff(
      async () => {
        logger.debug(`HTTP GET: ${fullUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options?.timeout || 30000
        );

        try {
          const response = await fetch(fullUrl, {
            method: "GET",
            headers: {
              ...this.defaultHeaders,
              ...options?.headers,
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw this.createFetchError(
              response.status,
              errorData,
              "GET",
              fullUrl
            );
          }

          const data = await response.json();
          logger.debug(`HTTP Response: ${response.status} ${fullUrl}`);
          return data as T;
        } catch (error) {
          clearTimeout(timeoutId);

          if (error instanceof Error && error.name === "AbortError") {
            throw new NetworkError(
              ErrorCode.NETWORK_TIMEOUT,
              "Request timeout",
              { terminalId: this.terminal.id, originalError: error }
            );
          }

          throw error;
        }
      },
      undefined,
      (attempt, error) => {
        logger.warn(
          `Retry attempt ${attempt} for GET ${fullUrl}:`,
          error.message
        );
      }
    );
  }

  /**
   * Make POST request with retry logic
   */
  async post<T = any>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const fullUrl = url.startsWith("http") ? url : `${this.baseURL}${url}`;

    return this.retryManager.retryWithBackoff(
      async () => {
        logger.debug(`HTTP POST: ${fullUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options?.timeout || 30000
        );

        try {
          const response = await fetch(fullUrl, {
            method: "POST",
            headers: {
              ...this.defaultHeaders,
              ...options?.headers,
            },
            body: data ? JSON.stringify(data) : undefined,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw this.createFetchError(
              response.status,
              errorData,
              "POST",
              fullUrl
            );
          }

          const responseData = await response.json();
          logger.debug(`HTTP Response: ${response.status} ${fullUrl}`);
          return responseData as T;
        } catch (error) {
          clearTimeout(timeoutId);

          if (error instanceof Error && error.name === "AbortError") {
            throw new NetworkError(
              ErrorCode.NETWORK_TIMEOUT,
              "Request timeout",
              { terminalId: this.terminal.id, originalError: error }
            );
          }

          throw error;
        }
      },
      undefined,
      (attempt, error) => {
        logger.warn(
          `Retry attempt ${attempt} for POST ${fullUrl}:`,
          error.message
        );
      }
    );
  }

  /**
   * Health check for terminal
   */
  async healthCheck(options?: { timeout?: number }): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      const response = await this.get<{ status: string }>("/api/status", {
        timeout: options?.timeout || 5000,
      });
      return {
        success: true,
        status: response.status,
      };
    } catch (error) {
      const classifiedError = this.errorClassifier.classify(error, {
        terminalId: this.terminal.id,
      });
      return {
        success: false,
        error: classifiedError.message,
      };
    }
  }

  /**
   * Create error from fetch response
   */
  private createFetchError(
    status: number,
    errorData: any,
    method: string,
    url: string
  ): Error {
    // Create a mock Axios-like error for compatibility with error classifier
    const error = new Error(
      errorData.message || `HTTP ${status} ${method} ${url}`
    );
    (error as any).isAxiosError = true;
    (error as any).response = {
      status,
      data: errorData,
    };
    (error as any).config = {
      url,
      method,
    };

    // Set error code based on status
    if (status >= 500) {
      (error as any).code = "ECONNREFUSED";
    } else if (status === 408 || status === 504) {
      (error as any).code = "ETIMEDOUT";
    }

    return error;
  }
}
