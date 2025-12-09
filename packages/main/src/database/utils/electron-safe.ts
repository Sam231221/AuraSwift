/**
 * Electron-Safe Import Helper
 *
 * Provides safe access to Electron APIs that works in both:
 * - Electron context (normal app execution)
 * - CLI context (tsx, Node.js scripts)
 *
 * Use this instead of direct `import { app, dialog } from "electron"`
 * in files that might be used by CLI scripts.
 */

/**
 * Get Electron app instance safely
 * Returns null if not in Electron context
 */
export function getElectronApp() {
  try {
    return require("electron").app;
  } catch {
    return null;
  }
}

/**
 * Get Electron dialog instance safely
 * Returns null if not in Electron context
 */
export function getElectronDialog() {
  try {
    return require("electron").dialog;
  } catch {
    return null;
  }
}

/**
 * Check if running in Electron context
 */
export function isElectronContext(): boolean {
  try {
    require.resolve("electron");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get app version safely
 * Returns "0.0.0" if not in Electron context
 */
export function getAppVersion(): string {
  const app = getElectronApp();
  return app ? app.getVersion() : "0.0.0";
}

/**
 * Check if app is packaged
 * Returns false if not in Electron context (assumes development)
 */
export function isPackaged(): boolean {
  const app = getElectronApp();
  return app ? app.isPackaged : false;
}

/**
 * Get user data path safely
 * Returns process.cwd() if not in Electron context
 */
export function getUserDataPath(): string {
  const app = getElectronApp();
  return app ? app.getPath("userData") : process.cwd();
}

/**
 * Get app path safely
 * Returns process.cwd() if not in Electron context
 */
export function getAppPath(): string {
  const app = getElectronApp();
  return app ? app.getAppPath() : process.cwd();
}
