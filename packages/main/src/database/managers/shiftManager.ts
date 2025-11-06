import type { Shift } from "../models/shift.js";

export class ShiftManager {
  private db: any;
  private uuid: any;

  constructor(db: any, uuid: any) {
    this.db = db;
    this.uuid = uuid;
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
}
