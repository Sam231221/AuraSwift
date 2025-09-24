import { ipcMain } from "electron";
import { getAuthAPI } from "./authApi.js";
import { getDatabase, type DatabaseManager } from "./database.js";

// Get auth API and database instance
const authAPI = getAuthAPI();
let db: DatabaseManager | null = null;
getDatabase().then((database) => {
  db = database;
});

// IPC handlers for persistent key-value storage using app_settings table
ipcMain.handle("auth:set", async (event, key: string, value: string) => {
  try {
    if (!db) db = await getDatabase();
    // Store key-value pair in app_settings table
    db.setSetting(key, value);
    return true;
  } catch (error) {
    console.error("Error setting auth data:", error);
    return false;
  }
});

ipcMain.handle("auth:get", async (event, key: string) => {
  try {
    if (!db) db = await getDatabase();
    const value = db.getSetting(key);
    return value;
  } catch (error) {
    console.error("Error getting auth data:", error);
    return null;
  }
});

ipcMain.handle("auth:delete", async (event, key: string) => {
  try {
    if (!db) db = await getDatabase();
    db.deleteSetting(key);
    return true;
  } catch (error) {
    console.error("Error deleting auth data:", error);
    return false;
  }
});

// Authentication API handlers
ipcMain.handle("auth:register", async (event, userData) => {
  try {
    return await authAPI.register(userData);
  } catch (error) {
    console.error("Registration IPC error:", error);
    return {
      success: false,
      message: "Registration failed due to server error",
    };
  }
});

ipcMain.handle("auth:login", async (event, credentials) => {
  try {
    return await authAPI.login(credentials);
  } catch (error) {
    console.error("Login IPC error:", error);
    return {
      success: false,
      message: "Login failed due to server error",
    };
  }
});

ipcMain.handle("auth:validateSession", async (event, token) => {
  try {
    return await authAPI.validateSession(token);
  } catch (error) {
    console.error("Session validation IPC error:", error);
    return {
      success: false,
      message: "Session validation failed",
    };
  }
});

ipcMain.handle("auth:logout", async (event, token) => {
  try {
    return await authAPI.logout(token);
  } catch (error) {
    console.error("Logout IPC error:", error);
    return {
      success: false,
      message: "Logout failed",
    };
  }
});

ipcMain.handle("auth:getUserById", async (event, userId) => {
  try {
    return await authAPI.getUserById(userId);
  } catch (error) {
    console.error("Get user IPC error:", error);
    return {
      success: false,
      message: "Failed to get user",
    };
  }
});

ipcMain.handle("auth:updateUser", async (event, userId, updates) => {
  try {
    return await authAPI.updateUser(userId, updates);
  } catch (error) {
    console.error("Update user IPC error:", error);
    return {
      success: false,
      message: "Update failed",
    };
  }
});

// Product Management IPC handlers
ipcMain.handle("products:create", async (event, productData) => {
  try {
    return await authAPI.createProduct(productData);
  } catch (error) {
    console.error("Create product IPC error:", error);
    return {
      success: false,
      message: "Failed to create product",
    };
  }
});

ipcMain.handle("products:getByBusiness", async (event, businessId) => {
  try {
    return await authAPI.getProductsByBusiness(businessId);
  } catch (error) {
    console.error("Get products by business IPC error:", error);
    return {
      success: false,
      message: "Failed to get products",
    };
  }
});

ipcMain.handle("products:getById", async (event, id) => {
  try {
    return await authAPI.getProductById(id);
  } catch (error) {
    console.error("Get product by ID IPC error:", error);
    return {
      success: false,
      message: "Failed to get product",
    };
  }
});

ipcMain.handle("products:update", async (event, id, updates) => {
  try {
    return await authAPI.updateProduct(id, updates);
  } catch (error) {
    console.error("Update product IPC error:", error);
    return {
      success: false,
      message: "Failed to update product",
    };
  }
});

ipcMain.handle("products:delete", async (event, id) => {
  try {
    return await authAPI.deleteProduct(id);
  } catch (error) {
    console.error("Delete product IPC error:", error);
    return {
      success: false,
      message: "Failed to delete product",
    };
  }
});

ipcMain.handle("modifiers:create", async (event, modifierData) => {
  try {
    return await authAPI.createModifier(modifierData);
  } catch (error) {
    console.error("Create modifier IPC error:", error);
    return {
      success: false,
      message: "Failed to create modifier",
    };
  }
});

ipcMain.handle("stock:adjust", async (event, adjustmentData) => {
  try {
    return await authAPI.createStockAdjustment(adjustmentData);
  } catch (error) {
    console.error("Stock adjustment IPC error:", error);
    return {
      success: false,
      message: "Failed to adjust stock",
    };
  }
});

ipcMain.handle("stock:getAdjustments", async (event, productId) => {
  try {
    return await authAPI.getStockAdjustments(productId);
  } catch (error) {
    console.error("Get stock adjustments IPC error:", error);
    return {
      success: false,
      message: "Failed to get stock adjustments",
    };
  }
});

// Cleanup expired sessions every hour
setInterval(async () => {
  await authAPI.cleanupExpiredSessions();
}, 60 * 60 * 1000);
