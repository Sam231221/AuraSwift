/**
 * Expiry Settings API Types - Preload
 * 
 * Type definitions for expiry settings management IPC APIs.
 * 
 * @module preload/types/api/expiry-settings
 */

export interface ExpirySettingsData {
  criticalAlertDays?: number;
  warningAlertDays?: number;
  infoAlertDays?: number;
  notifyViaEmail?: boolean;
  notifyViaPush?: boolean;
  notifyViaDashboard?: boolean;
  autoDisableExpired?: boolean;
  allowSellNearExpiry?: boolean;
  nearExpiryThreshold?: number;
  notificationRecipients?: string[];
}

export interface ExpirySettingsAPIPreload {
  get: (businessId: string) => Promise<any>;

  createOrUpdate: (businessId: string, settingsData: ExpirySettingsData) => Promise<any>;
}

