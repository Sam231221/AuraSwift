import type { Shift } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

import { getLogger } from '../../utils/logger.js';
const logger = getLogger('shiftManager');

export class ShiftManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Validate that a shift belongs to a specific user (cashier)
   * Prevents cashiers from creating transactions on other users' shifts
   *
   * @param shiftId - ID of the shift to validate
   * @param userId - ID of the user (should be shift owner)
   * @returns true if shift belongs to user, false otherwise
   */
  validateShiftOwnership(shiftId: string, userId: string): boolean {
    try {
      const shift = this.getShiftById(shiftId);
      return shift.cashierId === userId;
    } catch (error) {
      logger.error("Error validating shift ownership:", error);
      return false;
    }
  }

  /**
   * Create shift with transaction support for atomicity
   */
  createShift(shiftData: Omit<Shift, "id" | "createdAt" | "updatedAt">): Shift {
    const shiftId = this.uuid.v4();
    const now = new Date();

    // Validate data before creating shift
    if (!shiftData.cashierId) {
      throw new Error("Cashier ID is required");
    }
    if (!shiftData.businessId) {
      throw new Error("Business ID is required");
    }
    if (shiftData.startingCash < 0) {
      throw new Error("Starting cash cannot be negative");
    }
    if (shiftData.startingCash > 100000) {
      throw new Error("Starting cash exceeds maximum limit");
    }
    if (!shiftData.startTime) {
      throw new Error("Start time is required");
    }

    // Use transaction to ensure atomicity
    const result = this.db.transaction((tx) => {
      tx.insert(schema.shifts)
        .values({
          id: shiftId,
          scheduleId: shiftData.scheduleId ?? null,
          timeShiftId: (shiftData as any).timeShiftId ?? null, // Link to time shift
          cashierId: shiftData.cashierId,
          businessId: shiftData.businessId,
          deviceId: (shiftData as any).deviceId ?? null, // Device/terminal identifier
          startTime: shiftData.startTime,
          endTime: shiftData.endTime ?? null,
          status: shiftData.status,
          startingCash: shiftData.startingCash,
          finalCashDrawer: shiftData.finalCashDrawer ?? null,
          expectedCashDrawer: shiftData.expectedCashDrawer ?? null,
          cashVariance: shiftData.cashVariance ?? null,
          totalSales: shiftData.totalSales ?? 0,
          totalTransactions: shiftData.totalTransactions ?? 0,
          totalRefunds: shiftData.totalRefunds ?? 0,
          totalVoids: shiftData.totalVoids ?? 0,
          notes: shiftData.notes ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      return shiftId;
    });

    return {
      ...shiftData,
      id: result,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get shift by ID
   */
  getShiftById(id: string): Shift {
    const shifts = this.db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, id))
      .limit(1)
      .all();

    if (!shifts || shifts.length === 0) {
      throw new Error("Shift not found");
    }

    return shifts[0] as Shift;
  }

  /**
   * Get shifts by business
   */
  getShiftsByBusiness(businessId: string): Shift[] {
    return this.db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.businessId, businessId))
      .orderBy(desc(schema.shifts.startTime))
      .all() as Shift[];
  }

  /**
   * Get active shift for cashier
   */
  getActiveShift(cashierId: string): Shift | null {
    const shifts = this.db
      .select()
      .from(schema.shifts)
      .where(
        and(
          eq(schema.shifts.cashierId, cashierId),
          eq(schema.shifts.status, "active")
        )
      )
      .orderBy(desc(schema.shifts.startTime))
      .limit(1)
      .all();

    return shifts.length > 0 ? (shifts[0] as Shift) : null;
  }

  /**
   * Get active POS shifts by timeShiftId
   */
  getActiveShiftsByTimeShift(timeShiftId: string): Shift[] {
    if (!timeShiftId) {
      return [];
    }

    return this.db
      .select()
      .from(schema.shifts)
      .where(
        and(
          eq(schema.shifts.timeShiftId, timeShiftId),
          eq(schema.shifts.status, "active")
        )
      )
      .orderBy(desc(schema.shifts.startTime))
      .all() as Shift[];
  }

  /**
   * End shift with final calculations
   */
  endShift(
    shiftId: string,
    endData: {
      endTime: string;
      finalCashDrawer: number;
      expectedCashDrawer: number;
      totalSales: number;
      totalTransactions: number;
      totalRefunds: number;
      totalVoids: number;
      notes?: string;
    }
  ): void {
    const cashVariance = endData.finalCashDrawer - endData.expectedCashDrawer;
    const now = new Date();

    this.db
      .update(schema.shifts)
      .set({
        endTime: endData.endTime,
        status: "ended",
        finalCashDrawer: endData.finalCashDrawer,
        expectedCashDrawer: endData.expectedCashDrawer,
        cashVariance,
        totalSales: endData.totalSales,
        totalTransactions: endData.totalTransactions,
        totalRefunds: endData.totalRefunds,
        totalVoids: endData.totalVoids,
        notes: endData.notes ?? null,
        updatedAt: now,
      })
      .where(eq(schema.shifts.id, shiftId))
      .run();
  }

  /**
   * Get active shift for today (considering night shifts from 6 AM yesterday)
   */
  getTodaysActiveShift(cashierId: string): Shift | null {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(6, 0, 0, 0);

    const shifts = this.db
      .select()
      .from(schema.shifts)
      .where(
        and(
          eq(schema.shifts.cashierId, cashierId),
          eq(schema.shifts.status, "active"),
          drizzleSql`${schema.shifts.startTime} >= ${yesterday.toISOString()}`
        )
      )
      .orderBy(desc(schema.shifts.startTime))
      .limit(1)
      .all();

    return shifts.length > 0 ? (shifts[0] as Shift) : null;
  }

  /**
   * Auto-close old unclosed shifts that are more than 24 hours old
   * Returns array of closed shift info (id, timeShiftId, cashierId) for clock-out handling
   */
  autoCloseOldActiveShifts(): Array<{
    id: string;
    timeShiftId: string | null;
    cashierId: string;
  }> {
    const now = new Date();
    const nowString = now.toISOString();

    const basicCutoffTime = new Date(now);
    basicCutoffTime.setDate(basicCutoffTime.getDate() - 1);
    basicCutoffTime.setHours(6, 0, 0, 0);

    // Get all active shifts with their schedules
    const activeShifts = this.db
      .select({
        shift: schema.shifts,
        scheduledEndTime: schema.schedules.endTime,
      })
      .from(schema.shifts)
      .leftJoin(
        schema.schedules,
        eq(schema.shifts.scheduleId, schema.schedules.id)
      )
      .where(eq(schema.shifts.status, "active"))
      .all();

    const closedShifts: Array<{
      id: string;
      timeShiftId: string | null;
      cashierId: string;
    }> = [];

    for (const { shift, scheduledEndTime } of activeShifts) {
      let shouldClose = false;
      let closeReason = "";

      const shiftStart = new Date(shift.startTime);

      // Rule 1: Close shifts older than 24 hours
      if (shiftStart < basicCutoffTime) {
        shouldClose = true;
        closeReason =
          "Auto-closed - shift was left open for more than 24 hours";
      }
      // Rule 2: Close shifts that are way past their scheduled end time
      else if (scheduledEndTime) {
        const scheduledEnd = new Date(scheduledEndTime);
        const hoursOverdue =
          (now.getTime() - scheduledEnd.getTime()) / (1000 * 60 * 60);

        if (hoursOverdue > 4) {
          shouldClose = true;
          closeReason = `Auto-closed - shift was ${Math.round(
            hoursOverdue
          )} hours past scheduled end time`;
        }
      }
      // Rule 3: Close shifts that started more than 16 hours ago
      else {
        const hoursActive =
          (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
        if (hoursActive > 16) {
          shouldClose = true;
          closeReason = `Auto-closed - shift was active for ${Math.round(
            hoursActive
          )} hours without schedule`;
        }
      }

      if (shouldClose) {
        const estimatedCash = shift.startingCash + (shift.totalSales || 0);

        this.db
          .update(schema.shifts)
          .set({
            status: "ended",
            endTime: nowString,
            finalCashDrawer: estimatedCash,
            expectedCashDrawer: estimatedCash,
            notes: shift.notes ? `${shift.notes}; ${closeReason}` : closeReason,
            updatedAt: now,
          })
          .where(eq(schema.shifts.id, shift.id))
          .run();

        // Store closed shift info for clock-out handling
        closedShifts.push({
          id: shift.id,
          timeShiftId: shift.timeShiftId,
          cashierId: shift.cashierId,
        });

        logger.info(`Auto-closed shift ${shift.id}: ${closeReason}`);
      }
    }

    return closedShifts;
  }

  /**
   * Auto-end overdue shifts today (more aggressive than 24-hour cleanup)
   * Returns array of closed shift info (id, timeShiftId, cashierId) for clock-out handling
   */
  autoEndOverdueShiftsToday(): Array<{
    id: string;
    timeShiftId: string | null;
    cashierId: string;
  }> {
    const now = new Date();
    const nowString = now.toISOString();

    const activeShifts = this.db
      .select({
        shift: schema.shifts,
        scheduledEndTime: schema.schedules.endTime,
      })
      .from(schema.shifts)
      .leftJoin(
        schema.schedules,
        eq(schema.shifts.scheduleId, schema.schedules.id)
      )
      .where(
        and(
          eq(schema.shifts.status, "active"),
          drizzleSql`DATE(${schema.shifts.startTime}) = DATE(${nowString})`
        )
      )
      .all();

    const closedShifts: Array<{
      id: string;
      timeShiftId: string | null;
      cashierId: string;
    }> = [];

    for (const { shift, scheduledEndTime } of activeShifts) {
      let shouldClose = false;
      let closeReason = "";

      if (scheduledEndTime) {
        const scheduledEnd = new Date(scheduledEndTime);
        const hoursOverdue =
          (now.getTime() - scheduledEnd.getTime()) / (1000 * 60 * 60);

        // More aggressive: Close shifts that are 2+ hours past scheduled end time
        if (hoursOverdue > 2) {
          shouldClose = true;
          closeReason = `Auto-closed - shift was ${Math.round(
            hoursOverdue
          )} hours past scheduled end time`;
        }
      } else {
        // No schedule - close if active for more than 12 hours
        const shiftStart = new Date(shift.startTime);
        const hoursActive =
          (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
        if (hoursActive > 12) {
          shouldClose = true;
          closeReason = `Auto-closed - shift was active for ${Math.round(
            hoursActive
          )} hours without schedule`;
        }
      }

      if (shouldClose) {
        const estimatedCash = shift.startingCash + (shift.totalSales || 0);

        this.db
          .update(schema.shifts)
          .set({
            status: "ended",
            endTime: nowString,
            finalCashDrawer: estimatedCash,
            expectedCashDrawer: estimatedCash,
            notes: shift.notes ? `${shift.notes}; ${closeReason}` : closeReason,
            updatedAt: now,
          })
          .where(eq(schema.shifts.id, shift.id))
          .run();

        // Store closed shift info for clock-out handling
        closedShifts.push({
          id: shift.id,
          timeShiftId: shift.timeShiftId,
          cashierId: shift.cashierId,
        });

        logger.info(`Auto-ended overdue shift ${shift.id}: ${closeReason}`);
      }
    }

    return closedShifts;
  }

  /**
   * Get hourly transaction statistics for a shift
   */
  getHourlyTransactionStats(shiftId: string): {
    lastHour: number;
    currentHour: number;
    averagePerHour: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const currentHourStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      0,
      0
    );

    // Get transactions from the last hour
    const lastHourResult = this.db
      .select({ count: drizzleSql<number>`COUNT(*)` })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.shiftId, shiftId),
          drizzleSql`${
            schema.transactions.timestamp
          } >= ${oneHourAgo.toISOString()}`,
          drizzleSql`${schema.transactions.timestamp} <= ${now.toISOString()}`,
          eq(schema.transactions.status, "completed")
        )
      )
      .get();

    // Get transactions from current hour
    const currentHourResult = this.db
      .select({ count: drizzleSql<number>`COUNT(*)` })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.shiftId, shiftId),
          drizzleSql`${
            schema.transactions.timestamp
          } >= ${currentHourStart.toISOString()}`,
          eq(schema.transactions.status, "completed")
        )
      )
      .get();

    // Get shift start time for average calculation
    const shift = this.db
      .select({ startTime: schema.shifts.startTime })
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shiftId))
      .get();

    let averagePerHour = 0;
    if (shift) {
      const shiftStart = new Date(shift.startTime);
      const hoursWorked = Math.max(
        (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60),
        0.1
      );

      const totalResult = this.db
        .select({ count: drizzleSql<number>`COUNT(*)` })
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.shiftId, shiftId),
            eq(schema.transactions.status, "completed")
          )
        )
        .get();

      averagePerHour = (totalResult?.count || 0) / hoursWorked;
    }

    return {
      lastHour: lastHourResult?.count || 0,
      currentHour: currentHourResult?.count || 0,
      averagePerHour: Math.round((averagePerHour || 0) * 10) / 10,
    };
  }

  /**
   * Reconcile an auto-ended shift with manager approval
   */
  reconcileShift(
    shiftId: string,
    reconciliationData: {
      actualCashDrawer: number;
      managerNotes: string;
      managerId: string;
    }
  ): void {
    const shift = this.getShiftById(shiftId);

    const reconciliationNote = `Reconciled by manager. Actual cash: £${reconciliationData.actualCashDrawer.toFixed(
      2
    )}. ${reconciliationData.managerNotes}`;

    const updatedNotes = shift.notes
      ? `${shift.notes} | Manager Reconciliation: ${reconciliationNote}`
      : reconciliationNote;

    this.db
      .update(schema.shifts)
      .set({
        finalCashDrawer: reconciliationData.actualCashDrawer,
        notes: updatedNotes,
        updatedAt: new Date(),
      })
      .where(eq(schema.shifts.id, shiftId))
      .run();
  }

  /**
   * Get shifts that need manager reconciliation (auto-ended shifts)
   */
  getPendingReconciliationShifts(businessId: string): Shift[] {
    return this.db
      .select()
      .from(schema.shifts)
      .where(
        and(
          eq(schema.shifts.businessId, businessId),
          eq(schema.shifts.status, "ended"),
          drizzleSql`${schema.shifts.notes} LIKE '%Auto-ended%'`,
          drizzleSql`${schema.shifts.notes} LIKE '%Requires manager approval%'`
        )
      )
      .orderBy(desc(schema.shifts.endTime))
      .all() as Shift[];
  }
}
