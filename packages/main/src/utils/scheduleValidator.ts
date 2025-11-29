/**
 * Schedule Validator
 *
 * Validates if a user can clock in based on their schedule.
 * Implements schedule existence checks, time window validation,
 * grace period logic, and manager override support.
 */

import type { DatabaseManagers } from "../database/index.js";
import type { Schedule } from "../database/schema.js";
import { getLogger } from "./logger.js";

const logger = getLogger("scheduleValidator");

export interface ScheduleValidationResult {
  valid: boolean;
  canClockIn: boolean;
  requiresApproval: boolean;
  warnings: string[];
  schedule?: Schedule;
  reason?: string;
}

export class ScheduleValidator {
  private readonly GRACE_PERIOD_MINUTES = 15; // 15 minutes grace period before/after schedule

  /**
   * Validate if user can clock in based on schedule
   *
   * @param userId - User ID
   * @param businessId - Business ID
   * @param db - Database managers
   * @returns Schedule validation result
   */
  async validateClockIn(
    userId: string,
    businessId: string,
    db: DatabaseManagers
  ): Promise<ScheduleValidationResult> {
    logger.info(
      `[validateClockIn] Validating clock-in for user ${userId}, business ${businessId}`
    );

    try {
      // 1. Get today's schedule
      const schedule = await this.getTodaySchedule(userId, businessId, db);

      if (!schedule) {
        logger.warn(
          `[validateClockIn] No schedule found for user ${userId} today`
        );
        return {
          valid: false,
          canClockIn: false,
          requiresApproval: false,
          warnings: ["No schedule found for today"],
          reason: "No schedule exists for today",
        };
      }

      logger.info(
        `[validateClockIn] Found schedule: ${schedule.id} (${schedule.startTime} - ${schedule.endTime})`
      );

      // 2. Check if already clocked in
      const activeShift = db.shifts.getActiveShift(userId);
      if (activeShift) {
        logger.warn(
          `[validateClockIn] User ${userId} already has active shift ${activeShift.id}`
        );
        return {
          valid: false,
          canClockIn: false,
          requiresApproval: false,
          warnings: ["Already clocked in"],
          schedule,
          reason: "User already has an active shift",
        };
      }

      // 3. Validate time window
      const now = new Date();
      const scheduleStart = new Date(schedule.startTime);
      const scheduleEnd = new Date(schedule.endTime || scheduleStart);

      // Calculate grace period boundaries
      const scheduleStartWithGrace = new Date(scheduleStart);
      scheduleStartWithGrace.setMinutes(
        scheduleStartWithGrace.getMinutes() - this.GRACE_PERIOD_MINUTES
      );

      const scheduleEndWithGrace = new Date(scheduleEnd);
      scheduleEndWithGrace.setMinutes(
        scheduleEndWithGrace.getMinutes() + this.GRACE_PERIOD_MINUTES
      );

      logger.info(
        `[validateClockIn] Time check: now=${now.toISOString()}, start=${scheduleStart.toISOString()}, end=${scheduleEnd.toISOString()}`
      );
      logger.info(
        `[validateClockIn] Grace period: start=${scheduleStartWithGrace.toISOString()}, end=${scheduleEndWithGrace.toISOString()}`
      );

      // Check if before schedule (with grace period)
      if (now < scheduleStartWithGrace) {
        const minutesEarly = Math.floor(
          (scheduleStartWithGrace.getTime() - now.getTime()) / (1000 * 60)
        );
        logger.warn(
          `[validateClockIn] Clock-in is ${minutesEarly} minutes before scheduled time`
        );
        return {
          valid: false,
          canClockIn: false,
          requiresApproval: true, // Can clock in with manager approval
          warnings: [
            `Clock-in is ${minutesEarly} minutes before scheduled time (${scheduleStart.toLocaleTimeString()})`,
          ],
          schedule,
          reason: "Clock-in is before scheduled time",
        };
      }

      // Check if after schedule (with grace period)
      if (now > scheduleEndWithGrace) {
        const minutesLate = Math.floor(
          (now.getTime() - scheduleEndWithGrace.getTime()) / (1000 * 60)
        );
        logger.warn(
          `[validateClockIn] Clock-in is ${minutesLate} minutes after scheduled time`
        );
        return {
          valid: false,
          canClockIn: false,
          requiresApproval: true, // Can clock in with manager approval
          warnings: [
            `Clock-in is ${minutesLate} minutes after scheduled time (${scheduleEnd.toLocaleTimeString()})`,
          ],
          schedule,
          reason: "Clock-in is after scheduled time",
        };
      }

      // 4. Within schedule window (with grace period)
      logger.info(
        `[validateClockIn] ✅ Clock-in is within schedule window (with grace period)`
      );
      return {
        valid: true,
        canClockIn: true,
        requiresApproval: false,
        warnings: [],
        schedule,
      };
    } catch (error) {
      logger.error(
        `[validateClockIn] Error validating schedule for user ${userId}:`,
        error
      );
      return {
        valid: false,
        canClockIn: false,
        requiresApproval: false,
        warnings: [
          `Error validating schedule: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        reason: "Validation error",
      };
    }
  }

  /**
   * Get today's schedule for a user
   *
   * @param userId - User ID
   * @param businessId - Business ID
   * @param db - Database managers
   * @returns Today's schedule or null
   */
  private async getTodaySchedule(
    userId: string,
    businessId: string,
    db: DatabaseManagers
  ): Promise<Schedule | null> {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD

    // Get schedules for this user
    const schedules = db.schedules.getSchedulesByStaffId(userId);

    // Filter for today's schedules
    const todaySchedules = schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.startTime);
      const scheduleDateString = scheduleDate.toISOString().split("T")[0];
      return scheduleDateString === dateString;
    });

    if (todaySchedules.length === 0) {
      return null;
    }

    if (todaySchedules.length === 1) {
      return todaySchedules[0];
    }

    // Multiple schedules today - find the most relevant one
    // Priority:
    // 1. Schedules that haven't ended yet (current or future)
    // 2. Among those, prefer the one that starts later (most recent)
    // 3. If all have ended, prefer the one that starts later (most recent)
    const activeSchedules = todaySchedules.filter(
      (schedule) => new Date(schedule.endTime || schedule.startTime) > now
    );

    if (activeSchedules.length > 0) {
      // Return the one with the latest start time among active schedules
      return activeSchedules.reduce((latest, current) => {
        return new Date(current.startTime) > new Date(latest.startTime)
          ? current
          : latest;
      });
    }

    // All schedules have ended - return the most recent one
    return todaySchedules.reduce((latest, current) => {
      return new Date(current.startTime) > new Date(latest.startTime)
        ? current
        : latest;
    });
  }
}

// Export singleton instance for convenience
export const scheduleValidator = new ScheduleValidator();
