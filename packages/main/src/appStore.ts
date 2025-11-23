import { ipcMain } from "electron";
import { getDatabase, type DatabaseManagers } from "./database/index.js";
import { ExpiryNotificationService } from "./services/expiryNotificationService.js";

// Get database instance
let db: DatabaseManagers | null = null;
getDatabase().then((database) => {
  db = database;
});

// IPC handlers for persistent key-value storage using app_settings table
ipcMain.handle("auth:set", async (event, key: string, value: string) => {
  try {
    if (!db) db = await getDatabase();
    // Store key-value pair in app_settings table
    db.settings.setSetting(key, value);
    return true;
  } catch (error) {
    console.error("Error setting auth data:", error);
    return false;
  }
});

ipcMain.handle("auth:get", async (event, key: string) => {
  try {
    if (!db) db = await getDatabase();
    const value = db.settings.getSetting(key);
    return value;
  } catch (error) {
    console.error("Error getting auth data:", error);
    return null;
  }
});

ipcMain.handle("auth:delete", async (event, key: string) => {
  try {
    if (!db) db = await getDatabase();
    db.settings.deleteSetting(key);
    return true;
  } catch (error) {
    console.error("Error deleting auth data:", error);
    return false;
  }
});

// Authentication API handlers
ipcMain.handle("auth:register", async (event, userData) => {
  try {
    if (!db) db = await getDatabase();
    return await db.users.register(userData);
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
    if (!db) db = await getDatabase();
    // Business owners are automatically admin users
    const registrationData = {
      ...userData,
      role: "admin" as const,
    };

    return await db.users.register(registrationData);
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
    if (!db) db = await getDatabase();
    return await db.users.login(credentials);
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
    if (!db) db = await getDatabase();
    return db.users.validateSession(token);
  } catch (error) {
    console.error("Session validation IPC error:", error);
    return {
      success: false,
      message: "Session validation failed",
    };
  }
});

ipcMain.handle("auth:logout", async (event, token, options) => {
  try {
    if (!db) db = await getDatabase();

    // Get user from session before logout to check for active POS shifts
    const session = db.sessions.getSessionByToken(token);
    if (session) {
      const user = db.users.getUserById(session.userId);

      // Check for active POS shifts before allowing clock-out
      if (user && (user.role === "cashier" || user.role === "manager")) {
        const activeTimeShift = db.timeTracking.getActiveShift(user.id);

        if (activeTimeShift) {
          // Check if there are active POS shifts for this TimeShift
          const activePosShifts = db.shifts.getActiveShiftsByTimeShift(
            activeTimeShift.id
          );

          if (activePosShifts.length > 0 && options?.autoClockOut !== false) {
            // User has active POS shifts - auto-end them before clock-out
            console.log(
              `Auto-ending ${activePosShifts.length} active POS shift(s) before clock-out for user ${user.id}`
            );

            const failedShifts: string[] = [];

            for (const posShift of activePosShifts) {
              try {
                // Estimate final cash (starting cash + sales)
                const estimatedCash =
                  posShift.startingCash + (posShift.totalSales || 0);

                db.shifts.endShift(posShift.id, {
                  endTime: new Date().toISOString(),
                  finalCashDrawer: estimatedCash,
                  expectedCashDrawer: estimatedCash,
                  totalSales: posShift.totalSales || 0,
                  totalTransactions: posShift.totalTransactions || 0,
                  totalRefunds: posShift.totalRefunds || 0,
                  totalVoids: posShift.totalVoids || 0,
                  notes: posShift.notes
                    ? `${posShift.notes}; Auto-ended on logout`
                    : "Auto-ended on logout",
                });

                console.log(`Auto-ended POS shift ${posShift.id} on logout`);
              } catch (error) {
                failedShifts.push(posShift.id);
                console.error(
                  `Failed to auto-end POS shift ${posShift.id} on logout:`,
                  error
                );
              }
            }

            // After ending all POS shifts, check if TimeShift should be clocked out
            // Only clock out if all shifts were successfully ended
            if (failedShifts.length === 0) {
              const remainingActiveShifts =
                db.shifts.getActiveShiftsByTimeShift(activeTimeShift.id);
              if (remainingActiveShifts.length === 0) {
                // All shifts ended successfully, clock out TimeShift
                try {
                  const activeBreak = db.timeTracking.getActiveBreak(
                    activeTimeShift.id
                  );
                  if (activeBreak) {
                    await db.timeTracking.endBreak(activeBreak.id);
                  }

                  const clockOutEvent = await db.timeTracking.createClockEvent({
                    userId: user.id,
                    terminalId: options?.terminalId || "unknown",
                    type: "out",
                    method: "auto",
                    ipAddress: options?.ipAddress,
                    notes: "Auto clock-out: All POS shifts ended on logout",
                  });

                  await db.timeTracking.completeShift(
                    activeTimeShift.id,
                    clockOutEvent.id
                  );
                  console.log(
                    `Auto clocked out TimeShift ${activeTimeShift.id} after ending all POS shifts on logout`
                  );
                } catch (error) {
                  console.error(
                    "Failed to clock out TimeShift after ending POS shifts:",
                    error
                  );
                }
              }
            } else {
              console.warn(
                `Cannot clock out TimeShift ${activeTimeShift.id}: ${
                  failedShifts.length
                } POS shift(s) failed to end: ${failedShifts.join(", ")}`
              );
            }
          }
        }
      }
    }

    return await db.users.logout(token, options);
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
    if (!db) db = await getDatabase();
    return db.users.getUserByIdWithResponse(userId);
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
    if (!db) db = await getDatabase();
    return db.users.updateUserWithResponse(userId, updates);
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
    if (!db) db = await getDatabase();
    return db.users.deleteUserWithResponse(userId);
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
    if (!db) db = await getDatabase();
    return db.users.getUsersByBusinessWithResponse(businessId);
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
    if (!db) db = await getDatabase();
    return await db.users.createUserForBusiness(userData);
  } catch (error) {
    console.error("Create user IPC error:", error);
    return {
      success: false,
      message: "Failed to create user",
    };
  }
});

ipcMain.handle("auth:getAllActiveUsers", async (event) => {
  try {
    const db = await getDatabase();
    const users = db.users.getAllActiveUsers();

    return {
      success: true,
      users,
    };
  } catch (error) {
    console.error("Get all active users IPC error:", error);
    return {
      success: false,
      message: "Failed to get active users",
    };
  }
});

// Business Management IPC handlers
ipcMain.handle("auth:getBusinessById", async (event, businessId) => {
  try {
    const db = await getDatabase();
    const business = db.businesses.getBusinessById(businessId);

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
    if (!db) db = await getDatabase();
    return await db.products.createProductWithValidation(productData);
  } catch (error: any) {
    console.error("Create product IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to create product",
    };
  }
});

