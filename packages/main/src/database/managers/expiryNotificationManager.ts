import type { ExpiryNotification } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, asc, gte, lte } from "drizzle-orm";
import * as schema from "../schema.js";

export interface ExpiryNotificationResponse {
  success: boolean;
  message: string;
  notification?: ExpiryNotification;
  notifications?: ExpiryNotification[];
  errors?: string[];
}

export interface CreateNotificationData {
  productBatchId: string;
  notificationType: "INFO" | "WARNING" | "CRITICAL" | "EXPIRED";
  daysUntilExpiry: number;
  message: string;
  channels: Array<"EMAIL" | "PUSH" | "DASHBOARD">;
  businessId: string;
  scheduledFor: Date;
}

export class ExpiryNotificationManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Create a new expiry notification
   */
  async createNotification(
    notificationData: CreateNotificationData
  ): Promise<ExpiryNotification> {
    const notificationId = this.uuid.v4();
    const now = new Date();

    // Validate required fields
    if (!notificationData.productBatchId) {
      throw new Error("Product batch ID is required");
    }
    if (!notificationData.businessId) {
      throw new Error("Business ID is required");
    }
    if (!["INFO", "WARNING", "CRITICAL", "EXPIRED"].includes(notificationData.notificationType)) {
      throw new Error("Invalid notification type");
    }

    await this.db.insert(schema.expiryNotifications).values({
      id: notificationId,
      productBatchId: notificationData.productBatchId,
      notificationType: notificationData.notificationType,
      daysUntilExpiry: notificationData.daysUntilExpiry,
      message: notificationData.message,
      status: "PENDING",
      channels: notificationData.channels,
      businessId: notificationData.businessId,
      scheduledFor: notificationData.scheduledFor,
      createdAt: now,
      updatedAt: now,
    });

    return this.getNotificationById(notificationId);
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<ExpiryNotification> {
    const [notification] = await this.db
      .select()
      .from(schema.expiryNotifications)
      .where(eq(schema.expiryNotifications.id, id))
      .limit(1);

    if (!notification) {
      throw new Error("Expiry notification not found");
    }

    return notification as ExpiryNotification;
  }

  /**
   * Get notifications by batch ID
   */
  async getNotificationsByBatch(batchId: string): Promise<ExpiryNotification[]> {
    const notifications = await this.db
      .select()
      .from(schema.expiryNotifications)
      .where(eq(schema.expiryNotifications.productBatchId, batchId))
      .orderBy(desc(schema.expiryNotifications.scheduledFor));

    return notifications as ExpiryNotification[];
  }

  /**
   * Get notifications by business ID
   */
  async getNotificationsByBusiness(
    businessId: string,
    filters?: {
      status?: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "ACKNOWLEDGED";
      notificationType?: "INFO" | "WARNING" | "CRITICAL" | "EXPIRED";
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ExpiryNotification[]> {
    const conditions = [eq(schema.expiryNotifications.businessId, businessId)];

    if (filters?.status) {
      conditions.push(eq(schema.expiryNotifications.status, filters.status));
    }

    if (filters?.notificationType) {
      conditions.push(
        eq(schema.expiryNotifications.notificationType, filters.notificationType)
      );
    }

    if (filters?.startDate) {
      conditions.push(
        gte(
          schema.expiryNotifications.scheduledFor,
          filters.startDate
        )
      );
    }

    if (filters?.endDate) {
      conditions.push(
        lte(schema.expiryNotifications.scheduledFor, filters.endDate)
      );
    }

    const notifications = await this.db
      .select()
      .from(schema.expiryNotifications)
      .where(and(...conditions))
      .orderBy(desc(schema.expiryNotifications.scheduledFor));

    return notifications as ExpiryNotification[];
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications(businessId?: string): Promise<ExpiryNotification[]> {
    const conditions = [eq(schema.expiryNotifications.status, "PENDING")];

    if (businessId) {
      conditions.push(eq(schema.expiryNotifications.businessId, businessId));
    }

    const notifications = await this.db
      .select()
      .from(schema.expiryNotifications)
      .where(and(...conditions))
      .orderBy(asc(schema.expiryNotifications.scheduledFor));

    return notifications as ExpiryNotification[];
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(
    id: string,
    status: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "ACKNOWLEDGED",
    sentAt?: Date
  ): Promise<ExpiryNotification> {
    const now = new Date();

    await this.db
      .update(schema.expiryNotifications)
      .set({
        status,
        sentAt: sentAt ? sentAt : status === "SENT" ? now : undefined,
        updatedAt: now,
      })
      .where(eq(schema.expiryNotifications.id, id))
      .run();

    return this.getNotificationById(id);
  }

  /**
   * Acknowledge notification
   */
  async acknowledgeNotification(
    id: string,
    userId: string
  ): Promise<ExpiryNotification> {
    const now = new Date();

    await this.db
      .update(schema.expiryNotifications)
      .set({
        status: "ACKNOWLEDGED",
        acknowledgedBy: userId,
        acknowledgedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.expiryNotifications.id, id))
      .run();

    return this.getNotificationById(id);
  }

  /**
   * Get notifications by product batch that need to be sent
   */
  async getNotificationsToSend(businessId?: string): Promise<ExpiryNotification[]> {
    const now = new Date();
    const conditions = [
      eq(schema.expiryNotifications.status, "PENDING"),
      lte(schema.expiryNotifications.scheduledFor, now),
    ];

    if (businessId) {
      conditions.push(eq(schema.expiryNotifications.businessId, businessId));
    }

    const notifications = await this.db
      .select()
      .from(schema.expiryNotifications)
      .where(and(...conditions))
      .orderBy(asc(schema.expiryNotifications.scheduledFor));

    return notifications as ExpiryNotification[];
  }
}

