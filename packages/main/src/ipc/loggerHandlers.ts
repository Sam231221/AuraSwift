/**
 * Logger IPC Handlers
 * 
 * Handles log messages from renderer process and writes them to files
 */

import { ipcMain } from 'electron';
import { getLogger } from '../utils/logger.js';

const rendererLogger = getLogger('renderer');

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  context: string;
  message: string;
  timestamp: string;
  data?: any;
}

/**
 * Register IPC handlers for logging
 */
export function registerLoggerHandlers(): void {
  // Handle log write requests from renderer
  ipcMain.handle('log:write', async (_, entry: LogEntry) => {
    try {
      const logMessage = `[${entry.context}] ${entry.message}`;
      
      switch (entry.level) {
        case 'debug':
          rendererLogger.debug(logMessage, entry.data);
          break;
        case 'info':
          rendererLogger.info(logMessage, entry.data);
          break;
        case 'warn':
          rendererLogger.warn(logMessage, entry.data);
          break;
        case 'error':
          rendererLogger.error(logMessage, entry.data);
          break;
      }
      
      return { success: true };
    } catch (error) {
      // Use console.error here to avoid potential recursion
      console.error('Failed to write log:', error);
      return { success: false, error };
    }
  });
}