ipcMain.handle("products:getByBusiness", async (event, businessId) => {
  try {
    if (!db) db = await getDatabase();
    return await db.products.getProductsByBusinessWithResponse(businessId);
  } catch (error: any) {
    console.error("Get products by business IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to get products",
    };
  }
});

ipcMain.handle("products:getById", async (event, id) => {
  try {
    if (!db) db = await getDatabase();
    return await db.products.getProductByIdWithResponse(id);
  } catch (error: any) {
    console.error("Get product by ID IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to get product",
    };
  }
});

ipcMain.handle("products:update", async (event, id, updates) => {
  try {
    if (!db) db = await getDatabase();
    return await db.products.updateProductWithValidation(id, updates);
  } catch (error: any) {
    console.error("Update product IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to update product",
    };
  }
});

ipcMain.handle("products:delete", async (event, id) => {
  try {
    if (!db) db = await getDatabase();
    return await db.products.deleteProductWithResponse(id);
  } catch (error: any) {
    console.error("Delete product IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to delete product",
    };
  }
});

// Category Management IPC handlers
ipcMain.handle("categories:create", async (event, categoryData) => {
  try {
    if (!db) db = await getDatabase();
    return await db.categories.createCategoryWithResponse(categoryData);
  } catch (error: any) {
    console.error("Create category IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to create category",
    };
  }
});

ipcMain.handle("categories:getByBusiness", async (event, businessId) => {
  try {
    if (!db) db = await getDatabase();
    return await db.categories.getCategoriesByBusinessWithResponse(businessId);
  } catch (error: any) {
    console.error("Get categories by business IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to get categories",
    };
  }
});

ipcMain.handle("categories:getById", async (event, id) => {
  try {
    if (!db) db = await getDatabase();
    return await db.categories.getCategoryByIdWithResponse(id);
  } catch (error: any) {
    console.error("Get category by ID IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to get category",
    };
  }
});

ipcMain.handle("categories:update", async (event, id, updates) => {
  try {
    if (!db) db = await getDatabase();
    return await db.categories.updateCategoryWithResponse(id, updates);
  } catch (error: any) {
    console.error("Update category IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to update category",
    };
  }
});

ipcMain.handle("categories:delete", async (event, id) => {
  try {
    if (!db) db = await getDatabase();
    return await db.categories.deleteCategoryWithResponse(id);
  } catch (error: any) {
    console.error("Delete category IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to delete category",
    };
  }
});

ipcMain.handle("categories:reorder", async (event, businessId, categoryIds) => {
  try {
    if (!db) db = await getDatabase();
    return await db.categories.reorderCategoriesWithResponse(
      businessId,
      categoryIds
    );
  } catch (error: any) {
    console.error("Reorder categories IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to reorder categories",
    };
  }
});

ipcMain.handle("modifiers:create", async (event, modifierData) => {
  try {
    if (!db) db = await getDatabase();
    // TODO: Implement createModifier in product manager
    return {
      success: false,
      message: "Modifier creation not yet implemented in new architecture",
    };
  } catch (error: any) {
    console.error("Create modifier IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to create modifier",
    };
  }
});

ipcMain.handle("stock:adjust", async (event, adjustmentData) => {
  try {
    if (!db) db = await getDatabase();
    const adjustment = db.inventory.createStockAdjustment(adjustmentData);
    return {
      success: true,
      message: "Stock adjustment created successfully",
      adjustment,
    };
  } catch (error: any) {
    console.error("Stock adjustment IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to adjust stock",
    };
  }
});

ipcMain.handle("stock:getAdjustments", async (event, productId) => {
  try {
    if (!db) db = await getDatabase();
    const adjustments = db.inventory.getStockAdjustmentsByProduct(productId);
    return {
      success: true,
      message: "Stock adjustments retrieved successfully",
      adjustments,
    };
  } catch (error: any) {
    console.error("Get stock adjustments IPC error:", error);
    return {
      success: false,
      message: error.message || "Failed to get stock adjustments",
    };
  }
});

