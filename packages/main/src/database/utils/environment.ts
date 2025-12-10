/**
 * Environment Detection Utility
 *
 * Centralized environment detection logic to avoid duplication across modules.
 * Determines if the application is running in development or production mode.
 */

import { app } from "electron";

/**
 * Check if the application is running in development mode.
 *
 * Development mode is detected when:
 * - NODE_ENV environment variable is set to "development"
 * - ELECTRON_IS_DEV environment variable is set to "true"
 * - app.isPackaged is false (Electron's built-in flag)
 *
 * @returns true if running in development mode, false otherwise
 */
export function isDevelopmentMode(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ELECTRON_IS_DEV === "true" ||
    !app.isPackaged
  );
}
