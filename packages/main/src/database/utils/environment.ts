/**
 * Environment Detection Utility
 *
 * Centralized environment detection logic to avoid duplication across modules.
 * Determines if the application is running in development or production mode.
 * Works in both Electron and CLI (tsx) contexts.
 */

/**
 * Check if the application is running in development mode.
 *
 * Development mode is detected when:
 * - NODE_ENV environment variable is set to "development"
 * - ELECTRON_IS_DEV environment variable is set to "true"
 * - app.isPackaged is false (Electron's built-in flag, if available)
 *
 * @returns true if running in development mode, false otherwise
 */
export function isDevelopmentMode(): boolean {
  // Check environment variables first (works in all contexts)
  if (
    process.env.NODE_ENV === "development" ||
    process.env.ELECTRON_IS_DEV === "true"
  ) {
    return true;
  }

  // Try to check Electron's app.isPackaged (only in Electron context)
  try {
    const { app } = require("electron");
    return !app.isPackaged;
  } catch {
    // Not in Electron context (e.g., running with tsx)
    // Default to development if NODE_ENV is not set
    return !process.env.NODE_ENV || process.env.NODE_ENV !== "production";
  }
}
