import { ipcMain } from "electron";
import { getDatabase } from "../database/index.js";
import { getLogger } from "../utils/logger.js";
import { scheduleValidator } from "../utils/scheduleValidator.js";
import { shiftRequirementResolver } from "../utils/shiftRequirementResolver.js";

const logger = getLogger("shiftHandlers");
// let db: any = null; // Removed: Always get fresh DB reference

export function registerShiftHandlers() {
  // Schedule Management API handlers
  ipcMain.handle("schedules:create", async (event, scheduleData) => {
    try {
      const db = await getDatabase();

      // Convert ISO string timestamps to Date objects
      // Drizzle expects Date objects for timestamp_ms columns (it will convert to milliseconds)
      const processedData = {
        ...scheduleData,
        startTime:
          scheduleData.startTime instanceof Date
            ? scheduleData.startTime
            : new Date(scheduleData.startTime as string),
        endTime: scheduleData.endTime
          ? scheduleData.endTime instanceof Date
            ? scheduleData.endTime
            : new Date(scheduleData.endTime as string)
          : null,
        status: "upcoming" as const,
      };

      const schedule = db.schedules.createSchedule(processedData);

      // Convert to plain object to ensure serialization works
      const serializedSchedule = JSON.parse(JSON.stringify(schedule));

      return {
        success: true,
        data: serializedSchedule,
      };
    } catch (error) {
      logger.error("Create schedule IPC error:", error);
      return {
        success: false,
        message: "Failed to create schedule",
      };
    }
  });

  ipcMain.handle("schedules:getByBusiness", async (event, businessId) => {
    try {
      const db = await getDatabase();
      const schedules = db.schedules.getSchedulesByBusiness(businessId);

      // Convert to plain objects to ensure serialization works
      const serializedSchedules = JSON.parse(JSON.stringify(schedules));

      return {
        success: true,
        data: serializedSchedules,
      };
    } catch (error) {
      logger.error("Get schedules IPC error:", error);
      return {
        success: false,
        message: "Failed to get schedules",
      };
    }
  });

  ipcMain.handle("schedules:getByStaff", async (event, staffId) => {
    try {
      const db = await getDatabase();
      const schedules = db.schedules.getSchedulesByStaffId(staffId);

      // Convert to plain objects to ensure serialization works
      const serializedSchedules = JSON.parse(JSON.stringify(schedules));

      return {
        success: true,
        data: serializedSchedules,
      };
    } catch (error) {
      logger.error("Get staff schedules IPC error:", error);
      return {
        success: false,
        message: "Failed to get staff schedules",
      };
    }
  });

  ipcMain.handle("schedules:update", async (event, id, updates) => {
    try {
      const db = await getDatabase();

      // Convert ISO string timestamps to Date objects if present
      // Drizzle expects Date objects for timestamp_ms columns
      const processedUpdates = { ...updates };
      if (processedUpdates.startTime) {
        processedUpdates.startTime =
          processedUpdates.startTime instanceof Date
            ? processedUpdates.startTime
            : new Date(processedUpdates.startTime as string);
      }
      if (processedUpdates.endTime) {
        processedUpdates.endTime =
          processedUpdates.endTime instanceof Date
            ? processedUpdates.endTime
            : new Date(processedUpdates.endTime as string);
      }

      const updatedSchedule = db.schedules.updateSchedule(id, processedUpdates);

      // Convert to plain object to ensure serialization works
      const serializedSchedule = JSON.parse(JSON.stringify(updatedSchedule));

      return {
        success: true,
        message: "Schedule updated successfully",
        data: serializedSchedule,
      };
    } catch (error) {
      logger.error("Update schedule IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update schedule",
      };
    }
  });

  ipcMain.handle("schedules:delete", async (event, id) => {
    try {
      const db = await getDatabase();

      db.schedules.deleteSchedule(id);

      return {
        success: true,
        message: "Schedule deleted successfully",
      };
    } catch (error) {
      logger.error("Delete schedule IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete schedule",
      };
    }
  });

  ipcMain.handle("schedules:updateStatus", async (event, id, status) => {
    try {
      const db = await getDatabase();
      db.schedules.updateScheduleStatus(id, status);
      return {
        success: true,
        message: "Schedule status updated successfully",
      };
    } catch (error) {
      logger.error("Update schedule status IPC error:", error);
      return {
        success: false,
        message: "Failed to update schedule status",
      };
    }
  });

  ipcMain.handle("schedules:getCashierUsers", async (event, businessId) => {
    try {
      const db = await getDatabase();
      const users = db.users.getUsersByBusiness(businessId);

      // Return all active users - let the frontend filter by role using RBAC
      // This ensures we get users even if they don't have shiftRequired set
      // The frontend will filter to show only cashiers using getUserRoleName()

      // Convert to plain objects to ensure serialization works
      const serializedUsers = JSON.parse(JSON.stringify(users));

      logger.info(
        `[getCashierUsers] Found ${serializedUsers.length} users for business ${businessId}`
      );

      return {
        success: true,
        data: serializedUsers,
      };
    } catch (error) {
      logger.error("Get cashier users IPC error:", error);
      return {
        success: false,
        message: "Failed to get cashier users",
      };
    }
  });

  // Shift management IPC handlers
  ipcMain.handle("shift:start", async (event, shiftData) => {
    try {
      const db = await getDatabase();

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
          if (
            closedShift.timeShiftId &&
            closedShift.timeShiftId.trim() !== ""
          ) {
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
        for (const [
          timeShiftId,
          closedPosShifts,
        ] of timeShiftGroups.entries()) {
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
                logger.error(
                  `Cannot clock out TimeShift ${timeShiftId}: closed shifts have no cashierId`
                );
              } else {
                try {
                  if (!db) continue;
                  // End any active breaks
                  const activeBreak =
                    db.timeTracking.getActiveBreak(timeShiftId);
                  if (activeBreak) {
                    await db.timeTracking.endBreak(activeBreak.id);
                  }

                  // Create clock-out event
                  const clockOutEvent = await db.timeTracking.createClockEvent({
                    userId: cashierId,
                    businessId: timeShift.businessId, // ✅ REQUIRED: Get from shift
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

                  logger.info(
                    `Auto clocked out TimeShift ${timeShiftId} after all POS shifts were auto-closed`
                  );
                } catch (error) {
                  logger.error(
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
        const serializedExistingShift = JSON.parse(
          JSON.stringify(existingShift)
        );

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
      const activeTimeShift = db.timeTracking.getActiveShift(
        shiftData.cashierId
      );
      if (!activeTimeShift) {
        return {
          success: false,
          message: "Please clock in before starting a shift",
        };
      }

      // Validate schedule before starting shift (for cashier/manager)
      const user = db.users.getUserById(shiftData.cashierId);
      let validatedScheduleId = shiftData.scheduleId ?? null;
      let scheduleValidation = null;

      if (user) {
        const shiftRequirement = await shiftRequirementResolver.resolve(
          user,
          db
        );

        if (shiftRequirement.requiresShift) {
          // Validate schedule for cashier/manager
          scheduleValidation = await scheduleValidator.validateClockIn(
            shiftData.cashierId,
            shiftData.businessId,
            db
          );

          if (!scheduleValidation.canClockIn) {
            if (!scheduleValidation.requiresApproval) {
              // No schedule or critical issue
              return {
                success: false,
                message: scheduleValidation.reason || "Cannot start shift",
                code: "SCHEDULE_VALIDATION_FAILED",
                scheduleValidation: {
                  warnings: scheduleValidation.warnings,
                  requiresApproval: scheduleValidation.requiresApproval,
                },
              };
            } else {
              // Schedule validation failed but can proceed with approval
              logger.warn(
                `Schedule validation warnings for shift start: ${scheduleValidation.warnings.join(
                  ", "
                )}`
              );
              // Continue but return warnings
            }
          }

          // Use validated schedule if available
          if (scheduleValidation.schedule?.id) {
            validatedScheduleId = scheduleValidation.schedule.id;
          }
        }
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
          scheduleId: validatedScheduleId,
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
        logger.error("Failed to create shift:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create shift due to validation error",
        };
      }

      // Update schedule status if linked (non-critical, so we don't fail if this errors)
      if (validatedScheduleId) {
        try {
          db.schedules.updateScheduleStatus(validatedScheduleId, "active");
        } catch (error) {
          logger.warn("Could not update schedule status:", error);
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
      logger.error("Start shift IPC error:", error);
      return {
        success: false,
        message: "Failed to start shift",
      };
    }
  });

  ipcMain.handle("shift:end", async (event, shiftId, endData) => {
    try {
      const db = await getDatabase();

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
              logger.error(
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
                  businessId: timeShift.businessId, // ✅ REQUIRED: Get from shift
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

                logger.info(
                  `Auto clocked out TimeShift ${timeShiftId} after last POS shift ended`
                );
              } catch (error) {
                // Log error but don't fail shift end
                logger.error(
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
      logger.error("End shift IPC error:", error);
      return {
        success: false,
        message: "Failed to end shift",
      };
    }
  });

  ipcMain.handle("shift:getActive", async (event, cashierId) => {
    try {
      const db = await getDatabase();

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
      logger.error("Get active shift IPC error:", error);
      return {
        success: false,
        message: "Failed to get active shift",
      };
    }
  });

  // Schedule validation endpoint
  ipcMain.handle(
    "schedules:validateClockIn",
    async (event, userId, businessId) => {
      try {
        const db = await getDatabase();

        const validation = await scheduleValidator.validateClockIn(
          userId,
          businessId,
          db
        );

        return {
          success: true,
          data: {
            valid: validation.valid,
            canClockIn: validation.canClockIn,
            requiresApproval: validation.requiresApproval,
            warnings: validation.warnings,
            reason: validation.reason,
            schedule: validation.schedule
              ? JSON.parse(JSON.stringify(validation.schedule))
              : null,
          },
        };
      } catch (error) {
        logger.error("Schedule validation IPC error:", error);
        return {
          success: false,
          message: "Failed to validate schedule",
        };
      }
    }
  );

  ipcMain.handle("shift:getTodaySchedule", async (event, cashierId) => {
    try {
      const db = await getDatabase();

      const now = new Date();
      // Use local date string to match schedules created in local timezone
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      logger.info(
        `[shift:getTodaySchedule] Checking schedules for user ${cashierId} on date: ${dateString}`
      );

      // Get schedules for this cashier today
      const schedules = db.schedules.getSchedulesByStaffId(cashierId);

      logger.info(
        `[shift:getTodaySchedule] Found ${schedules.length} total schedules for user ${cashierId}`
      );

      // Filter for today's schedules
      // Note: schedule.startTime is a number (milliseconds) from timestamp_ms column
      const todaySchedules = schedules.filter((schedule: any) => {
        // Convert timestamp (milliseconds) to Date object
        const startTimeMs =
          typeof schedule.startTime === "number"
            ? schedule.startTime
            : schedule.startTime instanceof Date
            ? schedule.startTime.getTime()
            : new Date(schedule.startTime as string).getTime();

        const scheduleDate = new Date(startTimeMs);
        const scheduleDateString = scheduleDate.toISOString().split("T")[0];
        return scheduleDateString === dateString;
      });

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
      const activeSchedules = todaySchedules.filter((schedule: any) => {
        const endTimeMs = schedule.endTime
          ? typeof schedule.endTime === "number"
            ? schedule.endTime
            : schedule.endTime instanceof Date
            ? schedule.endTime.getTime()
            : new Date(schedule.endTime as string).getTime()
          : typeof schedule.startTime === "number"
          ? schedule.startTime
          : schedule.startTime instanceof Date
          ? schedule.startTime.getTime()
          : new Date(schedule.startTime as string).getTime();
        return new Date(endTimeMs) > now;
      });

      if (activeSchedules.length > 0) {
        // Return the one with the latest start time among active schedules
        const mostRecentActive = activeSchedules.reduce((latest: any, current: any) => {
          const latestStart =
            typeof latest.startTime === "number"
              ? latest.startTime
              : latest.startTime instanceof Date
              ? latest.startTime.getTime()
              : new Date(latest.startTime as string).getTime();
          const currentStart =
            typeof current.startTime === "number"
              ? current.startTime
              : current.startTime instanceof Date
              ? current.startTime.getTime()
              : new Date(current.startTime as string).getTime();
          return currentStart > latestStart ? current : latest;
        });
        return {
          success: true,
          data: mostRecentActive,
        };
      }

      // All schedules have ended - return the most recent one
      const mostRecent = todaySchedules.reduce((latest: any, current: any) => {
        const latestStart =
          typeof latest.startTime === "number"
            ? latest.startTime
            : latest.startTime instanceof Date
            ? latest.startTime.getTime()
            : new Date(latest.startTime as string).getTime();
        const currentStart =
          typeof current.startTime === "number"
            ? current.startTime
            : current.startTime instanceof Date
            ? current.startTime.getTime()
            : new Date(current.startTime as string).getTime();
        return currentStart > latestStart ? current : latest;
      });

      return {
        success: true,
        data: mostRecent,
      };
    } catch (error) {
      logger.error("Get today's schedule IPC error:", error);
      return {
        success: false,
        message: "Failed to get today's schedule",
      };
    }
  });

  ipcMain.handle("shift:getStats", async (event, shiftId) => {
    try {
      const db = await getDatabase();

      const transactions = await db.transactions.getTransactionsByShift(
        shiftId
      );

      const stats = {
        totalTransactions: transactions.filter((t: any) => t.status === "completed")
          .length,
        totalSales: transactions
          .filter((t: any) => t.type === "sale" && t.status === "completed")
          .reduce((sum: number, t: any) => sum + t.total, 0),
        totalRefunds: Math.abs(
          transactions
            .filter((t: any) => t.type === "refund" && t.status === "completed")
            .reduce((sum: number, t: any) => sum + t.total, 0)
        ),
        totalVoids: transactions.filter((t: any) => t.status === "voided").length,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      logger.error("Get shift stats IPC error:", error);
      return {
        success: false,
        message: "Failed to get shift stats",
      };
    }
  });

  ipcMain.handle("shift:getHourlyStats", async (event, shiftId) => {
    try {
      const db = await getDatabase();

      const hourlyStats = db.shifts.getHourlyTransactionStats(shiftId);

      return {
        success: true,
        data: hourlyStats,
      };
    } catch (error) {
      logger.error("Get hourly stats IPC error:", error);
      return {
        success: false,
        message: "Failed to get hourly stats",
      };
    }
  });

  ipcMain.handle("shift:getCashDrawerBalance", async (event, shiftId) => {
    try {
      const db = await getDatabase();

      const cashBalance = db.cashDrawers.getCurrentCashDrawerBalance(shiftId);

      return {
        success: true,
        data: cashBalance,
      };
    } catch (error) {
      logger.error("Get cash drawer balance IPC error:", error);
      return {
        success: false,
        message: "Failed to get cash drawer balance",
      };
    }
  });
}
