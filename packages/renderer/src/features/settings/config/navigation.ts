/**
 * Settings Feature Navigation Routes
 *
 * Centralized route definitions for the settings feature.
 * These routes are used for navigation throughout the feature.
 */

export const SETTINGS_ROUTES = {
  /** General settings view */
  GENERAL: "settings:general",
  /** Store configuration view */
  STORE_CONFIGURATION: "settings:store-configuration",
  /** Viva Wallet settings view */
  VIVA_WALLET: "settings:viva-wallet",
} as const;

export type SettingsRoute =
  (typeof SETTINGS_ROUTES)[keyof typeof SETTINGS_ROUTES];
