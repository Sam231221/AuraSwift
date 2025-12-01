import { ipcMain } from "electron";
import { getDatabase } from "../database/index.js";
import { getLogger } from "../utils/logger.js";

const logger = getLogger("salesUnitSettingsHandlers");
let db: any = null;

export function registerSalesUnitSettingsHandlers() {
  ipcMain.handle("salesUnitSettings:get", async (event, businessId) => {
    try {
      if (!db) db = await getDatabase();
      const settings = await db.salesUnitSettings.getOrCreateSettings(
        businessId
      );

      return {
        success: true,
        settings: JSON.parse(JSON.stringify(settings)),
      };
    } catch (error) {
      logger.error("Get sales unit settings IPC error:", error);
      return {
        success: false,
        message: "Failed to get sales unit settings",
      };
    }
  });

  ipcMain.handle(
    "salesUnitSettings:createOrUpdate",
    async (event, businessId, settingsData) => {
      try {
        if (!db) db = await getDatabase();
        const settings = await db.salesUnitSettings.createOrUpdateSettings(
          businessId,
          settingsData
        );

        return {
          success: true,
          settings: JSON.parse(JSON.stringify(settings)),
        };
      } catch (error) {
        logger.error("Create/update sales unit settings IPC error:", error);
        return {
          success: false,
          message: "Failed to create/update sales unit settings",
        };
      }
    }
  );
}
