/**
 * Break Compliance Validator
 *
 * Validates break compliance with labor law requirements:
 * - Required breaks (e.g., meal break after 6 hours)
 * - Minimum break duration
 * - Maximum consecutive work hours
 */

import type { DatabaseManagers } from "../database/index.js";
import type { Shift, Break } from "../database/schema.js";
import { getLogger } from "./logger.js";

const logger = getLogger("breakComplianceValidator");

export interface BreakComplianceResult {
  compliant: boolean;
  warnings: string[];
  violations: string[];
  isRequired: boolean;
  requiredReason?: string;
  minimumDurationSeconds?: number;
}

export interface BreakRequirementCheck {
  requiresBreak: boolean;
  reason: string;
  minimumDurationSeconds: number;
}

export class BreakComplianceValidator {
  // Labor law constants (configurable per jurisdiction)
  private readonly REQUIRED_BREAK_AFTER_HOURS = 6; // Hours of work before break required
  private readonly MINIMUM_MEAL_BREAK_SECONDS = 30 * 60; // 30 minutes in seconds
  private readonly MINIMUM_REST_BREAK_SECONDS = 10 * 60; // 10 minutes in seconds
  private readonly MAX_CONSECUTIVE_HOURS = 6; // Maximum consecutive work hours without break

  /**
   * Check if a break is required for a shift
   *
   * @param shift - Shift to check
   * @param db - Database managers
   * @returns Break requirement check result
   */
  async checkBreakRequirement(
    shift: Shift,
    db: DatabaseManagers
  ): Promise<BreakRequirementCheck> {
    try {
      // Get clock-in event to calculate work duration
      const clockIn = db.timeTracking.getClockEventById(shift.clock_in_id);
      if (!clockIn) {
        logger.warn(
          `[checkBreakRequirement] Clock-in event not found for shift ${shift.id}`
        );
        return {
          requiresBreak: false,
          reason: "Cannot determine shift duration",
          minimumDurationSeconds: this.MINIMUM_REST_BREAK_SECONDS,
        };
      }

      const now = new Date();
      const clockInTime =
        typeof clockIn.timestamp === "string"
          ? new Date(clockIn.timestamp)
          : new Date(clockIn.timestamp);
      const workDurationMs = now.getTime() - clockInTime.getTime();
      const workDurationHours = workDurationMs / (1000 * 60 * 60);

      // Get existing breaks for this shift
      const breaks = db.timeTracking.getBreaksByShift(shift.id);
      const completedBreaks = breaks.filter(
        (b) => b.status === "completed" && b.duration_seconds
      );
      const totalBreakSeconds = completedBreaks.reduce(
        (sum, b) => sum + (b.duration_seconds || 0),
        0
      );

      // Calculate consecutive work hours (time since last break or clock-in)
      const lastBreakEnd = completedBreaks.length > 0
        ? (() => {
            const lastBreak = completedBreaks[completedBreaks.length - 1];
            const endTime =
              typeof lastBreak.end_time === "number"
                ? new Date(lastBreak.end_time)
                : typeof lastBreak.end_time === "string"
                ? new Date(lastBreak.end_time)
                : lastBreak.end_time instanceof Date
                ? lastBreak.end_time
                : new Date();
            return endTime;
          })()
        : clockInTime;

      const consecutiveWorkMs = now.getTime() - lastBreakEnd.getTime();
      const consecutiveWorkHours = consecutiveWorkMs / (1000 * 60 * 60);

      // Check if break is required
      if (workDurationHours >= this.REQUIRED_BREAK_AFTER_HOURS) {
        // Check if meal break already taken
        const hasMealBreak = completedBreaks.some((b) => b.type === "meal");
        if (!hasMealBreak) {
          return {
            requiresBreak: true,
            reason: `Labor law: Meal break required after ${this.REQUIRED_BREAK_AFTER_HOURS} hours of work`,
            minimumDurationSeconds: this.MINIMUM_MEAL_BREAK_SECONDS,
          };
        }
      }

      // Check consecutive work hours
      if (consecutiveWorkHours >= this.MAX_CONSECUTIVE_HOURS) {
        return {
          requiresBreak: true,
          reason: `Labor law: Break required after ${this.MAX_CONSECUTIVE_HOURS} consecutive hours of work`,
          minimumDurationSeconds: this.MINIMUM_REST_BREAK_SECONDS,
        };
      }

      return {
        requiresBreak: false,
        reason: "No break required at this time",
        minimumDurationSeconds: this.MINIMUM_REST_BREAK_SECONDS,
      };
    } catch (error) {
      logger.error(
        `[checkBreakRequirement] Error checking break requirement for shift ${shift.id}:`,
        error
      );
      return {
        requiresBreak: false,
        reason: "Error checking break requirement",
        minimumDurationSeconds: this.MINIMUM_REST_BREAK_SECONDS,
      };
    }
  }

