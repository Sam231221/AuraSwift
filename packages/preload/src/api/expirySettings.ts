import { ipcRenderer } from "electron";

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

export const expirySettingsAPI = {
  get: (businessId: string) =>
    ipcRenderer.invoke("expirySettings:get", businessId),

  createOrUpdate: (businessId: string, settingsData: ExpirySettingsData) =>
    ipcRenderer.invoke("expirySettings:createOrUpdate", businessId, settingsData),
};

