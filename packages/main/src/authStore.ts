import { ipcMain } from "electron";
import { getAuthAPI } from "./authApi.js";
import { getDatabase } from "./database.js";

// Get auth API and database instance
const authAPI = getAuthAPI();
let db;
getDatabase().then((database) => {
  db = database;
});

// IPC handlers for key-value storage using pos_system.db
ipcMain.handle("auth:set", async (event, key: string, value: string) => {
  if (!db) db = await getDatabase();
  // Store in key-value storage table
  db.setKeyValue(key, value);
  return true;
});

ipcMain.handle("auth:get", async (event, key: string) => {
  if (!db) db = await getDatabase();
  return db.getKeyValue(key);
});

ipcMain.handle("auth:delete", async (event, key: string) => {
  if (!db) db = await getDatabase();
  db.deleteKeyValue(key);
  return true;
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

ipcMain.handle("auth:registerBusiness", async (event, userData) => {
  try {
    return await authAPI.registerBusiness(userData);
  } catch (error) {
    console.error("Business registration IPC error:", error);
    return {
      success: false,
      message: "Business registration failed due to server error",
    };
  }
});

ipcMain.handle("auth:createUser", async (event, userData) => {
  try {
    return await authAPI.createUser(userData);
  } catch (error) {
    console.error("User creation IPC error:", error);
    return {
      success: false,
      message: "User creation failed due to server error",
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

ipcMain.handle("auth:getUsersByBusiness", async (event, businessId) => {
  try {
    return await authAPI.getUsersByBusiness(businessId);
  } catch (error) {
    console.error("Get users by business IPC error:", error);
    return {
      success: false,
      message: "Failed to get users",
    };
  }
});

ipcMain.handle("auth:deleteUser", async (event, userId) => {
  try {
    return await authAPI.deleteUser(userId);
  } catch (error) {
    console.error("Delete user IPC error:", error);
    return {
      success: false,
      message: "Failed to delete user",
    };
  }
});

// Cleanup expired sessions every hour
setInterval(async () => {
  await authAPI.cleanupExpiredSessions();
}, 60 * 60 * 1000);
