import type { StockAdjustment } from "../schema/index.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, desc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema/index.js";

export class InventoryManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  createStockAdjustment(
    adjustmentData: Omit<StockAdjustment, "id" | "timestamp">
  ): StockAdjustment {
    const adjustmentId = this.uuid.v4();
    const now = new Date().toISOString();

    // Insert stock adjustment
    this.db
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
    const product = this.db
      .select({ stockLevel: schema.products.stockLevel })
      .from(schema.products)
      .where(eq(schema.products.id, adjustmentData.productId))
      .get();

    if (!product) {
      throw new Error("Product not found");
    }

    // Calculate new stock level
    let newStockLevel = product.stockLevel ?? 0;
    if (adjustmentData.type === "add" || adjustmentData.type === "adjustment") {
      newStockLevel += adjustmentData.quantity;
    } else {
      newStockLevel -= adjustmentData.quantity;
    }

    // Update product stock level
    this.db
      .update(schema.products)
      .set({
        stockLevel: newStockLevel,
        updatedAt: new Date(),
      })
      .where(eq(schema.products.id, adjustmentData.productId))
      .run();

    return {
      id: adjustmentId,
      ...adjustmentData,
      timestamp: now,
    };
  }

  getStockAdjustmentsByProduct(productId: string): StockAdjustment[] {
    return this.db
      .select()
      .from(schema.stockAdjustments)
      .where(eq(schema.stockAdjustments.productId, productId))
      .orderBy(desc(schema.stockAdjustments.timestamp))
      .all() as StockAdjustment[];
  }

  getStockAdjustmentsByBusiness(businessId: string): StockAdjustment[] {
    return this.db
      .select()
      .from(schema.stockAdjustments)
      .where(eq(schema.stockAdjustments.businessId, businessId))
      .orderBy(desc(schema.stockAdjustments.timestamp))
      .all() as StockAdjustment[];
  }
}
