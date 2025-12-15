// Category Management IPC Handlers
import { ipcMain } from "electron";
import { getDatabase } from "../database/index.js";
import { getLogger } from "../utils/logger.js";

const logger = getLogger("categoryHandlers");
// let db: any = null; // Removed: Always get fresh DB reference

export function registerCategoryHandlers() {
  // Category Management IPC handlers
  ipcMain.handle("categories:create", async (event, categoryData) => {
    try {
      const db = await getDatabase();
      return await db.categories.createCategoryWithResponse(categoryData);
    } catch (error: any) {
      logger.error("Create category IPC error:", error);
      return {
        success: false,
        message: error.message || "Failed to create category",
      };
    }
  });

  ipcMain.handle("categories:getByBusiness", async (event, businessId) => {
    try {
      const db = await getDatabase();
      return await db.categories.getCategoriesByBusinessWithResponse(
        businessId
      );
    } catch (error: any) {
      logger.error("Get categories by business IPC error:", error);
      return {
        success: false,
        message: error.message || "Failed to get categories",
      };
    }
  });

  ipcMain.handle("categories:getById", async (event, id) => {
    try {
      const db = await getDatabase();
      return await db.categories.getCategoryByIdWithResponse(id);
    } catch (error: any) {
      logger.error("Get category by ID IPC error:", error);
      return {
        success: false,
        message: error.message || "Failed to get category",
      };
    }
  });

  ipcMain.handle("categories:update", async (event, id, updates) => {
    try {
      const db = await getDatabase();
      return await db.categories.updateCategoryWithResponse(id, updates);
    } catch (error: any) {
      logger.error("Update category IPC error:", error);
      return {
        success: false,
        message: error.message || "Failed to update category",
      };
    }
  });

  ipcMain.handle("categories:delete", async (event, id) => {
    try {
      const db = await getDatabase();
      return await db.categories.deleteCategoryWithResponse(id);
    } catch (error: any) {
      logger.error("Delete category IPC error:", error);
      return {
        success: false,
        message: error.message || "Failed to delete category",
      };
    }
  });

  ipcMain.handle(
    "categories:reorder",
    async (event, businessId, categoryIds) => {
      try {
        const db = await getDatabase();
        return await db.categories.reorderCategoriesWithResponse(
          businessId,
          categoryIds
        );
      } catch (error: any) {
        logger.error("Reorder categories IPC error:", error);
        return {
          success: false,
          message: error.message || "Failed to reorder categories",
        };
      }
    }
  );
}
