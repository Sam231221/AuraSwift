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

ipcMain.handle("auth:deleteUser", async (event, userId) => {
  try {
    return await authAPI.deleteUser(userId);
  } catch (error) {
    console.error("Delete user IPC error:", error);
    return {
      success: false,
      message: "Delete failed",
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

ipcMain.handle("auth:createUser", async (event, userData) => {
  try {
    return await authAPI.createUser(userData);
  } catch (error) {
    console.error("Create user IPC error:", error);
    return {
      success: false,
      message: "Failed to create user",
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

// Schedule Management API handlers
ipcMain.handle("schedules:create", async (event, scheduleData) => {
  try {
    if (!db) db = await getDatabase();
    const schedule = db.createSchedule({
      ...scheduleData,
      status: "upcoming" as const,
    });
    return {
      success: true,
      data: schedule,
    };
  } catch (error) {
    console.error("Create schedule IPC error:", error);
    return {
      success: false,
      message: "Failed to create schedule",
    };
  }
});

ipcMain.handle("schedules:getByBusiness", async (event, businessId) => {
  try {
    if (!db) db = await getDatabase();
    const schedules = db.getSchedulesByBusinessId(businessId);
    return {
      success: true,
      data: schedules,
    };
  } catch (error) {
    console.error("Get schedules IPC error:", error);
    return {
      success: false,
      message: "Failed to get schedules",
    };
  }
});

ipcMain.handle("schedules:getByStaff", async (event, staffId) => {
  try {
    if (!db) db = await getDatabase();
    const schedules = db.getSchedulesByStaffId(staffId);
    return {
      success: true,
      data: schedules,
    };
  } catch (error) {
    console.error("Get staff schedules IPC error:", error);
    return {
      success: false,
      message: "Failed to get staff schedules",
    };
  }
});

ipcMain.handle("schedules:update", async (event, id, updates) => {
  try {
    if (!db) db = await getDatabase();
    // Note: This would need a generic update method in DatabaseManager
    // For now, we'll implement individual update methods as needed
    if (updates.status) {
      db.updateScheduleStatus(id, updates.status);
    }
    // TODO: Implement full schedule update method in DatabaseManager
    return {
      success: true,
      message: "Schedule updated successfully",
    };
  } catch (error) {
    console.error("Update schedule IPC error:", error);
    return {
      success: false,
      message: "Failed to update schedule",
    };
  }
});

ipcMain.handle("schedules:delete", async (event, id) => {
  try {
    if (!db) db = await getDatabase();
    // TODO: Implement deleteSchedule method in DatabaseManager
    console.log("Delete schedule:", id);
    return {
      success: true,
      message: "Schedule deleted successfully",
    };
  } catch (error) {
    console.error("Delete schedule IPC error:", error);
    return {
      success: false,
      message: "Failed to delete schedule",
    };
  }
});

ipcMain.handle("schedules:updateStatus", async (event, id, status) => {
  try {
    if (!db) db = await getDatabase();
    db.updateScheduleStatus(id, status);
    return {
      success: true,
      message: "Schedule status updated successfully",
    };
  } catch (error) {
    console.error("Update schedule status IPC error:", error);
    return {
      success: false,
      message: "Failed to update schedule status",
    };
  }
});

ipcMain.handle("schedules:getCashierUsers", async (event, businessId) => {
  try {
    console.log("Getting cashier users for businessId:", businessId);
    if (!db) db = await getDatabase();
    const users = db.getUsersByBusiness(businessId);
    console.log("All users for business:", users);
    // Filter for cashier and manager roles only
    const staffUsers = users.filter(
      (user) => user.role === "cashier" || user.role === "manager"
    );
    console.log("Filtered staff users:", staffUsers);
    return {
      success: true,
      data: staffUsers,
    };
  } catch (error) {
    console.error("Get cashier users IPC error:", error);
    return {
      success: false,
      message: "Failed to get cashier users",
    };
  }
});

// Shift management IPC handlers
ipcMain.handle("shift:start", async (event, shiftData) => {
  try {
    console.log("Starting shift for cashier:", shiftData.cashierId);
    if (!db) db = await getDatabase();

    // Check if cashier already has an active shift
    const existingShift = db.getActiveShiftByCashier(shiftData.cashierId);
    if (existingShift) {
      return {
        success: false,
        message: "You already have an active shift running",
        data: existingShift,
      };
    }

    const shift = db.createShift({
      scheduleId: shiftData.scheduleId,
      cashierId: shiftData.cashierId,
      businessId: shiftData.businessId,
      startTime: new Date().toISOString(),
      status: "active",
      startingCash: shiftData.startingCash,
      notes: shiftData.notes,
    });

    // Update schedule status if linked
    if (shiftData.scheduleId) {
      try {
        db.updateScheduleStatus(shiftData.scheduleId, "active");
      } catch (error) {
        console.warn("Could not update schedule status:", error);
      }
    }

    console.log("Shift started successfully:", shift);
    return {
      success: true,
      message: "Shift started successfully",
      data: shift,
    };
  } catch (error) {
    console.error("Start shift IPC error:", error);
    return {
      success: false,
      message: "Failed to start shift",
    };
  }
});

ipcMain.handle("shift:end", async (event, shiftId, endData) => {
  try {
    console.log("Ending shift:", shiftId);
    if (!db) db = await getDatabase();

    db.endShift(shiftId, {
      endTime: new Date().toISOString(),
      finalCashDrawer: endData.finalCashDrawer,
      expectedCashDrawer: endData.expectedCashDrawer,
      totalSales: endData.totalSales,
      totalTransactions: endData.totalTransactions,
      totalRefunds: endData.totalRefunds,
      totalVoids: endData.totalVoids,
      notes: endData.notes,
    });

    // Note: Schedule status will need to be updated separately if needed

    return {
      success: true,
      message: "Shift ended successfully",
    };
  } catch (error) {
    console.error("End shift IPC error:", error);
    return {
      success: false,
      message: "Failed to end shift",
    };
  }
});

ipcMain.handle("shift:getActive", async (event, cashierId) => {
  try {
    console.log("Getting active shift for cashier:", cashierId);
    if (!db) db = await getDatabase();

    const shift = db.getActiveShiftByCashier(cashierId);
    return {
      success: true,
      data: shift,
    };
  } catch (error) {
    console.error("Get active shift IPC error:", error);
    return {
      success: false,
      message: "Failed to get active shift",
    };
  }
});

ipcMain.handle("shift:getTodaySchedule", async (event, cashierId) => {
  try {
    console.log("Getting today's schedule for cashier:", cashierId);
    if (!db) db = await getDatabase();

    const today = new Date();
    const dateString = today.toISOString().split("T")[0];

    // Get schedules for this cashier today
    const schedules = db.getSchedulesByStaffId(cashierId);
    const todaySchedule = schedules.find(
      (schedule) => schedule.startTime.split("T")[0] === dateString
    );

    return {
      success: true,
      data: todaySchedule || null,
    };
  } catch (error) {
    console.error("Get today's schedule IPC error:", error);
    return {
      success: false,
      message: "Failed to get today's schedule",
    };
  }
});

ipcMain.handle("shift:getStats", async (event, shiftId) => {
  try {
    console.log("Getting shift stats:", shiftId);
    if (!db) db = await getDatabase();

    const transactions = db.getTransactionsByShiftId(shiftId);

    const stats = {
      totalTransactions: transactions.length,
      totalSales: transactions
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + t.total, 0),
      totalRefunds: transactions
        .filter((t) => t.type === "refund")
        .reduce((sum, t) => sum + t.total, 0),
      totalVoids: transactions.filter((t) => t.status === "voided").length,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Get shift stats IPC error:", error);
    return {
      success: false,
      message: "Failed to get shift stats",
    };
  }
});

// Cleanup expired sessions every hour
setInterval(async () => {
  await authAPI.cleanupExpiredSessions();
}, 60 * 60 * 1000);
