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

// Register business owner (automatically sets role to admin)
ipcMain.handle("auth:registerBusiness", async (event, userData) => {
  try {
    // Business owners are automatically admin users
    const registrationData = {
      ...userData,
      role: "admin" as const,
    };

    return await authAPI.register(registrationData);
  } catch (error) {
    console.error("Business registration IPC error:", error);
    return {
      success: false,
      message: "Business registration failed due to server error",
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

ipcMain.handle("auth:getAllActiveUsers", async (event) => {
  try {
    return await authAPI.getAllActiveUsers();
  } catch (error) {
    console.error("Get all active users IPC error:", error);
    return {
      success: false,
      message: "Failed to get users",
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

// Business Management IPC handlers
ipcMain.handle("auth:getBusinessById", async (event, businessId) => {
  try {
    const db = await getDatabase();
    const business = db.getBusinessById(businessId);

    if (business) {
      return {
        success: true,
        business: business,
      };
    } else {
      return {
        success: false,
        message: "Business not found",
      };
    }
  } catch (error) {
    console.error("Get business IPC error:", error);
    return {
      success: false,
      message: "Failed to get business details",
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

// Category Management IPC handlers
ipcMain.handle("categories:create", async (event, categoryData) => {
  try {
    return await authAPI.createCategory(categoryData);
  } catch (error) {
    console.error("Create category IPC error:", error);
    return {
      success: false,
      message: "Failed to create category",
    };
  }
});

ipcMain.handle("categories:getByBusiness", async (event, businessId) => {
  try {
    return await authAPI.getCategoriesByBusiness(businessId);
  } catch (error) {
    console.error("Get categories by business IPC error:", error);
    return {
      success: false,
      message: "Failed to get categories",
    };
  }
});

ipcMain.handle("categories:getById", async (event, id) => {
  try {
    return await authAPI.getCategoryById(id);
  } catch (error) {
    console.error("Get category by ID IPC error:", error);
    return {
      success: false,
      message: "Failed to get category",
    };
  }
});

ipcMain.handle("categories:update", async (event, id, updates) => {
  try {
    return await authAPI.updateCategory(id, updates);
  } catch (error) {
    console.error("Update category IPC error:", error);
    return {
      success: false,
      message: "Failed to update category",
    };
  }
});

ipcMain.handle("categories:delete", async (event, id) => {
  try {
    return await authAPI.deleteCategory(id);
  } catch (error) {
    console.error("Delete category IPC error:", error);
    return {
      success: false,
      message: "Failed to delete category",
    };
  }
});

ipcMain.handle("categories:reorder", async (event, businessId, categoryIds) => {
  try {
    return await authAPI.reorderCategories(businessId, categoryIds);
  } catch (error) {
    console.error("Reorder categories IPC error:", error);
    return {
      success: false,
      message: "Failed to reorder categories",
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

    const updatedSchedule = db.updateSchedule(id, updates);

    return {
      success: true,
      message: "Schedule updated successfully",
      data: updatedSchedule,
    };
  } catch (error) {
    console.error("Update schedule IPC error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update schedule",
    };
  }
});

ipcMain.handle("schedules:delete", async (event, id) => {
  try {
    if (!db) db = await getDatabase();

    db.deleteSchedule(id);

    return {
      success: true,
      message: "Schedule deleted successfully",
    };
  } catch (error) {
    console.error("Delete schedule IPC error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete schedule",
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
    if (!db) db = await getDatabase();
    const users = db.users.getUsersByBusiness(businessId);
    // Filter for cashier and manager roles only
    const staffUsers = users.filter(
      (user) => user.role === "cashier" || user.role === "manager"
    );
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
    if (!db) db = await getDatabase();

    // Clean up overdue and old unclosed shifts first to prevent conflicts
    const overdueCount = db.autoEndOverdueShiftsToday();
    if (overdueCount > 0) {
      // auto-ended overdue shifts
    }

    const closedCount = db.autoCloseOldActiveShifts();
    if (closedCount > 0) {
      // auto-closed old active shifts
    }

    // Check if cashier already has an active shift (only check today's shifts)
    const existingShift = db.getTodaysActiveShiftByCashier(shiftData.cashierId);
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
    if (!db) db = await getDatabase();

    // First, auto-end any overdue shifts from today (more aggressive)
    const overdueCount = db.autoEndOverdueShiftsToday();
    if (overdueCount > 0) {
      // auto-ended overdue shifts from today
    }

    // Then clean up old unclosed shifts (24+ hours old)
    const closedCount = db.autoCloseOldActiveShifts();
    if (closedCount > 0) {
      // auto-closed old active shifts
    }

    // Use the new method that checks for today's active shift only
    const shift = db.getTodaysActiveShiftByCashier(cashierId);
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
    if (!db) db = await getDatabase();

    const transactions = db.getTransactionsByShiftId(shiftId);

    const stats = {
      totalTransactions: transactions.filter((t) => t.status === "completed")
        .length,
      totalSales: transactions
        .filter((t) => t.type === "sale" && t.status === "completed")
        .reduce((sum, t) => sum + t.total, 0),
      totalRefunds: Math.abs(
        transactions
          .filter((t) => t.type === "refund" && t.status === "completed")
          .reduce((sum, t) => sum + t.total, 0)
      ),
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

ipcMain.handle("shift:getHourlyStats", async (event, shiftId) => {
  try {
    if (!db) db = await getDatabase();

    const hourlyStats = db.getHourlyTransactionStats(shiftId);

    return {
      success: true,
      data: hourlyStats,
    };
  } catch (error) {
    console.error("Get hourly stats IPC error:", error);
    return {
      success: false,
      message: "Failed to get hourly stats",
    };
  }
});

ipcMain.handle("shift:getCashDrawerBalance", async (event, shiftId) => {
  try {
    if (!db) db = await getDatabase();

    const cashBalance = db.getCurrentCashDrawerBalance(shiftId);

    return {
      success: true,
      data: cashBalance,
    };
  } catch (error) {
    console.error("Get cash drawer balance IPC error:", error);
    return {
      success: false,
      message: "Failed to get cash drawer balance",
    };
  }
});

// Transaction API endpoints
ipcMain.handle("transactions:create", async (event, transactionData) => {
  try {
    const db = await getDatabase();
    const transaction = db.createTransaction(transactionData);

    return {
      success: true,
      transaction,
    };
  } catch (error) {
    console.error("Create transaction IPC error:", error);
    return {
      success: false,
      message: "Failed to create transaction",
    };
  }
});

ipcMain.handle("transactions:getByShift", async (event, shiftId) => {
  try {
    const db = await getDatabase();
    const transactions = db.getTransactionsByShiftId(shiftId);

    return {
      success: true,
      data: transactions,
    };
  } catch (error) {
    console.error("Get transactions by shift IPC error:", error);
    return {
      success: false,
      message: "Failed to get transactions",
    };
  }
});

// Shift reconciliation endpoints for auto-ended shifts
ipcMain.handle(
  "shift:reconcile",
  async (event, shiftId, reconciliationData) => {
    try {
      const db = await getDatabase();

      // Update shift with actual cash drawer amount and manager approval
      const updatedShift = db.reconcileShift(shiftId, reconciliationData);

      return {
        success: true,
        shift: updatedShift,
      };
    } catch (error) {
      console.error("Reconcile shift IPC error:", error);
      return {
        success: false,
        message: "Failed to reconcile shift",
      };
    }
  }
);

ipcMain.handle("shift:getPendingReconciliation", async (event, businessId) => {
  try {
    const db = await getDatabase();
    const pendingShifts = db.getPendingReconciliationShifts(businessId);

    return {
      success: true,
      shifts: pendingShifts,
    };
  } catch (error) {
    console.error("Get pending reconciliation shifts IPC error:", error);
    return {
      success: false,
      message: "Failed to get pending reconciliation shifts",
    };
  }
});

// Refund Transaction API endpoints
ipcMain.handle("refunds:getTransactionById", async (event, transactionId) => {
  try {
    const db = await getDatabase();
    const transaction = db.getTransactionById(transactionId);

    return {
      success: !!transaction,
      transaction,
      message: transaction ? undefined : "Transaction not found",
    };
  } catch (error) {
    console.error("Get transaction by ID IPC error:", error);
    return {
      success: false,
      message: "Failed to get transaction",
    };
  }
});

ipcMain.handle(
  "refunds:getTransactionByReceipt",
  async (event, receiptNumber) => {
    try {
      const db = await getDatabase();
      const transaction = db.getTransactionByReceiptNumber(receiptNumber);

      return {
        success: !!transaction,
        transaction,
        message: transaction ? undefined : "Transaction not found",
      };
    } catch (error) {
      console.error("Get transaction by receipt IPC error:", error);
      return {
        success: false,
        message: "Failed to get transaction",
      };
    }
  }
);

ipcMain.handle(
  "refunds:getRecentTransactions",
  async (event, businessId, limit = 50) => {
    try {
      const db = await getDatabase();
      const transactions = db.getRecentTransactions(businessId, limit);

      return {
        success: true,
        transactions,
      };
    } catch (error) {
      console.error("Get recent transactions IPC error:", error);
      return {
        success: false,
        message: "Failed to get recent transactions",
      };
    }
  }
);

ipcMain.handle(
  "refunds:getShiftTransactions",
  async (event, shiftId, limit = 50) => {
    try {
      const db = await getDatabase();
      const transactions = db.getShiftTransactions(shiftId, limit);

      return {
        success: true,
        transactions,
      };
    } catch (error) {
      console.error("Get shift transactions IPC error:", error);
      return {
        success: false,
        message: "Failed to get shift transactions",
      };
    }
  }
);

ipcMain.handle(
  "refunds:validateEligibility",
  async (event, transactionId, refundItems) => {
    try {
      const db = await getDatabase();
      const validation = db.validateRefundEligibility(
        transactionId,
        refundItems
      );

      return {
        success: true,
        validation,
      };
    } catch (error) {
      console.error("Validate refund eligibility IPC error:", error);
      return {
        success: false,
        message: "Failed to validate refund eligibility",
      };
    }
  }
);

ipcMain.handle("refunds:create", async (event, refundData) => {
  try {
    const db = await getDatabase();

    // Validate refund eligibility first
    const validation = db.validateRefundEligibility(
      refundData.originalTransactionId,
      refundData.refundItems
    );
    if (!validation.isValid) {
      return {
        success: false,
        message: `Refund not allowed: ${validation.errors.join(", ")}`,
        errors: validation.errors,
      };
    }

    const refundTransaction = db.createRefundTransaction(refundData);

    return {
      success: true,
      transaction: refundTransaction,
    };
  } catch (error) {
    console.error("Create refund IPC error:", error);
    return {
      success: false,
      message: "Failed to create refund",
    };
  }
});

// Void transaction handlers
ipcMain.handle("voids:validateEligibility", async (event, transactionId) => {
  try {
    const db = await getDatabase();
    const validation = db.validateVoidEligibility(transactionId);

    return {
      success: true,
      data: validation,
    };
  } catch (error) {
    console.error("Validate void eligibility IPC error:", error);
    return {
      success: false,
      message: "Failed to validate void eligibility",
    };
  }
});

ipcMain.handle("voids:create", async (event, voidData) => {
  try {
    const db = await getDatabase();

    // Validate void eligibility first
    const validation = db.validateVoidEligibility(voidData.transactionId);

    if (!validation.isValid) {
      return {
        success: false,
        message: `Void not allowed: ${validation.errors.join(", ")}`,
        errors: validation.errors,
      };
    }

    // Check if manager approval is required but not provided
    if (validation.requiresManagerApproval && !voidData.managerApprovalId) {
      return {
        success: false,
        message: "Manager approval required for this void operation",
        requiresManagerApproval: true,
      };
    }

    const result = db.voidTransaction(voidData);

    return result;
  } catch (error) {
    console.error("Create void IPC error:", error);
    return {
      success: false,
      message: "Failed to void transaction",
    };
  }
});

// Additional void API handlers for transaction lookup
ipcMain.handle("voids:getTransactionById", async (event, transactionId) => {
  try {
    const db = await getDatabase();
    const transaction = db.getTransactionByIdAnyStatus(transactionId);

    return {
      success: true,
      data: transaction,
    };
  } catch (error) {
    console.error("Get transaction by ID for void IPC error:", error);
    return {
      success: false,
      message: "Failed to get transaction",
    };
  }
});

ipcMain.handle(
  "voids:getTransactionByReceipt",
  async (event, receiptNumber) => {
    try {
      const db = await getDatabase();
      const transaction =
        db.getTransactionByReceiptNumberAnyStatus(receiptNumber);

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      console.error("Get transaction by receipt for void IPC error:", error);
      return {
        success: false,
        message: "Failed to get transaction",
      };
    }
  }
);

// Cash Drawer Count IPC Handlers
ipcMain.handle("cashDrawer:getExpectedCash", async (event, shiftId) => {
  try {
    const db = await getDatabase();
    const result = db.getExpectedCashForShift(shiftId);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Get expected cash IPC error:", error);
    return {
      success: false,
      message: "Failed to get expected cash amount",
    };
  }
});

ipcMain.handle("cashDrawer:createCount", async (event, countData) => {
  try {
    const db = await getDatabase();

    // Get shift to determine business ID
    const shift = db.getShiftById(countData.shiftId);

    if (!shift) {
      throw new Error("Shift not found");
    }

    // Create the cash drawer count
    const cashDrawerCount = db.createCashDrawerCount({
      shiftId: countData.shiftId,
      businessId: shift.businessId,
      countType: countData.countType,
      expectedAmount: countData.expectedAmount,
      countedAmount: countData.countedAmount,
      variance: countData.variance,
      notes: countData.notes,
      countedBy: countData.countedBy,
      timestamp: new Date().toISOString(),
    });

    // Create audit log entry for the count
    if (Math.abs(countData.variance) > 0) {
      db.createAuditLog({
        userId: countData.countedBy,
        action: "cash-count",
        resource: "cash_drawer_counts",
        resourceId: cashDrawerCount.id,
        details: {
          countType: countData.countType,
          expectedAmount: countData.expectedAmount,
          countedAmount: countData.countedAmount,
          variance: countData.variance,
          denominations: countData.denominations || [],
          managerApproval: countData.managerApprovalId,
        },
      });
    }

    return {
      success: true,
      data: cashDrawerCount,
    };
  } catch (error) {
    console.error("Create cash count IPC error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create cash count",
    };
  }
});

ipcMain.handle("cashDrawer:getCountsByShift", async (event, shiftId) => {
  try {
    const db = await getDatabase();
    const counts = db.getCashDrawerCountsByShiftId(shiftId);

    return {
      success: true,
      data: counts,
    };
  } catch (error) {
    console.error("Get cash drawer counts IPC error:", error);
    return {
      success: false,
      message: "Failed to get cash drawer counts",
    };
  }
});

// Database Information IPC Handler (for debugging)
ipcMain.handle("database:getInfo", async () => {
  try {
    const db = await getDatabase();
    const info = db.getDatabaseInfo();

    return {
      success: true,
      data: info,
    };
  } catch (error) {
    console.error("Get database info IPC error:", error);
    return {
      success: false,
      message: "Failed to get database information",
    };
  }
});

// Database Backup IPC Handler - Save database to user-selected location
ipcMain.handle("database:backup", async (event) => {
  try {
    const { dialog, BrowserWindow } = await import("electron");
    const fs = await import("fs/promises");
    const path = await import("path");

    const db = await getDatabase();
    const info = db.getDatabaseInfo();

    // Generate default filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const timeStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
    const defaultFilename = `auraswift-backup-${timestamp}-${timeStr}.db`;

    // Show save dialog
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(focusedWindow!, {
      title: "Save Database Backup",
      defaultPath: defaultFilename,
      filters: [
        { name: "Database Files", extensions: ["db"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return {
        success: false,
        message: "Backup cancelled by user",
        cancelled: true,
      };
    }

    // Copy database file to selected location
    await fs.copyFile(info.path, result.filePath);

    // Get file stats for confirmation
    const stats = await fs.stat(result.filePath);

    return {
      success: true,
      data: {
        path: result.filePath,
        size: stats.size,
        timestamp: new Date().toISOString(),
      },
      message: "Database backed up successfully",
    };
  } catch (error) {
    console.error("Database backup error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to backup database",
    };
  }
});

// Database Empty IPC Handler - Delete all data from all tables (keep structure)
ipcMain.handle("database:empty", async (event) => {
  try {
    const db = await getDatabase();
    const info = db.getDatabaseInfo();

    // Create automatic backup before emptying
    const fs = await import("fs/promises");
    const path = await import("path");

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const timeStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
    const backupPath = info.path.replace(
      ".db",
      `-backup-before-empty-${timestamp}-${timeStr}.db`
    );

    // Create backup
    await fs.copyFile(info.path, backupPath);
    console.log(`Backup created before emptying: ${backupPath}`);

    // Get backup file stats
    const backupStats = await fs.stat(backupPath);
    const backupSize = backupStats.size;

    // Empty all tables using the public method
    const result = await db.emptyAllTables();

    if (!result.success) {
      return {
        success: false,
        message: result.error || "Failed to empty database",
      };
    }

    return {
      success: true,
      data: {
        backupPath,
        backupSize,
        tablesEmptied: result.tablesEmptied.length,
        totalRowsDeleted: result.rowsDeleted,
        tableList: result.tablesEmptied,
      },
      message: "Database emptied successfully",
    };
  } catch (error) {
    console.error("Database empty error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to empty database",
    };
  }
});

// Database Import IPC Handler - Import database from a file
ipcMain.handle("database:import", async (event) => {
  try {
    const { dialog, app: electronApp } = await import("electron");
    const fs = await import("fs/promises");
    const path = await import("path");

    // Show open file dialog to select database file
    const result = await dialog.showOpenDialog({
      title: "Select Database File to Import",
      buttonLabel: "Import",
      filters: [
        { name: "Database Files", extensions: ["db", "sqlite", "sqlite3"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    // Check if user cancelled
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return {
        success: false,
        cancelled: true,
        message: "Import cancelled by user",
      };
    }

    const importPath = result.filePaths[0];
    console.log("Importing database from:", importPath);

    // Verify the file exists and is readable
    try {
      await fs.access(importPath);
    } catch (error) {
      return {
        success: false,
        message: "Selected file does not exist or is not accessible",
      };
    }

    // Get file stats
    const importStats = await fs.stat(importPath);
    const importSize = importStats.size;

    // Get current database info (before closing)
    const db = await getDatabase();
    const info = db.getDatabaseInfo();

    // Create backup of current database before importing
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const timeStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
    const backupPath = info.path.replace(
      ".db",
      `-backup-before-import-${timestamp}-${timeStr}.db`
    );

    // Backup current database
    if (info.exists) {
      await fs.copyFile(info.path, backupPath);
      console.log(`Current database backed up to: ${backupPath}`);
    }

    // Close current database connection
    const { closeDatabase } = await import("./database.js");
    closeDatabase();
    console.log("Database connection closed");

    // Wait a bit to ensure database is fully closed
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Copy imported file to database location
    await fs.copyFile(importPath, info.path);
    console.log(`Database imported from: ${importPath}`);

    // Get stats of imported database
    const newStats = await fs.stat(info.path);

    // Return success (app will restart from renderer side)
    return {
      success: true,
      data: {
        importedFrom: importPath,
        importSize,
        backupPath: info.exists ? backupPath : undefined,
        newSize: newStats.size,
      },
      message: "Database imported successfully",
    };
  } catch (error) {
    console.error("Database import error:", error);

    // Try to reinitialize database if import failed
    try {
      const { getDatabase: getNewDatabase } = await import("./database.js");
      await getNewDatabase();
    } catch (reinitError) {
      console.error(
        "Failed to reinitialize database after error:",
        reinitError
      );
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to import database",
    };
  }
});

// App Restart IPC Handler - Restart the application
ipcMain.handle("app:restart", async () => {
  try {
    const { app: electronApp } = await import("electron");

    console.log("Restarting application...");

    // Close database connection before restart
    const { closeDatabase } = await import("./database.js");
    closeDatabase();

    // Relaunch and exit
    electronApp.relaunch();
    electronApp.exit(0);

    return { success: true };
  } catch (error) {
    console.error("App restart error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to restart app",
    };
  }
});

// Cleanup expired sessions every hour

// Cleanup expired sessions every hour// Cleanup expired sessions every hour
setInterval(async () => {
  await authAPI.cleanupExpiredSessions();
}, 60 * 60 * 1000);
