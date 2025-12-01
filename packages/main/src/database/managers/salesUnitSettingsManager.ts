import type { SalesUnitSetting } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq } from "drizzle-orm";
import * as schema from "../schema.js";

export interface SalesUnitSettingResponse {
  success: boolean;
  message: string;
  settings?: SalesUnitSetting;
  errors?: string[];
}

export class SalesUnitSettingManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Get default sales unit settings
   */
  getDefaultSettings(): Omit<
    SalesUnitSetting,
    "id" | "businessId" | "createdAt" | "updatedAt"
  > {
    return {
      salesUnitMode: "Varying",
      fixedSalesUnit: "KG",
    };
  }

  /**
   * Get sales unit settings by business ID
   */
  async getSettingsByBusiness(
    businessId: string
  ): Promise<SalesUnitSetting | null> {
    const [settings] = await this.db
      .select()
      .from(schema.salesUnitSettings)
      .where(eq(schema.salesUnitSettings.businessId, businessId))
      .limit(1);

    return (settings as SalesUnitSetting) || null;
  }

  /**
   * Get or create sales unit settings for business
   */
  async getOrCreateSettings(businessId: string): Promise<SalesUnitSetting> {
    let settings = await this.getSettingsByBusiness(businessId);

    if (!settings) {
      settings = await this.createOrUpdateSettings(businessId, {});
    }

    return settings;
  }

  /**
   * Create or update sales unit settings
   */
  async createOrUpdateSettings(
    businessId: string,
    settingsData: Partial<
      Omit<SalesUnitSetting, "id" | "businessId" | "createdAt" | "updatedAt">
    >
  ): Promise<SalesUnitSetting> {
    const existing = await this.getSettingsByBusiness(businessId);
    const defaults = this.getDefaultSettings();
    const now = new Date();

    if (existing) {
      // Update existing settings
      await this.db
        .update(schema.salesUnitSettings)
        .set({
          salesUnitMode: settingsData.salesUnitMode ?? existing.salesUnitMode,
          fixedSalesUnit:
            settingsData.fixedSalesUnit ?? existing.fixedSalesUnit,
          updatedAt: now,
        })
        .where(eq(schema.salesUnitSettings.businessId, businessId))
        .run();

      return (await this.getSettingsByBusiness(businessId))!;
    } else {
      // Create new settings
      const settingsId = this.uuid.v4();

      await this.db.insert(schema.salesUnitSettings).values({
        id: settingsId,
        businessId,
        salesUnitMode: settingsData.salesUnitMode ?? defaults.salesUnitMode,
        fixedSalesUnit: settingsData.fixedSalesUnit ?? defaults.fixedSalesUnit,
        createdAt: now,
        updatedAt: now,
      });

      return (await this.getSettingsByBusiness(businessId))!;
    }
  }
}
