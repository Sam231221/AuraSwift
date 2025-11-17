import type { DrizzleDB } from "../drizzle.js";
import { eq } from "drizzle-orm";
import * as schema from "../schema/index.js";

export interface AppSetting {
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export class SettingsManager {
  private db: DrizzleDB;

  constructor(drizzle: DrizzleDB) {
    this.db = drizzle;
  }

  /**
   * Set a key-value pair in app settings
   */
  setSetting(key: string, value: string): void {
    const now = new Date();

    // Check if setting exists
    const existing = this.db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.key, key))
      .get();

    if (existing) {
      // Update existing setting
      this.db
        .update(schema.appSettings)
        .set({
          value,
          updatedAt: now,
        })
        .where(eq(schema.appSettings.key, key))
        .run();
    } else {
      // Insert new setting
      this.db
        .insert(schema.appSettings)
        .values({
          key,
          value,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  }

  /**
   * Get a value from app settings
   */
  getSetting(key: string): string | null {
    const setting = this.db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.key, key))
      .get();

    return setting ? setting.value : null;
  }

  /**
   * Delete a setting
   */
  deleteSetting(key: string): void {
    this.db
      .delete(schema.appSettings)
      .where(eq(schema.appSettings.key, key))
      .run();
  }

  /**
   * Clear all settings
   */
  clearAllSettings(): void {
    this.db.delete(schema.appSettings).run();
  }

  /**
   * Get all settings
   */
  getAllSettings(): AppSetting[] {
    const results = this.db.select().from(schema.appSettings).all() as {
      key: string;
      value: string;
      createdAt: Date;
      updatedAt: Date | null;
    }[];
    return results.map((row) => ({
      key: row.key,
      value: row.value,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : "",
    }));
  }

  /**
   * Get settings by key prefix
   */
  getSettingsByPrefix(prefix: string): AppSetting[] {
    const allSettings = this.getAllSettings();
    return allSettings.filter((setting) => setting.key.startsWith(prefix));
  }
}
