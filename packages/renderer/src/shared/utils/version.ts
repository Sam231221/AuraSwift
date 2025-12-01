/**
 * App Version Utility
 * 
 * Provides a centralized way to access the application version
 * with proper fallback handling for development and production environments.
 * 
 * @example
 * ```tsx
 * import { getAppVersion } from '@/shared/utils/version';
 * 
 * const version = getAppVersion(); // Returns "1.8.0" or fallback
 * ```
 */

/**
 * Get the current application version
 * 
 * Reads from VITE_APP_VERSION environment variable which is injected
 * during build time from the root package.json.
 * 
 * @returns The application version string, or "0.0.0" as fallback
 */
export function getAppVersion(): string {
  // In development, VITE_APP_VERSION might not be set, so we provide a fallback
  // In production, it will be injected by vite.config.ts
  return import.meta.env.VITE_APP_VERSION || "0.0.0";
}

/**
 * Check if the current version is a development version
 * 
 * @returns true if version is "0.0.0" (fallback) or contains "dev"
 */
export function isDevelopmentVersion(): boolean {
  const version = getAppVersion();
  return version === "0.0.0" || version.includes("dev");
}

