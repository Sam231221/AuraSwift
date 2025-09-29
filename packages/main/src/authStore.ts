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

    console.log("Updating schedule:", { id, updates });

    const updatedSchedule = db.updateSchedule(id, updates);

    console.log("Schedule updated successfully:", updatedSchedule);

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

    console.log("Deleting schedule:", id);

    db.deleteSchedule(id);

    console.log("Schedule deleted successfully:", id);

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

    // Clean up overdue and old unclosed shifts first to prevent conflicts
    const overdueCount = db.autoEndOverdueShiftsToday();
    if (overdueCount > 0) {
      console.log(
        `Auto-ended ${overdueCount} overdue shifts before starting new shift`
      );
    }

    const closedCount = db.autoCloseOldActiveShifts();
    if (closedCount > 0) {
      console.log(
        `Auto-closed ${closedCount} old active shifts before starting new shift`
      );
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

    // First, auto-end any overdue shifts from today (more aggressive)
    const overdueCount = db.autoEndOverdueShiftsToday();
    if (overdueCount > 0) {
      console.log(`Auto-ended ${overdueCount} overdue shifts from today`);
    }

    // Then clean up old unclosed shifts (24+ hours old)
    const closedCount = db.autoCloseOldActiveShifts();
    if (closedCount > 0) {
      console.log(`Auto-closed ${closedCount} old active shifts`);
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
    console.log("Getting hourly stats for shift:", shiftId);
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
    console.log("Getting current cash drawer balance for shift:", shiftId);
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
    console.log("Getting transactions for shift ID:", shiftId);
    const db = await getDatabase();
    const transactions = db.getTransactionsByShiftId(shiftId);
    console.log("Found transactions:", transactions.length, transactions);

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
    console.log("Backend: Processing void request with data:", voidData);
    const db = await getDatabase();

    // Validate void eligibility first
    console.log("Backend: Validating void eligibility...");
    const validation = db.validateVoidEligibility(voidData.transactionId);
    console.log("Backend: Validation result:", validation);

    if (!validation.isValid) {
      console.log("Backend: Void validation failed:", validation.errors);
      return {
        success: false,
        message: `Void not allowed: ${validation.errors.join(", ")}`,
        errors: validation.errors,
      };
    }

    // Check if manager approval is required but not provided
    if (validation.requiresManagerApproval && !voidData.managerApprovalId) {
      console.log("Backend: Manager approval required but not provided");
      return {
        success: false,
        message: "Manager approval required for this void operation",
        requiresManagerApproval: true,
      };
    }

    console.log("Backend: Executing void transaction...");
    const result = db.voidTransaction(voidData);
    console.log("Backend: Void transaction result:", result);

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
    console.log("Backend: Processing cash count with data:", countData);
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

    console.log("Backend: Cash count created successfully");
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

// Cleanup expired sessions every hour
setInterval(async () => {
  await authAPI.cleanupExpiredSessions();
}, 60 * 60 * 1000);
