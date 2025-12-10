/**
 * Preload Logger Utility
 * 
 * Simple logger for the preload process with console fallback
 * Preload scripts have limited access, so we keep logging simple
 * 
 * Usage:
 * ```typescript
 * import { logger } from './logger';
 * 
 * logger.debug('Debug message', { data });
 * logger.info('Info message');
 * logger.warn('Warning message');
 * logger.error('Error message', error);
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class PreloadLogger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Format log message
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} ${level.toUpperCase()} [Preload] ${message}`;
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message), data !== undefined ? data : '');
    }
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    console.info(this.formatMessage('info', message), data !== undefined ? data : '');
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    console.warn(this.formatMessage('warn', message), data !== undefined ? data : '');
  }

  /**
   * Log error message
   */
  error(message: string, error?: any): void {
    const errorData = error instanceof Error 
      ? { 
          message: error.message, 
          stack: error.stack,
          name: error.name 
        }
      : error;
    
    console.error(this.formatMessage('error', message), errorData !== undefined ? errorData : '');
  }
}

export const logger = new PreloadLogger();

