import { ipcRenderer } from "electron";

export interface CreateNotificationData {
  productBatchId: string;
  notificationType: "INFO" | "WARNING" | "CRITICAL" | "EXPIRED";
  daysUntilExpiry: number;
  message: string;
  channels: Array<"EMAIL" | "PUSH" | "DASHBOARD">;
  businessId: string;
  scheduledFor: Date | string;
}

export interface GetNotificationsFilters {
  status?: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "ACKNOWLEDGED";
  notificationType?: "INFO" | "WARNING" | "CRITICAL" | "EXPIRED";
  startDate?: Date | string;
  endDate?: Date | string;
}

export const expiryNotificationsAPI = {
  create: (notificationData: CreateNotificationData) =>
    ipcRenderer.invoke("expiryNotifications:create", notificationData),

  getByBatch: (batchId: string) =>
    ipcRenderer.invoke("expiryNotifications:getByBatch", batchId),

  getByBusiness: (businessId: string, filters?: GetNotificationsFilters) =>
    ipcRenderer.invoke("expiryNotifications:getByBusiness", businessId, filters),

  getPending: (businessId?: string) =>
    ipcRenderer.invoke("expiryNotifications:getPending", businessId),

  acknowledge: (notificationId: string, userId: string) =>
    ipcRenderer.invoke("expiryNotifications:acknowledge", notificationId, userId),

  scanAndCreate: (businessId: string) =>
    ipcRenderer.invoke("expiryNotifications:scanAndCreate", businessId),

  processTasks: (businessId: string) =>
    ipcRenderer.invoke("expiryNotifications:processTasks", businessId),
};