  /**
   * Validate break compliance when starting a break
   *
   * @param shift - Shift the break is for
   * @param breakType - Type of break
   * @param db - Database managers
   * @returns Compliance validation result
   */
  async validateBreakStart(
    shift: Shift,
    breakType: "meal" | "rest" | "other",
    db: DatabaseManagers
  ): Promise<BreakComplianceResult> {
    const warnings: string[] = [];
    const violations: string[] = [];

    try {
      // Check if break is required
      const requirement = await this.checkBreakRequirement(shift, db);
      const isRequired = requirement.requiresBreak;

      // If meal break is required but user is taking a rest break, warn
      if (isRequired && requirement.reason.includes("Meal break") && breakType !== "meal") {
        warnings.push(
          `Meal break is required but you're taking a ${breakType} break. Consider taking a meal break instead.`
        );
      }

      return {
        compliant: violations.length === 0,
        warnings,
        violations,
        isRequired,
        requiredReason: isRequired ? requirement.reason : undefined,
        minimumDurationSeconds: requirement.minimumDurationSeconds,
      };
    } catch (error) {
      logger.error(
        `[validateBreakStart] Error validating break start for shift ${shift.id}:`,
        error
      );
      return {
        compliant: false,
        warnings: [],
        violations: [
          `Error validating break: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        isRequired: false,
      };
    }
  }

  /**
   * Validate break compliance when ending a break
   *
   * @param breakRecord - Break being ended
   * @param shift - Shift the break belongs to
   * @returns Compliance validation result
   */
  validateBreakEnd(
    breakRecord: Break,
    shift: Shift
  ): BreakComplianceResult {
    const warnings: string[] = [];
    const violations: string[] = [];

    try {
      // Calculate break duration
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

      const durationSeconds = Math.floor((endTimeMs - startTimeMs) / 1000);

      // Check minimum duration if break was required
      if (breakRecord.is_required && breakRecord.minimum_duration_seconds) {
        const minimumDuration = breakRecord.minimum_duration_seconds;
        if (durationSeconds < minimumDuration) {
          violations.push(
            `Break duration (${Math.floor(durationSeconds / 60)} minutes) is shorter than required minimum (${Math.floor(minimumDuration / 60)} minutes). This may violate labor law requirements.`
          );
          // Mark break as short
          // Note: This would need to be updated in the database, but we'll return the violation
        }
      }

      // Check if break meets minimum duration for type
      const minimumForType =
        breakRecord.type === "meal"
          ? this.MINIMUM_MEAL_BREAK_SECONDS
          : this.MINIMUM_REST_BREAK_SECONDS;

      if (durationSeconds < minimumForType) {
        warnings.push(
          `Break duration (${Math.floor(durationSeconds / 60)} minutes) is shorter than recommended minimum for ${breakRecord.type} breaks (${Math.floor(minimumForType / 60)} minutes).`
        );
      }

      return {
        compliant: violations.length === 0,
        warnings,
        violations,
        isRequired: breakRecord.is_required || false,
        requiredReason: breakRecord.required_reason || undefined,
        minimumDurationSeconds: breakRecord.minimum_duration_seconds || undefined,
      };
    } catch (error) {
      logger.error(
        `[validateBreakEnd] Error validating break end for break ${breakRecord.id}:`,
        error
      );
      return {
        compliant: false,
        warnings: [],
        violations: [
          `Error validating break: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        isRequired: false,
      };
    }
  }
}

// Export singleton instance for convenience
export const breakComplianceValidator = new BreakComplianceValidator();

