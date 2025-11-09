import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, asc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class ReportManager {
  private db: any;
  private drizzle: DrizzleDB;

  constructor(db: any, drizzle: DrizzleDB) {
    this.db = db;
    this.drizzle = drizzle;
  }

  /**
   * Get Drizzle ORM instance
   */
  private getDrizzleInstance(): DrizzleDB {
    if (!this.drizzle) {
      throw new Error("Drizzle ORM not initialized");
    }
    return this.drizzle;
  }

  // Report generation methods - to be implemented from database.ts
  getSalesReport(businessId: string, startDate: string, endDate: string): any {
    // Implement sales report logic
    return {};
  }

  getInventoryReport(businessId: string): any {
    // Implement inventory report logic
    return {};
  }

  // ============================================
  // DRIZZLE ORM METHODS
  // ============================================

  /**
   * Get current cash drawer balance using Drizzle ORM (type-safe)
   */
  getCurrentCashDrawerBalanceDrizzle(shiftId: string): {
    amount: number;
    isEstimated: boolean;
    lastCountTime?: string;
    variance?: number;
  } {
    const db = this.getDrizzleInstance();

    // Get shift details
    const shift = db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shiftId))
      .get();

    if (!shift) {
      return { amount: 0, isEstimated: true };
    }

    // Get the most recent cash count (using raw SQL method for now)
    const latestCount = this.db
      .prepare(
        "SELECT * FROM cash_drawer_counts WHERE shiftId = ? ORDER BY timestamp DESC LIMIT 1"
      )
      .get(shiftId);

    if (latestCount) {
      // Use actual counted amount
      const expectedAtCountTime = this.getExpectedCashForShiftDrizzle(shiftId);
      const variance =
        latestCount.countedAmount - expectedAtCountTime.expectedAmount;

      return {
        amount: latestCount.countedAmount,
        isEstimated: false,
        lastCountTime: latestCount.timestamp,
        variance: variance,
      };
    } else {
      // Estimate based on starting cash + sales
      const expectedCash = this.getExpectedCashForShiftDrizzle(shiftId);
      return {
        amount: expectedCash.expectedAmount,
        isEstimated: true,
      };
    }
  }

  /**
   * Calculate expected cash amount for a shift using Drizzle ORM (type-safe)
   * Complex aggregation query
   */
  getExpectedCashForShiftDrizzle(shiftId: string): {
    expectedAmount: number;
    breakdown: {
      startingCash: number;
      cashSales: number;
      cashRefunds: number;
      cashVoids: number;
    };
  } {
    const db = this.getDrizzleInstance();

    // Get shift details
    const shift = db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shiftId))
      .get();

    if (!shift) {
      throw new Error("Shift not found");
    }

    // Calculate cash transactions using aggregation
    const cashTransactions = db
      .select({
        type: schema.transactions.type,
        cashAmount: drizzleSql<number>`SUM(CASE 
          WHEN ${schema.transactions.paymentMethod} = 'cash' THEN ${schema.transactions.total}
          WHEN ${schema.transactions.paymentMethod} = 'mixed' THEN COALESCE(${schema.transactions.cashAmount}, 0)
          ELSE 0
        END)`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.shiftId, shiftId),
          eq(schema.transactions.status, "completed"),
          drizzleSql`(${schema.transactions.paymentMethod} = 'cash' OR (${schema.transactions.paymentMethod} = 'mixed' AND ${schema.transactions.cashAmount} > 0))`
        )
      )
      .groupBy(schema.transactions.type)
      .all();

    let cashSales = 0;
    let cashRefunds = 0;
    let cashVoids = 0;

    cashTransactions.forEach((transaction: any) => {
      switch (transaction.type) {
        case "sale":
          cashSales += transaction.cashAmount;
          break;
        case "refund":
          cashRefunds += Math.abs(transaction.cashAmount);
          break;
        case "void":
          cashVoids += Math.abs(transaction.cashAmount);
          break;
      }
    });

    const expectedAmount =
      shift.startingCash + cashSales - cashRefunds - cashVoids;

    return {
      expectedAmount,
      breakdown: {
        startingCash: shift.startingCash,
        cashSales,
        cashRefunds,
        cashVoids,
      },
    };
  }

  /**
   * Generate shift report using Drizzle ORM (type-safe)
   * Complex reporting with aggregations and calculations
   */
  async generateShiftReportDrizzle(shiftId: string): Promise<any | null> {
    const db = this.getDrizzleInstance();

    // Get shift data
    const shift = db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shiftId))
      .get();

    if (!shift) return null;

    // Get linked schedule if exists
    let schedule: any = undefined;
    if (shift.scheduleId) {
      const scheduleResult = db
        .select()
        .from(schema.schedules)
        .where(eq(schema.schedules.id, shift.scheduleId))
        .get();

      if (scheduleResult) {
        schedule = {
          ...scheduleResult,
          assignedRegister: scheduleResult.assignedRegister ?? undefined,
          notes: scheduleResult.notes ?? undefined,
        };
      }
    }

    // Get transactions
    const allTransactions = db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.shiftId, shiftId))
      .orderBy(desc(schema.transactions.timestamp))
      .all();

    // Transform transactions with items (using raw SQL for now)
    const transactions = allTransactions.map((t: any) => ({
      ...t,
      items: this.db
        .prepare("SELECT * FROM transaction_items WHERE transactionId = ?")
        .all(t.id),
      appliedDiscounts: t.appliedDiscounts
        ? JSON.parse(t.appliedDiscounts)
        : undefined,
    }));

    // Get cash drawer counts (using raw SQL for now)
    const cashDrawerCounts = this.db
      .prepare("SELECT * FROM cash_drawer_counts WHERE shiftId = ?")
      .all(shiftId);

    // Calculate totals using aggregation
    const salesStats = db
      .select({
        totalSales: drizzleSql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.type} = 'sale' AND ${schema.transactions.status} = 'completed' THEN ${schema.transactions.total} ELSE 0 END), 0)`,
        totalRefunds: drizzleSql<number>`COALESCE(ABS(SUM(CASE WHEN ${schema.transactions.type} = 'refund' AND ${schema.transactions.status} = 'completed' THEN ${schema.transactions.total} ELSE 0 END)), 0)`,
        totalVoids: drizzleSql<number>`COALESCE(SUM(CASE WHEN ${schema.transactions.status} = 'voided' THEN ${schema.transactions.total} ELSE 0 END), 0)`,
      })
      .from(schema.transactions)
      .where(eq(schema.transactions.shiftId, shiftId))
      .get();

    const totalSales = salesStats?.totalSales ?? 0;
    const totalRefunds = salesStats?.totalRefunds ?? 0;
    const totalVoids = salesStats?.totalVoids ?? 0;
    const cashVariance = shift.cashVariance ?? 0;

    // Calculate attendance variance if schedule exists
    let attendanceVariance;
    if (schedule) {
      const plannedStart = new Date(schedule.startTime);
      const actualStart = new Date(shift.startTime);
      const plannedEnd = schedule.endTime ? new Date(schedule.endTime) : null;
      const actualEnd = shift.endTime ? new Date(shift.endTime) : null;

      const earlyMinutes = Math.max(
        0,
        (plannedStart.getTime() - actualStart.getTime()) / (1000 * 60)
      );
      const lateMinutes = Math.max(
        0,
        (actualStart.getTime() - plannedStart.getTime()) / (1000 * 60)
      );

      attendanceVariance = {
        plannedStart: schedule.startTime,
        actualStart: shift.startTime,
        plannedEnd: schedule.endTime,
        actualEnd: shift.endTime,
        earlyMinutes: earlyMinutes > 0 ? Math.round(earlyMinutes) : undefined,
        lateMinutes: lateMinutes > 0 ? Math.round(lateMinutes) : undefined,
      };
    }

    return {
      shift,
      schedule,
      transactions,
      cashDrawerCounts,
      totalSales,
      totalRefunds,
      totalVoids,
      cashVariance,
      attendanceVariance,
    };
  }
}
