import { ipcMain } from "electron";
import { getDatabase } from "../database/index.js";
import { getLogger } from "../utils/logger.js";

const logger = getLogger("timeTrackingHandlers");
let db: any = null;

export function registerTimeTrackingHandlers() {
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
      logger.error("Clock-in IPC error:", error);
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
      logger.error("Clock-out IPC error:", error);
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
      logger.error("Get active shift IPC error:", error);
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
      logger.error("Start break IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to start break",
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
      logger.error("End break IPC error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to end break",
      };
    }
  });
}
