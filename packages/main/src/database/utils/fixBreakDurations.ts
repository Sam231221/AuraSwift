/**
 * Data Migration Utility: Fix Break Durations
 *
 * This utility fixes existing break records that may have incorrect duration_seconds
 * values. It recalculates durations based on start_time and end_time.
 *
 * Usage:
 *   import { fixBreakDurations } from './database/utils/fixBreakDurations.js';
 *   await fixBreakDurations();
 */

import type { DatabaseManagers } from "../index.js";
import { getDatabase } from "../index.js";
import { getLogger } from "../../utils/logger.js";
import { eq, and, isNotNull } from "drizzle-orm";
import * as schema from "../schema.js";

const logger = getLogger("fixBreakDurations");

export interface FixBreakDurationsResult {
  success: boolean;
  totalBreaks: number;
  fixedBreaks: number;
  errors: string[];
  warnings: string[];
}

/**
 * Fix break durations for all completed breaks
 * Recalculates duration_seconds based on start_time and end_time
 */
export async function fixBreakDurations(
  db?: DatabaseManagers
): Promise<FixBreakDurationsResult> {
  const result: FixBreakDurationsResult = {
    success: false,
    totalBreaks: 0,
    fixedBreaks: 0,
    errors: [],
    warnings: [],
  };

  try {
    if (!db) {
      db = await getDatabase();
    }

    // Get all completed breaks by querying directly
    // Access the db property from timeTrackingManager
    const timeTrackingDb = (db.timeTracking as any).db;
    
    const allBreaks = timeTrackingDb
      .select()
      .from(schema.breaks)
      .where(
        and(
          eq(schema.breaks.status, "completed"),
          isNotNull(schema.breaks.end_time),
          isNotNull(schema.breaks.start_time)
        )
      )
      .all() as any[];

    const completedBreaks = allBreaks;

    result.totalBreaks = completedBreaks.length;

    logger.info(
      `[fixBreakDurations] Found ${completedBreaks.length} completed breaks to check`
    );

    for (const breakRecord of completedBreaks) {
      try {
        // Calculate correct duration
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

        const calculatedDurationSeconds = Math.floor(
          (endTimeMs - startTimeMs) / 1000
        );

        // Check if duration needs fixing
        const storedDuration = breakRecord.duration_seconds || 0;
        const difference = Math.abs(calculatedDurationSeconds - storedDuration);

        // Fix if difference is more than 1 second (allow for rounding)
        if (difference > 1) {
          logger.info(
            `[fixBreakDurations] Fixing break ${breakRecord.id}: stored=${storedDuration}s, calculated=${calculatedDurationSeconds}s`
          );

          // Update break duration
          timeTrackingDb
            .update(schema.breaks)
            .set({
              duration_seconds: calculatedDurationSeconds,
            })
            .where(eq(schema.breaks.id, breakRecord.id))
            .run();

          result.fixedBreaks++;

          // Validate the fix
          const { shiftDataValidator } = await import(
            "../../utils/shiftDataValidator.js"
          );
          const updatedBreak = {
            ...breakRecord,
            duration_seconds: calculatedDurationSeconds,
          };
          const validation = shiftDataValidator.validateBreak(
            updatedBreak as any
          );

          if (!validation.valid) {
            result.warnings.push(
              `Break ${breakRecord.id} still has validation errors after fix: ${validation.errors.join(", ")}`
            );
          }
        }
      } catch (error) {
        const errorMsg = `Failed to fix break ${breakRecord.id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        result.errors.push(errorMsg);
        logger.error(`[fixBreakDurations] ${errorMsg}`, error);
      }
    }

    // Also fix shift break_duration_seconds to match sum of breaks
    logger.info(
      "[fixBreakDurations] Checking shift break_duration_seconds..."
    );
    // Get all shifts
    const allShifts = timeTrackingDb
      .select()
      .from(schema.shifts)
      .all() as any[];
    let fixedShifts = 0;

    for (const shift of allShifts) {
      try {
        const shiftBreaks = db.timeTracking.getBreaksByShift(shift.id);
        const calculatedBreakSeconds = shiftBreaks
          .filter((b) => b.status === "completed" && b.duration_seconds)
          .reduce((sum, b) => sum + (b.duration_seconds || 0), 0);

        const storedBreakSeconds = shift.break_duration_seconds || 0;
        const difference = Math.abs(calculatedBreakSeconds - storedBreakSeconds);

        if (difference > 1) {
          logger.info(
            `[fixBreakDurations] Fixing shift ${shift.id}: stored=${storedBreakSeconds}s, calculated=${calculatedBreakSeconds}s`
          );

          timeTrackingDb
            .update(schema.shifts)
            .set({
              break_duration_seconds: calculatedBreakSeconds,
            })
            .where(eq(schema.shifts.id, shift.id))
            .run();

          fixedShifts++;
        }
      } catch (error) {
        const errorMsg = `Failed to fix shift ${shift.id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        result.warnings.push(errorMsg);
        logger.error(`[fixBreakDurations] ${errorMsg}`, error);
      }
    }

    if (fixedShifts > 0) {
      logger.info(
        `[fixBreakDurations] Fixed ${fixedShifts} shifts with incorrect break_duration_seconds`
      );
    }

    result.success = result.errors.length === 0;

    logger.info(
      `[fixBreakDurations] Completed: ${result.fixedBreaks}/${result.totalBreaks} breaks fixed, ${result.errors.length} errors`
    );

    return result;
  } catch (error) {
    logger.error("[fixBreakDurations] Fatal error:", error);
    result.errors.push(
      `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    result.success = false;
    return result;
  }
}

/**
 * Run the fix as a standalone script
 * This can be called from an IPC handler or admin command
 */
export async function runFixBreakDurations(): Promise<FixBreakDurationsResult> {
  logger.info("[runFixBreakDurations] Starting break duration fix...");
  return await fixBreakDurations();
}

