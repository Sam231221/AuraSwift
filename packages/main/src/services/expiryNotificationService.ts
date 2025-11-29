import type { DatabaseManagers } from "../database/index.js";
import type { ProductBatch, ExpirySetting } from "../database/schema.js";
import { getLogger } from "../utils/logger.js";

const logger = getLogger('expiry-notification-service');

export interface ExpiryCheckResult {
  batch: ProductBatch;
  notificationType: "INFO" | "WARNING" | "CRITICAL" | "EXPIRED" | null;
  daysUntilExpiry: number;
  message: string;
}

export class ExpiryNotificationService {
  private db: DatabaseManagers;

  constructor(db: DatabaseManagers) {
    this.db = db;
  }

  /**
   * Check if a batch needs expiry notification
   */
  checkBatchExpiry(
    batch: ProductBatch,
    settings: ExpirySetting
  ): ExpiryCheckResult | null {
    const now = new Date();
    const expiryDate = new Date(batch.expiryDate);
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Already expired
    if (daysUntilExpiry < 0) {
      return {
        batch,
        notificationType: "EXPIRED",
        daysUntilExpiry,
        message: `Batch ${batch.batchNumber} has expired ${Math.abs(daysUntilExpiry)} day(s) ago. Current stock: ${batch.currentQuantity}`,
      };
    }

    // Critical alert
    if (daysUntilExpiry <= settings.criticalAlertDays) {
      return {
        batch,
        notificationType: "CRITICAL",
        daysUntilExpiry,
        message: `Batch ${batch.batchNumber} expires in ${daysUntilExpiry} day(s). Current stock: ${batch.currentQuantity}. Action required!`,
      };
    }

    // Warning alert
    if (daysUntilExpiry <= settings.warningAlertDays) {
      return {
        batch,
        notificationType: "WARNING",
        daysUntilExpiry,
        message: `Batch ${batch.batchNumber} expires in ${daysUntilExpiry} day(s). Current stock: ${batch.currentQuantity}.`,
      };
    }

    // Info alert
    if (daysUntilExpiry <= settings.infoAlertDays) {
      return {
        batch,
        notificationType: "INFO",
        daysUntilExpiry,
        message: `Batch ${batch.batchNumber} expires in ${daysUntilExpiry} day(s). Current stock: ${batch.currentQuantity}.`,
      };
    }

    return null; // No notification needed
  }

  /**
   * Scan batches and create notifications
   */
  async scanAndCreateNotifications(businessId: string): Promise<number> {
    // Get expiry settings
    const settings = await this.db.expirySettings.getOrCreateSettings(
      businessId
    );

    // Get all active batches for this business
    const batches = await this.db.batches.getBatchesByBusiness(businessId, {
      status: "ACTIVE",
    });

    let notificationCount = 0;

    for (const batch of batches) {
      const checkResult = this.checkBatchExpiry(batch, settings);

      if (checkResult && checkResult.notificationType) {
        // Check if notification already exists for this batch and type
        const existingNotifications =
          await this.db.expiryNotifications.getNotificationsByBatch(batch.id);

        const hasRecentNotification = existingNotifications.some(
          (n) =>
            n.notificationType === checkResult.notificationType &&
            n.status !== "ACKNOWLEDGED" &&
            Math.abs(
              new Date(n.scheduledFor).getTime() -
                new Date().getTime()
            ) <
              24 * 60 * 60 * 1000 // Within 24 hours
        );

        if (!hasRecentNotification) {
          // Determine channels based on settings
          const channels: Array<"EMAIL" | "PUSH" | "DASHBOARD"> = [];
          if (settings.notifyViaDashboard) {
            channels.push("DASHBOARD");
          }
          if (settings.notifyViaEmail) {
            channels.push("EMAIL");
          }
          if (settings.notifyViaPush) {
            channels.push("PUSH");
          }

          // Schedule notification for immediate delivery
          await this.db.expiryNotifications.createNotification({
            productBatchId: batch.id,
            notificationType: checkResult.notificationType,
            daysUntilExpiry: checkResult.daysUntilExpiry,
            message: checkResult.message,
            channels,
            businessId,
            scheduledFor: new Date(),
          });

          notificationCount++;
        }
      }
    }

    return notificationCount;
  }

  /**
   * Send pending notifications
   */
  async sendPendingNotifications(businessId?: string): Promise<number> {
    const notifications =
      await this.db.expiryNotifications.getNotificationsToSend(businessId);

    let sentCount = 0;

    for (const notification of notifications) {
      try {
        // Update status to SENT
        await this.db.expiryNotifications.updateNotificationStatus(
          notification.id,
          "SENT",
          new Date()
        );

        // TODO: Implement actual sending via email/push
        // For now, we just mark as sent
        // In production, you would:
        // - Send email if notification.channels includes "EMAIL"
        // - Send push notification if notification.channels includes "PUSH"
        // - Dashboard notifications are already visible via getPending

        sentCount++;
      } catch (error) {
        logger.error(
          `Failed to send notification ${notification.id}`,
          error
        );
        // Mark as failed
        await this.db.expiryNotifications.updateNotificationStatus(
          notification.id,
          "FAILED"
        );
      }
    }

    return sentCount;
  }

  /**
   * Process all expiry-related tasks for a business
   */
  async processExpiryTasks(businessId: string): Promise<{
    expiredBatchesUpdated: number;
    notificationsCreated: number;
    notificationsSent: number;
  }> {
    // 1. Auto-update expired batch statuses
    const expiredCount =
      await this.db.batches.autoUpdateExpiredBatches(businessId);

    // 2. Scan and create notifications
    const notificationsCreated = await this.scanAndCreateNotifications(
      businessId
    );

    // 3. Send pending notifications
    const notificationsSent = await this.sendPendingNotifications(businessId);

    return {
      expiredBatchesUpdated: expiredCount,
      notificationsCreated,
      notificationsSent,
    };
  }
}

