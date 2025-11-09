import type { Shift } from "../models/shift.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class ShiftManager {
  private db: any;
  private drizzle: DrizzleDB;
  private uuid: any;

  constructor(db: any, drizzle: DrizzleDB, uuid: any) {
    this.db = db;
    this.drizzle = drizzle;
    this.uuid = uuid;
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

  // Shift CRUD methods - to be implemented from database.ts
  createShift(shiftData: Omit<Shift, "id" | "createdAt" | "updatedAt">): Shift {
    const shiftId = this.uuid.v4();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO shifts (id, scheduleId, cashierId, businessId, startTime, endTime, status, startingCash, finalCashDrawer, expectedCashDrawer, cashVariance, totalSales, totalTransactions, totalRefunds, totalVoids, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        shiftId,
        shiftData.scheduleId || null,
        shiftData.cashierId,
        shiftData.businessId,
        shiftData.startTime,
        shiftData.endTime || null,
        shiftData.status,
        shiftData.startingCash,
        shiftData.finalCashDrawer || null,
        shiftData.expectedCashDrawer || null,
        shiftData.cashVariance || null,
        shiftData.totalSales || 0,
        shiftData.totalTransactions || 0,
        shiftData.totalRefunds || 0,
        shiftData.totalVoids || 0,
        shiftData.notes || null,
        now,
        now
      );

    return this.getShiftById(shiftId);
  }

  getShiftById(id: string): Shift {
    const shift = this.db
      .prepare("SELECT * FROM shifts WHERE id = ?")
      .get(id) as Shift;

    if (!shift) {
      throw new Error("Shift not found");
    }

    return shift;
  }

  getShiftsByBusiness(businessId: string): Shift[] {
    return this.db
      .prepare(
        "SELECT * FROM shifts WHERE businessId = ? ORDER BY startTime DESC"
      )
      .all(businessId) as Shift[];
  }

  getActiveShift(cashierId: string): Shift | null {
    return this.db
      .prepare(
        "SELECT * FROM shifts WHERE cashierId = ? AND status = 'active' ORDER BY startTime DESC LIMIT 1"
      )
      .get(cashierId) as Shift | null;
  }

  // ============================================
  // DRIZZLE ORM METHODS
  // ============================================

  /**
   * Create shift using Drizzle ORM (type-safe)
   */
  createDrizzle(shift: Omit<Shift, "id" | "createdAt" | "updatedAt">): Shift {
    const db = this.getDrizzleInstance();
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    db.insert(schema.shifts)
      .values({
        id,
        scheduleId: shift.scheduleId ?? null,
        cashierId: shift.cashierId,
        businessId: shift.businessId,
        startTime: shift.startTime,
        endTime: shift.endTime ?? null,
        status: shift.status,
        startingCash: shift.startingCash,
        finalCashDrawer: shift.finalCashDrawer ?? null,
        expectedCashDrawer: shift.expectedCashDrawer ?? null,
        cashVariance: shift.cashVariance ?? null,
        totalSales: shift.totalSales ?? 0,
        totalTransactions: shift.totalTransactions ?? 0,
        totalRefunds: shift.totalRefunds ?? 0,
        totalVoids: shift.totalVoids ?? 0,
        notes: shift.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return {
      ...shift,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * End shift using Drizzle ORM (type-safe)
   * Updates shift with final calculations
   */
  endDrizzle(
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
    const db = this.getDrizzleInstance();
    const cashVariance = endData.finalCashDrawer - endData.expectedCashDrawer;
    const now = new Date().toISOString();

    db.update(schema.shifts)
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
}