// Schedule Management API handlers
ipcMain.handle("schedules:create", async (event, scheduleData) => {
  try {
    if (!db) db = await getDatabase();
    const schedule = db.schedules.createSchedule({
      ...scheduleData,
      status: "upcoming" as const,
    });

    // Convert to plain object to ensure serialization works
    const serializedSchedule = JSON.parse(JSON.stringify(schedule));

    return {
      success: true,
      data: serializedSchedule,
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
    const schedules = db.schedules.getSchedulesByBusiness(businessId);

    // Convert to plain objects to ensure serialization works
    const serializedSchedules = JSON.parse(JSON.stringify(schedules));

    return {
      success: true,
      data: serializedSchedules,
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
    const schedules = db.schedules.getSchedulesByStaffId(staffId);

    // Convert to plain objects to ensure serialization works
    const serializedSchedules = JSON.parse(JSON.stringify(schedules));

    return {
      success: true,
      data: serializedSchedules,
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

    const updatedSchedule = db.schedules.updateSchedule(id, updates);

    // Convert to plain object to ensure serialization works
    const serializedSchedule = JSON.parse(JSON.stringify(updatedSchedule));

    return {
      success: true,
      message: "Schedule updated successfully",
      data: serializedSchedule,
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

    db.schedules.deleteSchedule(id);

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
    db.schedules.updateScheduleStatus(id, status);
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

    // Convert to plain objects to ensure serialization works
    const serializedUsers = JSON.parse(JSON.stringify(staffUsers));

    return {
      success: true,
      data: serializedUsers,
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

    // Helper function to handle clock-out after closing shifts
    const handleClockOutAfterShiftClose = async (
      closedShifts: Array<{
        id: string;
        timeShiftId: string | null;
        cashierId: string;
      }>
    ) => {
      if (closedShifts.length === 0) return;

      // Group closed shifts by timeShiftId to check if we need to clock out
      const timeShiftGroups = new Map<
        string,
        Array<{ id: string; cashierId: string }>
      >();

      for (const closedShift of closedShifts) {
        if (closedShift.timeShiftId && closedShift.timeShiftId.trim() !== "") {
          if (!timeShiftGroups.has(closedShift.timeShiftId)) {
            timeShiftGroups.set(closedShift.timeShiftId, []);
          }
          timeShiftGroups.get(closedShift.timeShiftId)!.push({
            id: closedShift.id,
            cashierId: closedShift.cashierId,
          });
        }
      }

      // For each TimeShift, check if all POS shifts are now closed
      for (const [timeShiftId, closedPosShifts] of timeShiftGroups.entries()) {
        if (!db) continue;
        const remainingActiveShifts =
          db.shifts.getActiveShiftsByTimeShift(timeShiftId);

        if (remainingActiveShifts.length === 0) {
          // All POS shifts for this TimeShift are closed, clock out TimeShift
          const timeShift = db.timeTracking.getShiftById(timeShiftId);
          if (timeShift && timeShift.status === "active") {
            // Validate cashierId before clock-out
            const cashierId = closedPosShifts[0]?.cashierId;
            if (!cashierId) {
              console.error(
                `Cannot clock out TimeShift ${timeShiftId}: closed shifts have no cashierId`
              );
            } else {
              try {
                if (!db) continue;
                // End any active breaks
                const activeBreak = db.timeTracking.getActiveBreak(timeShiftId);
                if (activeBreak) {
                  await db.timeTracking.endBreak(activeBreak.id);
                }

                // Create clock-out event
                const clockOutEvent = await db.timeTracking.createClockEvent({
                  userId: cashierId,
                  terminalId: "system",
                  type: "out",
                  method: "auto",
                  notes: "Auto clock-out: All POS shifts auto-closed",
                });

                // Complete the TimeShift
                await db.timeTracking.completeShift(
                  timeShiftId,
                  clockOutEvent.id
                );

                console.log(
                  `Auto clocked out TimeShift ${timeShiftId} after all POS shifts were auto-closed`
                );
              } catch (error) {
                console.error(
                  `Failed to clock out TimeShift ${timeShiftId} after auto-closing shifts:`,
                  error
                );
              }
            }
          }
        }
      }
    };

    // Clean up overdue and old unclosed shifts first to prevent conflicts
    const overdueShifts = db.shifts.autoEndOverdueShiftsToday();
    await handleClockOutAfterShiftClose(overdueShifts);

    // Auto-close old active shifts and clock out TimeShifts if needed
    const closedShifts = db.shifts.autoCloseOldActiveShifts();
    await handleClockOutAfterShiftClose(closedShifts);

    // Check if cashier already has an active shift (only check today's shifts)
    const existingShift = db.shifts.getTodaysActiveShift(shiftData.cashierId);
    if (existingShift) {
      // Check if shift is on different device
      const isDifferentDevice =
        shiftData.deviceId &&
        existingShift.deviceId &&
        shiftData.deviceId !== existingShift.deviceId;

      // Convert to plain object to ensure serialization works
      const serializedExistingShift = JSON.parse(JSON.stringify(existingShift));

      return {
        success: false,
        message: isDifferentDevice
          ? "You already have an active shift running on another device"
          : "You already have an active shift running",
        data: serializedExistingShift,
        isDifferentDevice,
      };
    }

    // Get active time shift (user should be clocked in)
    const activeTimeShift = db.timeTracking.getActiveShift(shiftData.cashierId);
    if (!activeTimeShift) {
      return {
        success: false,
        message: "Please clock in before starting a shift",
      };
    }

    // Validate starting cash before creating shift
    if (shiftData.startingCash < 0) {
      return {
        success: false,
        message: "Starting cash cannot be negative",
      };
    }

    if (shiftData.startingCash > 100000) {
      return {
        success: false,
        message: "Starting cash exceeds maximum limit of £100,000",
      };
    }

    // Create shift with transaction support
    // Note: Schedule status update is done separately as it's not critical for shift creation
    let shift;
    try {
      shift = db.shifts.createShift({
        scheduleId: shiftData.scheduleId ?? null,
        timeShiftId: activeTimeShift.id, // Link to time shift
        cashierId: shiftData.cashierId,
        businessId: shiftData.businessId,
        deviceId: shiftData.deviceId ?? null, // Device/terminal identifier
        startTime: new Date().toISOString(),
        endTime: null,
        status: "active",
        startingCash: shiftData.startingCash,
        finalCashDrawer: null,
        expectedCashDrawer: null,
        cashVariance: null,
        totalSales: 0,
        totalTransactions: 0,
        totalRefunds: 0,
        totalVoids: 0,
        notes: shiftData.notes ?? null,
      } as any);
    } catch (error) {
      console.error("Failed to create shift:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create shift due to validation error",
      };
    }

    // Update schedule status if linked (non-critical, so we don't fail if this errors)
    if (shiftData.scheduleId) {
      try {
        db.schedules.updateScheduleStatus(shiftData.scheduleId, "active");
      } catch (error) {
        console.warn("Could not update schedule status:", error);
        // Don't fail shift creation if schedule update fails
      }
    }

    // Convert to plain object to ensure serialization works
    const serializedShift = JSON.parse(JSON.stringify(shift));

    return {
      success: true,
      message: "Shift started successfully",
      data: serializedShift,
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

    // Get the shift being ended to check its timeShiftId
    const shift = db.shifts.getShiftById(shiftId);
    const timeShiftId = shift.timeShiftId;

    // End the POS shift
    db.shifts.endShift(shiftId, {
      endTime: new Date().toISOString(),
      finalCashDrawer: endData.finalCashDrawer,
      expectedCashDrawer: endData.expectedCashDrawer,
      totalSales: endData.totalSales,
      totalTransactions: endData.totalTransactions,
      totalRefunds: endData.totalRefunds,
      totalVoids: endData.totalVoids,
      notes: endData.notes,
    });

    // Check if this was the last active POS shift for this TimeShift
    // If so, automatically clock out the TimeShift
    if (timeShiftId && timeShiftId.trim() !== "") {
      // Check for remaining active shifts (current shift is already ended)
      const remainingActiveShifts =
        db.shifts.getActiveShiftsByTimeShift(timeShiftId);

      if (remainingActiveShifts.length === 0) {
        // This is the last active POS shift for this TimeShift
        // Check if TimeShift is still active
        const timeShift = db.timeTracking.getShiftById(timeShiftId);
        if (timeShift && timeShift.status === "active") {
          // Validate cashierId before clock-out
          if (!shift.cashierId) {
            console.error(
              `Cannot clock out TimeShift ${timeShiftId}: shift ${shiftId} has no cashierId`
            );
          } else {
            try {
              // End any active breaks first
              const activeBreak = db.timeTracking.getActiveBreak(timeShiftId);
              if (activeBreak) {
                await db.timeTracking.endBreak(activeBreak.id);
              }

              // Create clock-out event
              const clockOutEvent = await db.timeTracking.createClockEvent({
                userId: shift.cashierId,
                terminalId: "system",
                type: "out",
                method: "auto",
                notes: "Auto clock-out: Last POS shift ended",
              });

              // Complete the TimeShift
              await db.timeTracking.completeShift(
                timeShiftId,
                clockOutEvent.id
              );

              console.log(
                `Auto clocked out TimeShift ${timeShiftId} after last POS shift ended`
              );
            } catch (error) {
              // Log error but don't fail shift end
              console.error(
                "Failed to auto clock-out TimeShift after shift end:",
                error
              );
            }
          }
        }
      }
    }

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
    const overdueShifts = db.shifts.autoEndOverdueShiftsToday();
    if (overdueShifts.length > 0) {
      // auto-ended overdue shifts from today
    }

    // Then clean up old unclosed shifts (24+ hours old)
    const closedShifts = db.shifts.autoCloseOldActiveShifts();
    if (closedShifts.length > 0) {
      // auto-closed old active shifts
    }

    // Use the new method that checks for today's active shift only
    const shift = db.shifts.getTodaysActiveShift(cashierId);

    // Convert to plain object to ensure serialization works
    const serializedShift = shift ? JSON.parse(JSON.stringify(shift)) : null;

    return {
      success: true,
      data: serializedShift,
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

    const now = new Date();
    const dateString = now.toISOString().split("T")[0];

    // Get schedules for this cashier today
    const schedules = db.schedules.getSchedulesByStaffId(cashierId);
    const todaySchedules = schedules.filter(
      (schedule) => schedule.startTime.split("T")[0] === dateString
    );

    if (todaySchedules.length === 0) {
      return {
        success: true,
        data: null,
      };
    }

    if (todaySchedules.length === 1) {
      return {
        success: true,
        data: todaySchedules[0],
      };
    }

    // Multiple schedules today - find the most relevant one
    // Priority:
    // 1. Schedules that haven't ended yet (current or future)
    // 2. Among those, prefer the one that starts later (most recent)
    // 3. If all have ended, prefer the one that starts later (most recent)
    const activeSchedules = todaySchedules.filter(
      (schedule) => new Date(schedule.endTime) > now
    );

    if (activeSchedules.length > 0) {
      // Return the one with the latest start time among active schedules
      const mostRecentActive = activeSchedules.reduce((latest, current) => {
        return new Date(current.startTime) > new Date(latest.startTime)
          ? current
          : latest;
      });
      return {
        success: true,
        data: mostRecentActive,
      };
    }

    // All schedules have ended - return the most recent one
    const mostRecent = todaySchedules.reduce((latest, current) => {
      return new Date(current.startTime) > new Date(latest.startTime)
        ? current
        : latest;
    });

    return {
      success: true,
      data: mostRecent,
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

    const transactions = await db.transactions.getTransactionsByShift(shiftId);

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

    const hourlyStats = db.shifts.getHourlyTransactionStats(shiftId);

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

    const cashBalance = db.cashDrawers.getCurrentCashDrawerBalance(shiftId);

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
    const transaction = await db.transactions.createTransaction(
      transactionData
    );

    // Convert to plain object to ensure serialization works
    const serializedTransaction = JSON.parse(JSON.stringify(transaction));

    return {
      success: true,
      transaction: serializedTransaction,
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
    const transactions = await db.transactions.getTransactionsByShift(shiftId);

    // Convert to plain objects to ensure serialization works
    const serializedTransactions = JSON.parse(JSON.stringify(transactions));

    return {
      success: true,
      data: serializedTransactions,
    };
  } catch (error) {
    console.error("Get transactions by shift IPC error:", error);
    return {
      success: false,
      message: "Failed to get transactions",
    };
  }
});

ipcMain.handle("transactions:createFromCart", async (event, data) => {
  try {
    console.log("Creating transaction from cart:", {
      cartSessionId: data.cartSessionId,
      shiftId: data.shiftId,
      businessId: data.businessId,
      paymentMethod: data.paymentMethod,
    });

    const db = await getDatabase();

    // Get cart session
    const cartSession = await db.cart.getSessionById(data.cartSessionId);
    if (!cartSession) {
      console.error("Cart session not found:", data.cartSessionId);
      return {
        success: false,
        message: "Cart session not found",
      };
    }

    // Get all cart items
    const cartItems = await db.cart.getItemsBySession(data.cartSessionId);
    if (!cartItems || cartItems.length === 0) {
      console.error("Cart is empty:", data.cartSessionId);
      return {
        success: false,
        message: "Cart is empty",
      };
    }

    console.log(`Processing ${cartItems.length} cart items`);

    // Validate that all items have either productId or categoryId
    const invalidItems = cartItems.filter(
      (item) => !item.productId && !item.categoryId
    );
    if (invalidItems.length > 0) {
      console.error(
        `Found ${invalidItems.length} cart items without productId or categoryId`
      );
      return {
        success: false,
        message:
          "Some cart items are invalid. Each item must have either a product ID or category ID.",
      };
    }

    // Calculate totals from all cart items
    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = cartItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + tax;

    console.log("Calculated totals:", { subtotal, tax, total });

    // Create transaction items from cart items
    const transactionItems = cartItems.map((item) => {
      // Convert expiryDate to timestamp in milliseconds if it exists
      let expiryDateTimestamp: number | null = null;
      if (item.expiryDate) {
        try {
          if (item.expiryDate instanceof Date) {
            expiryDateTimestamp = item.expiryDate.getTime();
          } else if (typeof item.expiryDate === "string") {
            expiryDateTimestamp = new Date(item.expiryDate).getTime();
            if (isNaN(expiryDateTimestamp)) {
              console.warn(`Invalid expiryDate string: ${item.expiryDate}`);
              expiryDateTimestamp = null;
            }
          } else if (typeof item.expiryDate === "number") {
            // Already a timestamp
            expiryDateTimestamp = item.expiryDate;
          }
        } catch (e) {
          console.warn(`Error parsing expiryDate for item ${item.id}:`, e);
        }
      }

      return {
        productId: item.productId || null,
        categoryId: item.categoryId || null,
        productName: item.itemName || "Unknown Item",
        quantity: item.itemType === "UNIT" ? item.quantity || 1 : 1,
        weight: item.itemType === "WEIGHT" ? item.weight || null : null,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        taxAmount: item.taxAmount,
        unitOfMeasure: item.unitOfMeasure || null,
        batchId: item.batchId || null,
        batchNumber: item.batchNumber || null,
        expiryDate: expiryDateTimestamp,
        ageRestrictionLevel: item.ageRestrictionLevel || "NONE",
        ageVerified: item.ageVerified || false,
      } as any; // Type assertion needed because createTransactionWithItems expects partial TransactionItem
    });

    console.log(`Creating transaction with ${transactionItems.length} items`);

    // Create transaction using createTransactionWithItems
    const transaction = await db.transactions.createTransactionWithItems({
      shiftId: data.shiftId,
      businessId: data.businessId,
      type: "sale",
      subtotal,
      tax,
      total,
      paymentMethod: data.paymentMethod,
      cashAmount: data.cashAmount || null,
      cardAmount: data.cardAmount || null,
      status: "completed",
      receiptNumber: data.receiptNumber,
      timestamp: new Date().toISOString(),
      voidReason: null,
      customerId: null,
      originalTransactionId: null,
      refundReason: null,
      refundMethod: null,
      managerApprovalId: null,
      isPartialRefund: false,
      discountAmount: 0,
      appliedDiscounts: null,
      items: transactionItems,
    } as any);

    console.log("Transaction created successfully:", transaction.id);

    // Update inventory levels for sold products
    try {
      const cashierId = cartSession.cashierId;

      for (const item of transaction.items) {
        // Only update inventory for products (not category items)
        if (!item.productId) {
          continue;
        }

        // Get product to check if inventory tracking is enabled
        try {
          const product = await db.products.getProductById(item.productId);

          if (!product.trackInventory) {
            console.log(
              `Skipping inventory update for product ${item.productId} - tracking disabled`
            );
            continue;
          }

          // Calculate quantity to decrement
          let quantityToDecrement: number;
          if (item.itemType === "WEIGHT" && item.weight) {
            // For weight-based items, decrement by weight
            quantityToDecrement = item.weight;
          } else {
            // For unit-based items, decrement by quantity
            quantityToDecrement = item.quantity || 1;
          }

          // Check if sufficient stock available
          const currentStock = product.stockLevel ?? 0;
          if (currentStock < quantityToDecrement) {
            console.warn(
              `⚠️ Insufficient stock for product ${item.productId}. Current: ${currentStock}, Required: ${quantityToDecrement}`
            );
            // Still decrement (allow negative stock) but log warning
            // In production, you might want to prevent the transaction or handle differently
          }

          // Create stock adjustment to record the sale
          try {
            db.inventory.createStockAdjustment({
              productId: item.productId,
              type: "sale",
              quantity: quantityToDecrement,
              reason: `Sale - Transaction ${transaction.id}`,
              note: null,
              userId: cashierId,
              businessId: data.businessId,
            });
            console.log(
              `✅ Updated inventory for product ${item.productId}: -${quantityToDecrement}`
            );
          } catch (inventoryError) {
            console.error(
              `Failed to update inventory for product ${item.productId}:`,
              inventoryError
            );
            // Don't fail the transaction if inventory update fails
            // Log error but continue
          }
        } catch (productError) {
          console.error(
            `Failed to get product ${item.productId} for inventory update:`,
            productError
          );
          // Continue with next item
        }
      }
    } catch (inventoryError) {
      console.error(
        "Error updating inventory after transaction:",
        inventoryError
      );
      // Don't fail the transaction if inventory update fails
      // Transaction is already saved, inventory can be corrected manually
    }

    // Convert to plain object to ensure serialization works
    const serializedTransaction = JSON.parse(JSON.stringify(transaction));

    return {
      success: true,
      data: serializedTransaction,
    };
  } catch (error) {
    console.error("Create transaction from cart IPC error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Failed to create transaction from cart";
    return {
      success: false,
      message: errorMessage,
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
      const updatedShift = db.shifts.reconcileShift(
        shiftId,
        reconciliationData
      );

      // Convert to plain object to ensure serialization works
      const serializedShift = JSON.parse(JSON.stringify(updatedShift));

      return {
        success: true,
        shift: serializedShift,
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
    const pendingShifts = db.shifts.getPendingReconciliationShifts(businessId);

    // Convert to plain objects to ensure serialization works
    const serializedShifts = JSON.parse(JSON.stringify(pendingShifts));

    return {
      success: true,
      shifts: serializedShifts,
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
    const transaction = await db.transactions.getTransactionById(transactionId);

    // Convert to plain object to ensure serialization works
    const serializedTransaction = transaction
      ? JSON.parse(JSON.stringify(transaction))
      : null;

    return {
      success: !!serializedTransaction,
      transaction: serializedTransaction,
      message: serializedTransaction ? undefined : "Transaction not found",
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
      const transaction = await db.transactions.getTransactionByReceiptNumber(
        receiptNumber
      );

      // Convert to plain object to ensure serialization works
      const serializedTransaction = transaction
        ? JSON.parse(JSON.stringify(transaction))
        : null;

      return {
        success: !!serializedTransaction,
        transaction: serializedTransaction,
        message: serializedTransaction ? undefined : "Transaction not found",
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
      const transactions = await db.transactions.getRecentTransactions(
        businessId,
        limit
      );

      // Convert to plain objects to ensure serialization works
      const serializedTransactions = JSON.parse(JSON.stringify(transactions));

      return {
        success: true,
        transactions: serializedTransactions,
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
      const transactions = await db.transactions.getShiftTransactions(
        shiftId,
        limit
      );

      // Convert to plain objects to ensure serialization works
      const serializedTransactions = JSON.parse(JSON.stringify(transactions));

      return {
        success: true,
        transactions: serializedTransactions,
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
      const validation = db.transactions.validateRefundEligibility(
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

    const validation = await db.transactions.validateRefundEligibility(
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

    const refundTransaction = await db.transactions.createRefundTransaction(
      refundData
    );

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
    const validation = db.transactions.validateVoidEligibility(transactionId);

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
    const validation = db.transactions.validateVoidEligibility(
      voidData.transactionId
    );

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

    const result = db.transactions.voidTransaction(voidData);

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
    const transaction =
      db.transactions.getTransactionByIdAnyStatus(transactionId);

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
        db.transactions.getTransactionByReceiptNumberAnyStatus(receiptNumber);

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
    const result = db.cashDrawers.getExpectedCashForShift(shiftId);

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
    const shift = db.shifts.getShiftById(countData.shiftId);

    if (!shift) {
      throw new Error("Shift not found");
    }

    // Create the cash drawer count
    const cashDrawerCount = db.cashDrawers.createCashDrawerCount({
      shiftId: countData.shiftId,
      businessId: shift.businessId,
      countType: countData.countType,
      expectedAmount: countData.expectedAmount,
      countedAmount: countData.countedAmount,
      variance: countData.variance,
      notes: countData.notes,
      countedBy: countData.countedBy,
      timestamp: new Date().toISOString(),
      updatedAt: null,
    });

    // Create audit log entry for the count
    if (Math.abs(countData.variance) > 0) {
      db.auditLogs.createAuditLog({
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
    const counts = db.cashDrawers.getCashDrawerCountsByShift(shiftId);

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
    const { closeDatabase } = await import("./database/index.js");
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
      const { getDatabase: getNewDatabase } = await import(
        "./database/index.js"
      );
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
    const { closeDatabase } = await import("./database/index.js");
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

// Time Tracking IPC Handlers
ipcMain.handle("timeTracking:clockIn", async (event, data) => {
  try {
    if (!db) db = await getDatabase();
    const clockEvent = await db.timeTracking.createClockEvent({
      ...data,
      type: "in",
    });

    // Check if shift should be created
    const activeShift = db.timeTracking.getActiveShift(data.userId);
    if (!activeShift && data.businessId) {
      const shift = await db.timeTracking.createShift({
        userId: data.userId,
        businessId: data.businessId,
        clockInId: clockEvent.id,
      });
      return {
        success: true,
        clockEvent,
        shift,
      };
    }

    return {
      success: true,
      clockEvent,
      shift: activeShift,
    };
  } catch (error) {
    console.error("Clock-in IPC error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to clock in",
    };
  }
});

ipcMain.handle("timeTracking:clockOut", async (event, data) => {
  try {
    if (!db) db = await getDatabase();
    const activeShift = db.timeTracking.getActiveShift(data.userId);

    if (!activeShift) {
      return {
        success: false,
        message: "No active shift found",
      };
    }

    // End any active breaks
    const activeBreak = db.timeTracking.getActiveBreak(activeShift.id);
    if (activeBreak) {
      await db.timeTracking.endBreak(activeBreak.id);
    }

    // Create clock-out event
    const clockEvent = await db.timeTracking.createClockEvent({
      ...data,
      type: "out",
    });

    // Complete shift
    const completedShift = await db.timeTracking.completeShift(
      activeShift.id,
      clockEvent.id
    );

    return {
      success: true,
      clockEvent,
      shift: completedShift,
    };
  } catch (error) {
    console.error("Clock-out IPC error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to clock out",
    };
  }
});

ipcMain.handle("timeTracking:getActiveShift", async (event, userId) => {
  try {
    if (!db) db = await getDatabase();
    const shift = db.timeTracking.getActiveShift(userId);

    if (!shift) {
      return {
        success: false,
        message: "No active shift found",
      };
    }

    const breaks = db.timeTracking.getBreaksByShift(shift.id);

    // Get clock-in event for timestamp
    let clockInEvent = null;
    if (shift.clockInId) {
      clockInEvent = db.timeTracking.getClockEventById(shift.clockInId);
    }

    return {
      success: true,
      shift: {
        ...shift,
        clockInEvent, // Include clock-in event info
      },
      breaks,
    };
  } catch (error) {
    console.error("Get active shift IPC error:", error);
    return {
      success: false,
      message: "Failed to get active shift",
    };
  }
});

ipcMain.handle("timeTracking:startBreak", async (event, data) => {
  try {
    if (!db) db = await getDatabase();
    const breakRecord = await db.timeTracking.startBreak(data);
    return {
      success: true,
      break: breakRecord,
    };
  } catch (error) {
    console.error("Start break IPC error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to start break",
    };
  }
});

ipcMain.handle("timeTracking:endBreak", async (event, breakId) => {
  try {
    if (!db) db = await getDatabase();
    const breakRecord = await db.timeTracking.endBreak(breakId);
    return {
      success: true,
      break: breakRecord,
    };
  } catch (error) {
    console.error("End break IPC error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to end break",
    };
  }
});

// Age Verification IPC handlers
ipcMain.handle("ageVerification:create", async (event, verificationData) => {
  try {
    if (!db) db = await getDatabase();
    const record = await db.ageVerification.createAgeVerification(
      verificationData
    );

    return {
      success: true,
      record: JSON.parse(JSON.stringify(record)),
    };
  } catch (error) {
    console.error("Create age verification IPC error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create age verification record",
    };
  }
});

ipcMain.handle(
  "ageVerification:getByTransaction",
  async (event, transactionId) => {
    try {
      if (!db) db = await getDatabase();
      const records = await db.ageVerification.getAgeVerificationsByTransaction(
        transactionId
      );

      return {
        success: true,
        records: JSON.parse(JSON.stringify(records)),
      };
    } catch (error) {
      console.error("Get age verifications by transaction IPC error:", error);
      return {
        success: false,
        message: "Failed to get age verification records",
      };
    }
  }
);

ipcMain.handle(
  "ageVerification:getByTransactionItem",
  async (event, transactionItemId) => {
    try {
      if (!db) db = await getDatabase();
      const records =
        await db.ageVerification.getAgeVerificationsByTransactionItem(
          transactionItemId
        );

      return {
        success: true,
        records: JSON.parse(JSON.stringify(records)),
      };
    } catch (error) {
      console.error(
        "Get age verifications by transaction item IPC error:",
        error
      );
      return {
        success: false,
        message: "Failed to get age verification records",
      };
    }
  }
);

ipcMain.handle(
  "ageVerification:getByBusiness",
  async (event, businessId, options) => {
    try {
      if (!db) db = await getDatabase();
      const records = await db.ageVerification.getAgeVerificationsByBusiness(
        businessId,
        options
      );

      return {
        success: true,
        records: JSON.parse(JSON.stringify(records)),
      };
    } catch (error) {
      console.error("Get age verifications by business IPC error:", error);
      return {
        success: false,
        message: "Failed to get age verification records",
      };
    }
  }
);

ipcMain.handle("ageVerification:getByProduct", async (event, productId) => {
  try {
    if (!db) db = await getDatabase();
    const records = await db.ageVerification.getAgeVerificationsByProduct(
      productId
    );

    return {
      success: true,
      records: JSON.parse(JSON.stringify(records)),
    };
  } catch (error) {
    console.error("Get age verifications by product IPC error:", error);
    return {
      success: false,
      message: "Failed to get age verification records",
    };
  }
});

ipcMain.handle(
  "ageVerification:getByStaff",
  async (event, staffId, options) => {
    try {
      if (!db) db = await getDatabase();
      const records = await db.ageVerification.getAgeVerificationsByStaff(
        staffId,
        options
      );

      return {
        success: true,
        records: JSON.parse(JSON.stringify(records)),
      };
    } catch (error) {
      console.error("Get age verifications by staff IPC error:", error);
      return {
        success: false,
        message: "Failed to get age verification records",
      };
    }
  }
);

// ============================================================================
// BATCH MANAGEMENT IPC HANDLERS
// ============================================================================

ipcMain.handle("batches:create", async (event, batchData) => {
  try {
    if (!db) db = await getDatabase();
    const batch = await db.batches.createBatch(batchData);

    return {
      success: true,
      batch: JSON.parse(JSON.stringify(batch)),
    };
  } catch (error) {
    console.error("Create batch IPC error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create batch",
    };
  }
});

ipcMain.handle("batches:getById", async (event, batchId) => {
  try {
    if (!db) db = await getDatabase();
    const batch = await db.batches.getBatchById(batchId);

    return {
      success: true,
      batch: JSON.parse(JSON.stringify(batch)),
    };
  } catch (error) {
    console.error("Get batch IPC error:", error);
    return {
      success: false,
      message: "Failed to get batch",
    };
  }
});

ipcMain.handle("batches:getByProduct", async (event, productId, options) => {
  try {
    if (!db) db = await getDatabase();
    const batches = await db.batches.getBatchesByProduct(productId, options);

    return {
      success: true,
      batches: JSON.parse(JSON.stringify(batches)),
    };
  } catch (error) {
    console.error("Get batches by product IPC error:", error);
    return {
      success: false,
      message: "Failed to get batches",
    };
  }
});

ipcMain.handle("batches:getByBusiness", async (event, businessId, options) => {
  try {
    if (!db) db = await getDatabase();
    const batches = await db.batches.getBatchesByBusiness(businessId, options);

    return {
      success: true,
      batches: JSON.parse(JSON.stringify(batches)),
    };
  } catch (error) {
    console.error("Get batches by business IPC error:", error);
    return {
      success: false,
      message: "Failed to get batches",
    };
  }
});

ipcMain.handle(
  "batches:getActiveBatches",
  async (event, productId, rotationMethod) => {
    try {
      if (!db) db = await getDatabase();
      const batches = await db.batches.getActiveBatchesByProduct(
        productId,
        rotationMethod || "FEFO"
      );

      return {
        success: true,
        batches: JSON.parse(JSON.stringify(batches)),
      };
    } catch (error) {
      console.error("Get active batches IPC error:", error);
      return {
        success: false,
        message: "Failed to get active batches",
      };
    }
  }
);

ipcMain.handle(
  "batches:selectForSale",
  async (event, productId, quantity, rotationMethod) => {
    try {
      if (!db) db = await getDatabase();
      const selected = await db.batches.selectBatchesForSale(
        productId,
        quantity,
        rotationMethod || "FEFO"
      );

      return {
        success: true,
        batches: JSON.parse(JSON.stringify(selected)),
      };
    } catch (error) {
      console.error("Select batches for sale IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to select batches",
      };
    }
  }
);

ipcMain.handle(
  "batches:updateQuantity",
  async (event, batchId, quantity, movementType) => {
    try {
      if (!db) db = await getDatabase();
      const batch = await db.batches.updateBatchQuantity(
        batchId,
        quantity,
        movementType
      );

      return {
        success: true,
        batch: JSON.parse(JSON.stringify(batch)),
      };
    } catch (error) {
      console.error("Update batch quantity IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update batch quantity",
      };
    }
  }
);

ipcMain.handle("batches:updateStatus", async (event, batchId, status) => {
  try {
    if (!db) db = await getDatabase();
    const batch = await db.batches.updateBatchStatus(batchId, status);

    return {
      success: true,
      batch: JSON.parse(JSON.stringify(batch)),
    };
  } catch (error) {
    console.error("Update batch status IPC error:", error);
    return {
      success: false,
      message: "Failed to update batch status",
    };
  }
});

ipcMain.handle("batches:getExpiringSoon", async (event, businessId, days) => {
  try {
    if (!db) db = await getDatabase();
    const batches = await db.batches.getBatchesExpiringSoon(businessId, days);

    return {
      success: true,
      batches: JSON.parse(JSON.stringify(batches)),
    };
  } catch (error) {
    console.error("Get expiring batches IPC error:", error);
    return {
      success: false,
      message: "Failed to get expiring batches",
    };
  }
});

ipcMain.handle("batches:calculateProductStock", async (event, productId) => {
  try {
    if (!db) db = await getDatabase();
    const stock = await db.batches.calculateProductStock(productId);

    return {
      success: true,
      stock,
    };
  } catch (error) {
    console.error("Calculate product stock IPC error:", error);
    return {
      success: false,
      message: "Failed to calculate product stock",
    };
  }
});

ipcMain.handle("batches:autoUpdateExpired", async (event, businessId) => {
  try {
    if (!db) db = await getDatabase();
    const count = await db.batches.autoUpdateExpiredBatches(businessId);

    return {
      success: true,
      updatedCount: count,
    };
  } catch (error) {
    console.error("Auto-update expired batches IPC error:", error);
    return {
      success: false,
      message: "Failed to auto-update expired batches",
    };
  }
});

ipcMain.handle("batches:remove", async (event, batchId) => {
  try {
    if (!db) db = await getDatabase();
    await db.batches.removeBatch(batchId);

    return {
      success: true,
      message: "Batch removed successfully",
    };
  } catch (error) {
    console.error("Remove batch IPC error:", error);
    return {
      success: false,
      message: "Failed to remove batch",
    };
  }
});

ipcMain.handle(
  "batches:getByNumber",
  async (event, batchNumber, productId, businessId) => {
    try {
      if (!db) db = await getDatabase();
      const batch = await db.batches.getBatchByNumber(
        batchNumber,
        productId,
        businessId
      );

      if (!batch) {
        return {
          success: false,
          message: "Batch not found",
        };
      }

      return {
        success: true,
        batch: JSON.parse(JSON.stringify(batch)),
      };
    } catch (error) {
      console.error("Get batch by number IPC error:", error);
      return {
        success: false,
        message: "Failed to get batch",
      };
    }
  }
);

// ============================================================================
// SUPPLIER MANAGEMENT IPC HANDLERS
// ============================================================================

ipcMain.handle("suppliers:create", async (event, supplierData) => {
  try {
    if (!db) db = await getDatabase();
    const supplier = await db.suppliers.createSupplier(supplierData);

    return {
      success: true,
      supplier: JSON.parse(JSON.stringify(supplier)),
    };
  } catch (error) {
    console.error("Create supplier IPC error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create supplier",
    };
  }
});

ipcMain.handle("suppliers:getById", async (event, supplierId) => {
  try {
    if (!db) db = await getDatabase();
    const supplier = await db.suppliers.getSupplierById(supplierId);

    return {
      success: true,
      supplier: JSON.parse(JSON.stringify(supplier)),
    };
  } catch (error) {
    console.error("Get supplier IPC error:", error);
    return {
      success: false,
      message: "Failed to get supplier",
    };
  }
});

ipcMain.handle(
  "suppliers:getByBusiness",
  async (event, businessId, includeInactive) => {
    try {
      if (!db) db = await getDatabase();
      const suppliers = await db.suppliers.getSuppliersByBusiness(
        businessId,
        includeInactive
      );

      return {
        success: true,
        suppliers: JSON.parse(JSON.stringify(suppliers)),
      };
    } catch (error) {
      console.error("Get suppliers by business IPC error:", error);
      return {
        success: false,
        message: "Failed to get suppliers",
      };
    }
  }
);

ipcMain.handle("suppliers:update", async (event, supplierId, updates) => {
  try {
    if (!db) db = await getDatabase();
    const supplier = await db.suppliers.updateSupplier(supplierId, updates);

    return {
      success: true,
      supplier: JSON.parse(JSON.stringify(supplier)),
    };
  } catch (error) {
    console.error("Update supplier IPC error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update supplier",
    };
  }
});

ipcMain.handle("suppliers:delete", async (event, supplierId) => {
  try {
    if (!db) db = await getDatabase();
    const deleted = await db.suppliers.deleteSupplier(supplierId);

    return {
      success: deleted,
      message: deleted ? "Supplier deleted successfully" : "Supplier not found",
    };
  } catch (error) {
    console.error("Delete supplier IPC error:", error);
    return {
      success: false,
      message: "Failed to delete supplier",
    };
  }
});

// ============================================================================
// EXPIRY SETTINGS IPC HANDLERS
// ============================================================================

ipcMain.handle("expirySettings:get", async (event, businessId) => {
  try {
    if (!db) db = await getDatabase();
    const settings = await db.expirySettings.getOrCreateSettings(businessId);

    return {
      success: true,
      settings: JSON.parse(JSON.stringify(settings)),
    };
  } catch (error) {
    console.error("Get expiry settings IPC error:", error);
    return {
      success: false,
      message: "Failed to get expiry settings",
    };
  }
});

ipcMain.handle(
  "expirySettings:createOrUpdate",
  async (event, businessId, settingsData) => {
    try {
      if (!db) db = await getDatabase();
      const settings = await db.expirySettings.createOrUpdateSettings(
        businessId,
        settingsData
      );

      return {
        success: true,
        settings: JSON.parse(JSON.stringify(settings)),
      };
    } catch (error) {
      console.error("Create/update expiry settings IPC error:", error);
      return {
        success: false,
        message: "Failed to create/update expiry settings",
      };
    }
  }
);

// ============================================================================
// EXPIRY NOTIFICATION IPC HANDLERS
// ============================================================================

ipcMain.handle(
  "expiryNotifications:create",
  async (event, notificationData) => {
    try {
      if (!db) db = await getDatabase();
      const notification = await db.expiryNotifications.createNotification(
        notificationData
      );

      return {
        success: true,
        notification: JSON.parse(JSON.stringify(notification)),
      };
    } catch (error) {
      console.error("Create expiry notification IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create expiry notification",
      };
    }
  }
);

ipcMain.handle("expiryNotifications:getByBatch", async (event, batchId) => {
  try {
    if (!db) db = await getDatabase();
    const notifications = await db.expiryNotifications.getNotificationsByBatch(
      batchId
    );

    return {
      success: true,
      notifications: JSON.parse(JSON.stringify(notifications)),
    };
  } catch (error) {
    console.error("Get notifications by batch IPC error:", error);
    return {
      success: false,
      message: "Failed to get notifications",
    };
  }
});

ipcMain.handle(
  "expiryNotifications:getByBusiness",
  async (event, businessId, filters) => {
    try {
      if (!db) db = await getDatabase();
      const notifications =
        await db.expiryNotifications.getNotificationsByBusiness(
          businessId,
          filters
        );

      return {
        success: true,
        notifications: JSON.parse(JSON.stringify(notifications)),
      };
    } catch (error) {
      console.error("Get notifications by business IPC error:", error);
      return {
        success: false,
        message: "Failed to get notifications",
      };
    }
  }
);

ipcMain.handle("expiryNotifications:getPending", async (event, businessId) => {
  try {
    if (!db) db = await getDatabase();
    const notifications = await db.expiryNotifications.getPendingNotifications(
      businessId
    );

    return {
      success: true,
      notifications: JSON.parse(JSON.stringify(notifications)),
    };
  } catch (error) {
    console.error("Get pending notifications IPC error:", error);
    return {
      success: false,
      message: "Failed to get pending notifications",
    };
  }
});

ipcMain.handle(
  "expiryNotifications:acknowledge",
  async (event, notificationId, userId) => {
    try {
      if (!db) db = await getDatabase();
      const notification = await db.expiryNotifications.acknowledgeNotification(
        notificationId,
        userId
      );

      return {
        success: true,
        notification: JSON.parse(JSON.stringify(notification)),
      };
    } catch (error) {
      console.error("Acknowledge notification IPC error:", error);
      return {
        success: false,
        message: "Failed to acknowledge notification",
      };
    }
  }
);

// ============================================================================
// STOCK MOVEMENT IPC HANDLERS
// ============================================================================

ipcMain.handle("stockMovements:create", async (event, movementData) => {
  try {
    if (!db) db = await getDatabase();
    const movement = await db.stockMovements.createStockMovement(movementData);

    return {
      success: true,
      movement: JSON.parse(JSON.stringify(movement)),
    };
  } catch (error) {
    console.error("Create stock movement IPC error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create stock movement",
    };
  }
});

ipcMain.handle("stockMovements:getByProduct", async (event, productId) => {
  try {
    if (!db) db = await getDatabase();
    const movements = await db.stockMovements.getMovementsByProduct(productId);

    return {
      success: true,
      movements: JSON.parse(JSON.stringify(movements)),
    };
  } catch (error) {
    console.error("Get movements by product IPC error:", error);
    return {
      success: false,
      message: "Failed to get stock movements",
    };
  }
});

ipcMain.handle("stockMovements:getByBatch", async (event, batchId) => {
  try {
    if (!db) db = await getDatabase();
    const movements = await db.stockMovements.getMovementsByBatch(batchId);

    return {
      success: true,
      movements: JSON.parse(JSON.stringify(movements)),
    };
  } catch (error) {
    console.error("Get movements by batch IPC error:", error);
    return {
      success: false,
      message: "Failed to get stock movements",
    };
  }
});

ipcMain.handle(
  "stockMovements:getByBusiness",
  async (event, businessId, filters) => {
    try {
      if (!db) db = await getDatabase();
      const movements = await db.stockMovements.getMovementsByBusiness(
        businessId,
        filters
      );

      return {
        success: true,
        movements: JSON.parse(JSON.stringify(movements)),
      };
    } catch (error) {
      console.error("Get movements by business IPC error:", error);
      return {
        success: false,
        message: "Failed to get stock movements",
      };
    }
  }
);

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
    console.error("Create cart session IPC error:", error);
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
    console.error("Get cart session IPC error:", error);
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
    console.error("Get active cart session IPC error:", error);
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
    console.error("Update cart session IPC error:", error);
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
    console.error("Complete cart session IPC error:", error);
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
    console.error("Cancel cart session IPC error:", error);
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
    console.error("Add cart item IPC error:", error);
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
    console.error("Get cart items IPC error:", error);
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
    console.error("Update cart item IPC error:", error);
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
    console.error("Remove cart item IPC error:", error);
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
    console.error("Clear cart IPC error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to clear cart",
    };
  }
});

// ============================================================================
// EXPIRY NOTIFICATION SERVICE IPC HANDLERS
// ============================================================================

ipcMain.handle(
  "expiryNotifications:scanAndCreate",
  async (event, businessId) => {
    try {
      if (!db) db = await getDatabase();
      const service = new ExpiryNotificationService(db);
      const count = await service.scanAndCreateNotifications(businessId);

      return {
        success: true,
        notificationsCreated: count,
      };
    } catch (error) {
      console.error("Scan and create notifications IPC error:", error);
      return {
        success: false,
        message: "Failed to scan and create notifications",
      };
    }
  }
);

ipcMain.handle(
  "expiryNotifications:processTasks",
  async (event, businessId) => {
    try {
      if (!db) db = await getDatabase();
      const service = new ExpiryNotificationService(db);
      const result = await service.processExpiryTasks(businessId);

      return {
        success: true,
        notificationsSent: result.notificationsSent,
        batchesAutoDisabled: result.expiredBatchesUpdated,
      };
    } catch (error) {
      console.error("Process expiry tasks IPC error:", error);
      return {
        success: false,
        message: "Failed to process expiry tasks",
      };
    }
  }
);

// Cleanup expired sessions every hour
setInterval(async () => {
  try {
    if (!db) db = await getDatabase();
    db.sessions.cleanupExpiredSessions();
  } catch (error) {
    console.error("Failed to cleanup expired sessions:", error);
  }
}, 60 * 60 * 1000);
