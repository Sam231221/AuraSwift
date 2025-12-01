/**
 * Shift Data Validator
 *
 * Validates data consistency for shifts, breaks, and clock events.
 * Ensures data integrity and prevents invalid state transitions.
 */

import type { Break, Shift, ClockEvent } from "../database/schema.js";
import { getLogger } from "./logger.js";

const logger = getLogger("shiftDataValidator");

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ShiftDataValidator {
  /**
   * Validate break data consistency
   */
  validateBreak(breakRecord: Break): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate end_time >= start_time
      if (breakRecord.end_time && breakRecord.start_time) {
        const startTimeMs =
          typeof breakRecord.start_time === "number"
            ? breakRecord.start_time
            : breakRecord.start_time instanceof Date
            ? breakRecord.start_time.getTime()
            : new Date(breakRecord.start_time as string).getTime();

        const endTimeMs =
          typeof breakRecord.end_time === "number"
            ? breakRecord.end_time
            : breakRecord.end_time instanceof Date
            ? breakRecord.end_time.getTime()
            : new Date(breakRecord.end_time as string).getTime();

        if (endTimeMs < startTimeMs) {
          errors.push("Break end time cannot be before start time");
        }

        // Validate duration_seconds matches calculated duration
        if (breakRecord.duration_seconds !== null) {
          const calculatedDuration = Math.floor(
            (endTimeMs - startTimeMs) / 1000
          );
          const storedDuration = breakRecord.duration_seconds;

          // Allow 1 second tolerance for rounding
          if (Math.abs(calculatedDuration - storedDuration) > 1) {
            warnings.push(
              `Break duration_seconds (${storedDuration}s) does not match calculated duration (${calculatedDuration}s)`
            );
          }
        }
      }

      // Validate status transitions
      if (breakRecord.status === "completed" && !breakRecord.end_time) {
        errors.push("Completed break must have an end_time");
      }

      if (
        breakRecord.status === "completed" &&
        breakRecord.duration_seconds === null
      ) {
        errors.push("Completed break must have a duration_seconds");
      }

      // Validate required break has minimum duration
      if (
        breakRecord.is_required &&
        breakRecord.minimum_duration_seconds &&
        breakRecord.duration_seconds !== null &&
        breakRecord.duration_seconds < breakRecord.minimum_duration_seconds
      ) {
        warnings.push(
          `Required break duration (${breakRecord.duration_seconds}s) is shorter than minimum (${breakRecord.minimum_duration_seconds}s)`
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logger.error(
        `[validateBreak] Error validating break ${breakRecord.id}:`,
        error
      );
      return {
        valid: false,
        errors: [
          `Validation error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        warnings: [],
      };
    }
  }

  /**
   * Validate shift status transitions
   */
  validateShiftStatusTransition(
    currentStatus: string,
    newStatus: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validTransitions: Record<string, string[]> = {
      active: ["ended", "pending_review"],
      ended: [], // Cannot transition from ended
      pending_review: ["ended"], // Can be resolved to ended
    };

    const allowedStatuses = validTransitions[currentStatus] || [];

    if (!allowedStatuses.includes(newStatus)) {
      errors.push(
        `Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${
          allowedStatuses.join(", ") || "none"
        }`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate shift break_duration_seconds matches sum of breaks
   */
  validateShiftBreakDuration(shift: Shift, breaks: Break[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Calculate total break duration from breaks
      const calculatedBreakSeconds = breaks
        .filter((b) => b.status === "completed" && b.duration_seconds)
        .reduce((sum, b) => sum + (b.duration_seconds || 0), 0);

      // Get stored break_duration_seconds from shift
      const storedBreakSeconds = shift.break_duration_seconds || 0;

      // Allow 1 second tolerance for rounding
      if (Math.abs(calculatedBreakSeconds - storedBreakSeconds) > 1) {
        warnings.push(
          `Shift break_duration_seconds (${storedBreakSeconds}s) does not match sum of breaks (${calculatedBreakSeconds}s)`
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logger.error(
        `[validateShiftBreakDuration] Error validating shift ${shift.id}:`,
        error
      );
      return {
        valid: false,
        errors: [
          `Validation error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        warnings: [],
      };
    }
  }

  /**
   * Validate clock event timing
   */
  validateClockEvent(clockEvent: ClockEvent): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate timestamp is reasonable (not too far in past/future)
      const timestamp =
        typeof clockEvent.timestamp === "string"
          ? new Date(clockEvent.timestamp).getTime()
          : clockEvent.timestamp instanceof Date
          ? clockEvent.timestamp.getTime()
          : new Date(clockEvent.timestamp as string).getTime();

      const now = Date.now();
      const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
      const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;

      if (timestamp < oneYearAgo) {
        warnings.push("Clock event timestamp is more than 1 year in the past");
      }

      if (timestamp > oneYearFromNow) {
        warnings.push(
          "Clock event timestamp is more than 1 year in the future"
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logger.error(
        `[validateClockEvent] Error validating clock event ${clockEvent.id}:`,
        error
      );
      return {
        valid: false,
        errors: [
          `Validation error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        warnings: [],
      };
    }
  }
}

// Export singleton instance
export const shiftDataValidator = new ShiftDataValidator();
