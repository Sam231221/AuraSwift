import type { StockAdjustment } from "../models/inventory.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, desc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class InventoryManager {
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

  createStockAdjustment(
    adjustmentData: Omit<StockAdjustment, "id" | "timestamp">
  ): StockAdjustment {
    const adjustmentId = this.uuid.v4();
    const now = new Date().toISOString();
    const drizzle = this.getDrizzleInstance();

    // Use raw SQL transaction for compatibility
    const transaction = this.db.transaction(() => {
      // Insert stock adjustment using Drizzle
      drizzle
        .insert(schema.stockAdjustments)
        .values({
          id: adjustmentId,
          productId: adjustmentData.productId,
          type: adjustmentData.type,
          quantity: adjustmentData.quantity,
          reason: adjustmentData.reason || "",
          userId: adjustmentData.userId,
          businessId: adjustmentData.businessId,
          timestamp: now,
        })
        .run();

      // Get current stock level
      const product = drizzle
        .select({ stockLevel: schema.products.stockLevel })
        .from(schema.products)
        .where(eq(schema.products.id, adjustmentData.productId))
        .get();

      if (!product) {
        throw new Error("Product not found");
      }

      // Calculate new stock level
      let newStockLevel = product.stockLevel ?? 0;
      if (
        adjustmentData.type === "add" ||
        adjustmentData.type === "adjustment"
      ) {
        newStockLevel += adjustmentData.quantity;
      } else {
        newStockLevel -= adjustmentData.quantity;
      }

      // Update product stock level
      drizzle
        .update(schema.products)
        .set({
          stockLevel: newStockLevel,
          updatedAt: now,
        })
        .where(eq(schema.products.id, adjustmentData.productId))
        .run();
    });

    transaction();

    return {
      id: adjustmentId,
      ...adjustmentData,
      timestamp: now,
    };
  }

  getStockAdjustmentsByProduct(productId: string): StockAdjustment[] {
    const drizzle = this.getDrizzleInstance();
    return drizzle
      .select()
      .from(schema.stockAdjustments)
      .where(eq(schema.stockAdjustments.productId, productId))
      .orderBy(desc(schema.stockAdjustments.timestamp))
      .all() as StockAdjustment[];
  }

  getStockAdjustmentsByBusiness(businessId: string): StockAdjustment[] {
    const drizzle = this.getDrizzleInstance();
    return drizzle
      .select()
      .from(schema.stockAdjustments)
      .where(eq(schema.stockAdjustments.businessId, businessId))
      .orderBy(desc(schema.stockAdjustments.timestamp))
      .all() as StockAdjustment[];
  }
}
