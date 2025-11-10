import type { CashDrawerCount } from "../models/cashDrawer.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, desc } from "drizzle-orm";
import * as schema from "../schema.js";

export class CashDrawerManager {
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

  createCashDrawerCount(
    countData: Omit<CashDrawerCount, "id" | "createdAt">
  ): CashDrawerCount {
    const countId = this.uuid.v4();
    const now = new Date().toISOString();
    const drizzle = this.getDrizzleInstance();

    drizzle
      .insert(schema.cashDrawerCounts)
      .values({
        id: countId,
        shiftId: countData.shiftId,
        businessId: countData.businessId,
        countType: countData.countType,
        expectedAmount: countData.expectedAmount,
        countedAmount: countData.countedAmount,
        variance: countData.variance,
        notes: countData.notes || null,
        countedBy: countData.countedBy,
        timestamp: countData.timestamp,
        createdAt: now,
      })
      .run();

    return this.getCashDrawerCountById(countId);
  }

  getCashDrawerCountById(id: string): CashDrawerCount {
    const drizzle = this.getDrizzleInstance();
    const count = drizzle
      .select()
      .from(schema.cashDrawerCounts)
      .where(eq(schema.cashDrawerCounts.id, id))
      .get();

    if (!count) {
      throw new Error("Cash drawer count not found");
    }

    return count as CashDrawerCount;
  }

  getCashDrawerCountsByShift(shiftId: string): CashDrawerCount[] {
    const drizzle = this.getDrizzleInstance();
    return drizzle
      .select()
      .from(schema.cashDrawerCounts)
      .where(eq(schema.cashDrawerCounts.shiftId, shiftId))
      .orderBy(desc(schema.cashDrawerCounts.timestamp))
      .all() as CashDrawerCount[];
  }
}
