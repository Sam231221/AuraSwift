/**
 * Frontend Logger Utility
 *
 * Provides structured logging for the renderer process with:
 * - Environment-based log levels
 * - Optional IPC forwarding to main process for production logging
 * - Color-coded console output in development
 * - Context tracking (component/service name)
 *
 * Usage:
 * ```typescript
 * import { getLogger } from '@/shared/utils/logger';
 * const logger = getLogger('ComponentName');
 *
 * logger.debug('Debug message', { data });
 * logger.info('Info message');
 * logger.warn('Warning message');
 * logger.error('Error message', error);
 * ```
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private context: string;
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  constructor(context: string) {
    this.context = context;
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = this.isDevelopment ? "debug" : "info";
  }

  /**
   * Check if a log level should be logged based on current log level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  /**
   * Format log message for console output
   */
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = `[${this.context}]`;

    if (data !== undefined) {
      return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`;
    }
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`;
  }

  /**
   * Send log to main process for file logging (production only)
   */
  private async sendToMain(entry: LogEntry): Promise<void> {
    if (!this.isDevelopment && window.electron?.ipcRenderer) {
      try {
        await window.electron.ipcRenderer.invoke("log:write", entry);
      } catch (error) {
        // Silently fail if IPC logging is not available
        // to avoid infinite logging loops
      }
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      level,
      context: this.context,
      message,
      timestamp,
      data,
    };

    // Console output (development or when IPC is not available)
    if (this.isDevelopment || !window.electron?.ipcRenderer) {
      const formattedMessage = this.formatMessage(level, message, data);

      switch (level) {
        case "debug":
          console.debug(formattedMessage, data !== undefined ? data : "");
          break;
        case "info":
          console.info(formattedMessage, data !== undefined ? data : "");
          break;
        case "warn":
          console.warn(formattedMessage, data !== undefined ? data : "");
          break;
        case "error":
          console.error(formattedMessage, data !== undefined ? data : "");
          break;
      }
    }

    // Send to main process for file logging (production)
    this.sendToMain(logEntry);
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, data?: any): void {
    this.log("debug", message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: any): void {
    const errorData =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error;

    this.log("error", message, errorData);
  }
}

// Cache loggers to avoid recreating them
const loggerCache = new Map<string, Logger>();

/**
 * Get or create a logger for a specific context
 *
 * @param context - The context/component name for the logger
 * @returns Logger instance
 */
export function getLogger(context: string): Logger {
  if (!loggerCache.has(context)) {
    loggerCache.set(context, new Logger(context));
  }
  return loggerCache.get(context)!;
}

// Default logger for quick usage
export const logger = getLogger("Renderer");
