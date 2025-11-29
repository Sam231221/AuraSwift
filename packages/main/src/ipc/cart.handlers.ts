import { ipcMain } from "electron";
import { getDatabase } from "../database/index.js";
import { getLogger } from "../utils/logger.js";

const logger = getLogger("cartHandlers");
let db: any = null;

export function registerCartHandlers() {
  // ============================================================================
  // CART SESSION IPC HANDLERS
  // ============================================================================

  ipcMain.handle("cart:createSession", async (event, sessionData) => {
    try {
      if (!db) db = await getDatabase();
      const session = await db.cart.createSession(sessionData);

      return {
        success: true,
        data: JSON.parse(JSON.stringify(session)),
      };
    } catch (error) {
      logger.error("Create cart session IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create cart session",
      };
    }
  });

  ipcMain.handle("cart:getSession", async (event, sessionId) => {
    try {
      if (!db) db = await getDatabase();
      const session = await db.cart.getSessionById(sessionId);

      return {
        success: true,
        data: JSON.parse(JSON.stringify(session)),
      };
    } catch (error) {
      logger.error("Get cart session IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get cart session",
      };
    }
  });

  ipcMain.handle("cart:getActiveSession", async (event, cashierId) => {
    try {
      if (!db) db = await getDatabase();
      const session = await db.cart.getActiveSession(cashierId);

      return {
        success: true,
        data: session ? JSON.parse(JSON.stringify(session)) : null,
      };
    } catch (error) {
      logger.error("Get active cart session IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get active cart session",
      };
    }
  });

  ipcMain.handle("cart:updateSession", async (event, sessionId, updates) => {
    try {
      if (!db) db = await getDatabase();
      const session = await db.cart.updateSession(sessionId, updates);

      return {
        success: true,
        data: JSON.parse(JSON.stringify(session)),
      };
    } catch (error) {
      logger.error("Update cart session IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update cart session",
      };
    }
  });

  ipcMain.handle("cart:completeSession", async (event, sessionId) => {
    try {
      if (!db) db = await getDatabase();
      const session = await db.cart.completeSession(sessionId);

      return {
        success: true,
        data: JSON.parse(JSON.stringify(session)),
      };
    } catch (error) {
      logger.error("Complete cart session IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to complete cart session",
      };
    }
  });

  ipcMain.handle("cart:cancelSession", async (event, sessionId) => {
    try {
      if (!db) db = await getDatabase();
      const session = await db.cart.cancelSession(sessionId);

      return {
        success: true,
        data: JSON.parse(JSON.stringify(session)),
      };
    } catch (error) {
      logger.error("Cancel cart session IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to cancel cart session",
      };
    }
  });

  ipcMain.handle("cart:addItem", async (event, itemData) => {
    try {
      if (!db) db = await getDatabase();
      const item = await db.cart.addItem(itemData);

      return {
        success: true,
        data: JSON.parse(JSON.stringify(item)),
      };
    } catch (error) {
      logger.error("Add cart item IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to add cart item",
      };
    }
  });

  ipcMain.handle("cart:getItems", async (event, sessionId) => {
    try {
      if (!db) db = await getDatabase();
      const items = await db.cart.getItemsBySession(sessionId);

      return {
        success: true,
        data: JSON.parse(JSON.stringify(items)),
      };
    } catch (error) {
      logger.error("Get cart items IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get cart items",
      };
    }
  });

  ipcMain.handle("cart:updateItem", async (event, itemId, updates) => {
    try {
      if (!db) db = await getDatabase();
      const item = await db.cart.updateItem(itemId, updates);

      return {
        success: true,
        data: JSON.parse(JSON.stringify(item)),
      };
    } catch (error) {
      logger.error("Update cart item IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update cart item",
      };
    }
  });

  ipcMain.handle("cart:removeItem", async (event, itemId) => {
    try {
      if (!db) db = await getDatabase();
      await db.cart.removeItem(itemId);

      return {
        success: true,
      };
    } catch (error) {
      logger.error("Remove cart item IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to remove cart item",
      };
    }
  });

  ipcMain.handle("cart:clearCart", async (event, sessionId) => {
    try {
      if (!db) db = await getDatabase();
      await db.cart.clearCart(sessionId);

      return {
        success: true,
      };
    } catch (error) {
      logger.error("Clear cart IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to clear cart",
      };
    }
  });
}
