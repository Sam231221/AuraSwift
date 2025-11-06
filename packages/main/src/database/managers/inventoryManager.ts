import type { StockAdjustment } from "../models/inventory.js";

export class InventoryManager {
  private db: any;
  private uuid: any;

  constructor(db: any, uuid: any) {
    this.db = db;
    this.uuid = uuid;
  }

  createStockAdjustment(
    adjustmentData: Omit<StockAdjustment, "id" | "timestamp">
  ): StockAdjustment {
    const adjustmentId = this.uuid.v4();
    const now = new Date().toISOString();

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO stock_adjustments (id, productId, type, quantity, reason, userId, businessId, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          adjustmentId,
          adjustmentData.productId,
          adjustmentData.type,
          adjustmentData.quantity,
          adjustmentData.reason || "",
          adjustmentData.userId,
          adjustmentData.businessId,
          now
        );

      const product = this.db
        .prepare("SELECT stockLevel FROM products WHERE id = ?")
        .get(adjustmentData.productId) as { stockLevel: number } | undefined;

      if (!product) {
        throw new Error("Product not found");
      }

      let newStockLevel = product.stockLevel;
      if (
        adjustmentData.type === "add" ||
        adjustmentData.type === "adjustment"
      ) {
        newStockLevel += adjustmentData.quantity;
      } else {
        newStockLevel -= adjustmentData.quantity;
      }

      this.db
        .prepare(
          "UPDATE products SET stockLevel = ?, updatedAt = ? WHERE id = ?"
        )
        .run(newStockLevel, now, adjustmentData.productId);
    });

    transaction();

    return {
      id: adjustmentId,
      ...adjustmentData,
      timestamp: now,
    };
  }

  getStockAdjustmentsByProduct(productId: string): StockAdjustment[] {
    return this.db
      .prepare(
        "SELECT * FROM stock_adjustments WHERE productId = ? ORDER BY timestamp DESC"
      )
      .all(productId) as StockAdjustment[];
  }

  getStockAdjustmentsByBusiness(businessId: string): StockAdjustment[] {
    return this.db
      .prepare(
        "SELECT * FROM stock_adjustments WHERE businessId = ? ORDER BY timestamp DESC"
      )
      .all(businessId) as StockAdjustment[];
  }
}
