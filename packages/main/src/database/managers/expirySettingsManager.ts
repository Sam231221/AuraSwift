import type { ExpirySetting } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq } from "drizzle-orm";
import * as schema from "../schema.js";

export interface ExpirySettingResponse {
  success: boolean;
  message: string;
  settings?: ExpirySetting;
  errors?: string[];
}

export class ExpirySettingManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Get default expiry settings
   */
  getDefaultSettings(): Omit<ExpirySetting, "id" | "businessId" | "createdAt" | "updatedAt"> {
    return {
      criticalAlertDays: 3,
      warningAlertDays: 7,
      infoAlertDays: 14,
      notifyViaEmail: true,
      notifyViaPush: true,
      notifyViaDashboard: true,
      autoDisableExpired: true,
      allowSellNearExpiry: false,
      nearExpiryThreshold: 2,
      notificationRecipients: [],
    };
  }

  /**
   * Get expiry settings by business ID
   */
  async getSettingsByBusiness(businessId: string): Promise<ExpirySetting | null> {
    const [settings] = await this.db
      .select()
      .from(schema.expirySettings)
      .where(eq(schema.expirySettings.businessId, businessId))
      .limit(1);

    return (settings as ExpirySetting) || null;
  }

  /**
   * Get or create expiry settings for business
   */
  async getOrCreateSettings(businessId: string): Promise<ExpirySetting> {
    let settings = await this.getSettingsByBusiness(businessId);

    if (!settings) {
      settings = await this.createOrUpdateSettings(businessId, {});
    }

    return settings;
  }

  /**
   * Create or update expiry settings
   */
  async createOrUpdateSettings(
    businessId: string,
    settingsData: Partial<
      Omit<ExpirySetting, "id" | "businessId" | "createdAt" | "updatedAt">
    >
  ): Promise<ExpirySetting> {
    const existing = await this.getSettingsByBusiness(businessId);
    const defaults = this.getDefaultSettings();
    const now = new Date();

    if (existing) {
      // Update existing settings
      await this.db
        .update(schema.expirySettings)
        .set({
          criticalAlertDays:
            settingsData.criticalAlertDays ?? existing.criticalAlertDays,
          warningAlertDays:
            settingsData.warningAlertDays ?? existing.warningAlertDays,
          infoAlertDays: settingsData.infoAlertDays ?? existing.infoAlertDays,
          notifyViaEmail:
            settingsData.notifyViaEmail ?? existing.notifyViaEmail,
          notifyViaPush: settingsData.notifyViaPush ?? existing.notifyViaPush,
          notifyViaDashboard:
            settingsData.notifyViaDashboard ?? existing.notifyViaDashboard,
          autoDisableExpired:
            settingsData.autoDisableExpired ?? existing.autoDisableExpired,
          allowSellNearExpiry:
            settingsData.allowSellNearExpiry ?? existing.allowSellNearExpiry,
          nearExpiryThreshold:
            settingsData.nearExpiryThreshold ?? existing.nearExpiryThreshold,
          notificationRecipients:
            settingsData.notificationRecipients ??
            existing.notificationRecipients,
          updatedAt: now,
        })
        .where(eq(schema.expirySettings.businessId, businessId))
        .run();

      return (await this.getSettingsByBusiness(businessId))!;
    } else {
      // Create new settings
      const settingsId = this.uuid.v4();

      await this.db.insert(schema.expirySettings).values({
        id: settingsId,
        businessId,
        criticalAlertDays:
          settingsData.criticalAlertDays ?? defaults.criticalAlertDays,
        warningAlertDays:
          settingsData.warningAlertDays ?? defaults.warningAlertDays,
        infoAlertDays: settingsData.infoAlertDays ?? defaults.infoAlertDays,
        notifyViaEmail: settingsData.notifyViaEmail ?? defaults.notifyViaEmail,
        notifyViaPush: settingsData.notifyViaPush ?? defaults.notifyViaPush,
        notifyViaDashboard:
          settingsData.notifyViaDashboard ?? defaults.notifyViaDashboard,
        autoDisableExpired:
          settingsData.autoDisableExpired ?? defaults.autoDisableExpired,
        allowSellNearExpiry:
          settingsData.allowSellNearExpiry ?? defaults.allowSellNearExpiry,
        nearExpiryThreshold:
          settingsData.nearExpiryThreshold ?? defaults.nearExpiryThreshold,
        notificationRecipients:
          settingsData.notificationRecipients ?? defaults.notificationRecipients,
        createdAt: now,
        updatedAt: now,
      });

      return (await this.getSettingsByBusiness(businessId))!;
    }
  }
}

