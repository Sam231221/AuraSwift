import type { CashDrawerCount } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, desc, and, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class CashDrawerManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Create cash drawer count
   */
  createCashDrawerCount(
    countData: Omit<CashDrawerCount, "id" | "createdAt">
  ): CashDrawerCount {
    const countId = this.uuid.v4();
    const now = new Date().toISOString();

    this.db
      .insert(schema.cashDrawerCounts)
      .values({
        id: countId,
        shiftId: countData.shiftId,
        businessId: countData.businessId,
        countType: countData.countType,
        expectedAmount: countData.expectedAmount,
        countedAmount: countData.countedAmount,
        variance: countData.variance,
        notes: countData.notes ?? null,
        countedBy: countData.countedBy,
        timestamp: countData.timestamp,
        createdAt: now,
      })
      .run();

    return this.getCashDrawerCountById(countId);
  }

  /**
   * Get cash drawer count by ID
   */
  getCashDrawerCountById(id: string): CashDrawerCount {
    const count = this.db
      .select()
      .from(schema.cashDrawerCounts)
      .where(eq(schema.cashDrawerCounts.id, id))
      .get();

    if (!count) {
      throw new Error("Cash drawer count not found");
    }

    return count as CashDrawerCount;
  }

  /**
   * Get cash drawer counts by shift
   */
  getCashDrawerCountsByShift(shiftId: string): CashDrawerCount[] {
    return this.db
      .select()
      .from(schema.cashDrawerCounts)
      .where(eq(schema.cashDrawerCounts.shiftId, shiftId))
      .orderBy(desc(schema.cashDrawerCounts.timestamp))
      .all() as CashDrawerCount[];
  }

  /**
   * Get latest cash drawer count for a shift
   */
  getLatestCashDrawerCount(shiftId: string): CashDrawerCount | null {
    const count = this.db
      .select()
      .from(schema.cashDrawerCounts)
      .where(eq(schema.cashDrawerCounts.shiftId, shiftId))
      .orderBy(desc(schema.cashDrawerCounts.timestamp))
      .limit(1)
      .get();

    return count ? (count as CashDrawerCount) : null;
  }

  /**
   * Get current cash drawer balance with estimated or actual count
   */
  getCurrentCashDrawerBalance(shiftId: string): {
    amount: number;
    isEstimated: boolean;
    lastCountTime?: string;
    variance?: number;
  } {
    // Get shift details
    const shift = this.db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shiftId))
      .get();

    if (!shift) {
      return { amount: 0, isEstimated: true };
    }

    // Get the most recent cash count
    const latestCount = this.getLatestCashDrawerCount(shiftId);

    if (latestCount) {
      // Use actual counted amount
      const expectedAtCountTime = this.getExpectedCashForShift(shiftId);
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
      const expectedCash = this.getExpectedCashForShift(shiftId);
      return {
        amount: expectedCash.expectedAmount,
        isEstimated: true,
      };
    }
  }

  /**
   * Calculate expected cash amount for a shift based on transactions
   */
  getExpectedCashForShift(shiftId: string): {
    expectedAmount: number;
    breakdown: {
      startingCash: number;
      cashSales: number;
      cashRefunds: number;
      cashVoids: number;
    };
  } {
    // Get shift details
    const shift = this.db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shiftId))
      .get();

    if (!shift) {
      throw new Error("Shift not found");
    }

    // Calculate cash transactions using aggregation
    const cashTransactions = this.db
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

    cashTransactions.forEach((transaction) => {
      switch (transaction.type) {
        case "sale":
          cashSales += transaction.cashAmount || 0;
          break;
        case "refund":
          cashRefunds += Math.abs(transaction.cashAmount || 0);
          break;
        case "void":
          cashVoids += Math.abs(transaction.cashAmount || 0);
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
}
