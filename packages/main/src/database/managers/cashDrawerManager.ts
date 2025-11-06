import type { CashDrawerCount } from "../models/cashDrawer.js";

export class CashDrawerManager {
  private db: any;
  private uuid: any;

  constructor(db: any, uuid: any) {
    this.db = db;
    this.uuid = uuid;
  }

  createCashDrawerCount(
    countData: Omit<CashDrawerCount, "id" | "createdAt">
  ): CashDrawerCount {
    const countId = this.uuid.v4();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO cash_drawer_counts (id, shiftId, businessId, countType, expectedAmount, countedAmount, variance, notes, countedBy, timestamp, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        countId,
        countData.shiftId,
        countData.businessId,
        countData.countType,
        countData.expectedAmount,
        countData.countedAmount,
        countData.variance,
        countData.notes || null,
        countData.countedBy,
        countData.timestamp,
        now
      );

    return this.getCashDrawerCountById(countId);
  }

  getCashDrawerCountById(id: string): CashDrawerCount {
    const count = this.db
      .prepare("SELECT * FROM cash_drawer_counts WHERE id = ?")
      .get(id) as CashDrawerCount;

    if (!count) {
      throw new Error("Cash drawer count not found");
    }

    return count;
  }

  getCashDrawerCountsByShift(shiftId: string): CashDrawerCount[] {
    return this.db
      .prepare(
        "SELECT * FROM cash_drawer_counts WHERE shiftId = ? ORDER BY timestamp DESC"
      )
      .all(shiftId) as CashDrawerCount[];
  }
}
