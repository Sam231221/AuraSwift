import type { Database } from "better-sqlite3";
import type {
  Discount,
  AppliedDiscount,
  Product,
  Transaction,
  TransactionItem,
} from "../../../../../types/database.d.ts";

export class DiscountManager {
  constructor(private db: Database) {}

  /**
   * Create a new discount
   */
  createDiscount(
    discountData: Omit<
      Discount,
      "id" | "createdAt" | "updatedAt" | "usageCount"
    >
  ): Discount {
    const now = new Date().toISOString();
    const id = require("uuid").v4();

    const discount: Discount = {
      id,
      ...discountData,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Serialize array fields to JSON
    const categoryIds = discountData.categoryIds
      ? JSON.stringify(discountData.categoryIds)
      : null;
    const productIds = discountData.productIds
      ? JSON.stringify(discountData.productIds)
      : null;
    const daysOfWeek = discountData.daysOfWeek
      ? JSON.stringify(discountData.daysOfWeek)
      : null;

    this.db
      .prepare(
        `
      INSERT INTO discounts (
        id, name, description, type, value, businessId,
        applicableTo, categoryIds, productIds,
        buyQuantity, getQuantity, getDiscountType, getDiscountValue,
        minPurchaseAmount, minQuantity, maxDiscountAmount,
        startDate, endDate, isActive,
        usageLimit, usageCount, perCustomerLimit,
        priority, daysOfWeek, timeStart, timeEnd,
        requiresCouponCode, couponCode, combinableWithOthers,
        createdAt, updatedAt, createdBy
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?
      )
    `
      )
      .run(
        discount.id,
        discount.name,
        discount.description || null,
        discount.type,
        discount.value,
        discount.businessId,
        discount.applicableTo,
        categoryIds,
        productIds,
        discount.buyQuantity || null,
        discount.getQuantity || null,
        discount.getDiscountType || null,
        discount.getDiscountValue || null,
        discount.minPurchaseAmount || null,
        discount.minQuantity || null,
        discount.maxDiscountAmount || null,
        discount.startDate || null,
        discount.endDate || null,
        discount.isActive ? 1 : 0,
        discount.usageLimit || null,
        discount.usageCount,
        discount.perCustomerLimit || null,
        discount.priority,
        daysOfWeek,
        discount.timeStart || null,
        discount.timeEnd || null,
        discount.requiresCouponCode ? 1 : 0,
        discount.couponCode || null,
        discount.combinableWithOthers ? 1 : 0,
        discount.createdAt,
        discount.updatedAt,
        discount.createdBy
      );

    return discount;
  }

  /**
   * Update an existing discount
   */
  updateDiscount(
    id: string,
    updates: Partial<Omit<Discount, "id" | "createdAt" | "usageCount">>
  ): void {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description || null);
    }
    if (updates.type !== undefined) {
      fields.push("type = ?");
      values.push(updates.type);
    }
    if (updates.value !== undefined) {
      fields.push("value = ?");
      values.push(updates.value);
    }
    if (updates.applicableTo !== undefined) {
      fields.push("applicableTo = ?");
      values.push(updates.applicableTo);
    }
    if (updates.categoryIds !== undefined) {
      fields.push("categoryIds = ?");
      values.push(
        updates.categoryIds ? JSON.stringify(updates.categoryIds) : null
      );
    }
    if (updates.productIds !== undefined) {
      fields.push("productIds = ?");
      values.push(
        updates.productIds ? JSON.stringify(updates.productIds) : null
      );
    }
    if (updates.buyQuantity !== undefined) {
      fields.push("buyQuantity = ?");
      values.push(updates.buyQuantity || null);
    }
    if (updates.getQuantity !== undefined) {
      fields.push("getQuantity = ?");
      values.push(updates.getQuantity || null);
    }
    if (updates.getDiscountType !== undefined) {
      fields.push("getDiscountType = ?");
      values.push(updates.getDiscountType || null);
    }
    if (updates.getDiscountValue !== undefined) {
      fields.push("getDiscountValue = ?");
      values.push(updates.getDiscountValue || null);
    }
    if (updates.minPurchaseAmount !== undefined) {
      fields.push("minPurchaseAmount = ?");
      values.push(updates.minPurchaseAmount || null);
    }
    if (updates.minQuantity !== undefined) {
      fields.push("minQuantity = ?");
      values.push(updates.minQuantity || null);
    }
    if (updates.maxDiscountAmount !== undefined) {
      fields.push("maxDiscountAmount = ?");
      values.push(updates.maxDiscountAmount || null);
    }
    if (updates.startDate !== undefined) {
      fields.push("startDate = ?");
      values.push(updates.startDate || null);
    }
    if (updates.endDate !== undefined) {
      fields.push("endDate = ?");
      values.push(updates.endDate || null);
    }
    if (updates.isActive !== undefined) {
      fields.push("isActive = ?");
      values.push(updates.isActive ? 1 : 0);
    }
    if (updates.usageLimit !== undefined) {
      fields.push("usageLimit = ?");
      values.push(updates.usageLimit || null);
    }
    if (updates.perCustomerLimit !== undefined) {
      fields.push("perCustomerLimit = ?");
      values.push(updates.perCustomerLimit || null);
    }
    if (updates.priority !== undefined) {
      fields.push("priority = ?");
      values.push(updates.priority);
    }
    if (updates.daysOfWeek !== undefined) {
      fields.push("daysOfWeek = ?");
      values.push(
        updates.daysOfWeek ? JSON.stringify(updates.daysOfWeek) : null
      );
    }
    if (updates.timeStart !== undefined) {
      fields.push("timeStart = ?");
      values.push(updates.timeStart || null);
    }
    if (updates.timeEnd !== undefined) {
      fields.push("timeEnd = ?");
      values.push(updates.timeEnd || null);
    }
    if (updates.requiresCouponCode !== undefined) {
      fields.push("requiresCouponCode = ?");
      values.push(updates.requiresCouponCode ? 1 : 0);
    }
    if (updates.couponCode !== undefined) {
      fields.push("couponCode = ?");
      values.push(updates.couponCode || null);
    }
    if (updates.combinableWithOthers !== undefined) {
      fields.push("combinableWithOthers = ?");
      values.push(updates.combinableWithOthers ? 1 : 0);
    }

    fields.push("updatedAt = ?");
    values.push(now);

    if (fields.length === 0) return;

    values.push(id);
    this.db
      .prepare(`UPDATE discounts SET ${fields.join(", ")} WHERE id = ?`)
      .run(...values);
  }

  /**
   * Delete a discount
   */
  deleteDiscount(id: string): void {
    this.db.prepare("DELETE FROM discounts WHERE id = ?").run(id);
  }

  /**
   * Get discount by ID
   */
  getDiscountById(id: string): Discount | null {
    const row = this.db
      .prepare("SELECT * FROM discounts WHERE id = ?")
      .get(id) as any;
    return row ? this.deserializeDiscount(row) : null;
  }

  /**
   * Get all discounts for a business
   */
  getDiscountsByBusiness(businessId: string): Discount[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM discounts WHERE businessId = ? ORDER BY priority DESC, createdAt DESC"
      )
      .all(businessId) as any[];
    return rows.map((row) => this.deserializeDiscount(row));
  }

  /**
   * Get active discounts for a business
   */
  getActiveDiscounts(businessId: string): Discount[] {
    const now = new Date().toISOString();
    const rows = this.db
      .prepare(
        `
      SELECT * FROM discounts 
      WHERE businessId = ? 
        AND isActive = 1
        AND (startDate IS NULL OR startDate <= ?)
        AND (endDate IS NULL OR endDate >= ?)
        AND (usageLimit IS NULL OR usageCount < usageLimit)
      ORDER BY priority DESC, createdAt DESC
    `
      )
      .all(businessId, now, now) as any[];
    return rows.map((row) => this.deserializeDiscount(row));
  }

  /**
   * Get applicable discounts for a product
   */
  getApplicableDiscountsForProduct(
    businessId: string,
    productId: string,
    categoryId: string
  ): Discount[] {
    const activeDiscounts = this.getActiveDiscounts(businessId);
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    return activeDiscounts.filter((discount) => {
      // Check time restrictions
      if (discount.daysOfWeek && discount.daysOfWeek.length > 0) {
        if (!discount.daysOfWeek.includes(currentDay)) return false;
      }
      if (discount.timeStart && currentTime < discount.timeStart) return false;
      if (discount.timeEnd && currentTime > discount.timeEnd) return false;

      // Check applicability
      if (discount.applicableTo === "all") return true;
      if (discount.applicableTo === "product") {
        return discount.productIds && discount.productIds.includes(productId);
      }
      if (discount.applicableTo === "category") {
        return (
          discount.categoryIds && discount.categoryIds.includes(categoryId)
        );
      }
      return false;
    });
  }

  /**
   * Calculate discount amount for a transaction item
   */
  calculateItemDiscount(
    item: { unitPrice: number; quantity: number },
    discount: Discount
  ): number {
    let discountAmount = 0;
    const itemTotal = item.unitPrice * item.quantity;

    if (discount.type === "percentage") {
      discountAmount = (itemTotal * discount.value) / 100;
    } else if (discount.type === "fixed_amount") {
      discountAmount = discount.value * item.quantity;
    }

    // Apply max discount cap
    if (
      discount.maxDiscountAmount &&
      discountAmount > discount.maxDiscountAmount
    ) {
      discountAmount = discount.maxDiscountAmount;
    }

    // Don't discount more than the item total
    return Math.min(discountAmount, itemTotal);
  }

  /**
   * Calculate discount for entire transaction
   */
  calculateTransactionDiscount(subtotal: number, discount: Discount): number {
    let discountAmount = 0;

    if (discount.type === "percentage") {
      discountAmount = (subtotal * discount.value) / 100;
    } else if (discount.type === "fixed_amount") {
      discountAmount = discount.value;
    }

    // Apply max discount cap
    if (
      discount.maxDiscountAmount &&
      discountAmount > discount.maxDiscountAmount
    ) {
      discountAmount = discount.maxDiscountAmount;
    }

    // Don't discount more than the subtotal
    return Math.min(discountAmount, subtotal);
  }

  /**
   * Increment usage count
   */
  incrementUsageCount(discountId: string): void {
    this.db
      .prepare("UPDATE discounts SET usageCount = usageCount + 1 WHERE id = ?")
      .run(discountId);
  }

  /**
   * Validate coupon code
   */
  validateCouponCode(businessId: string, couponCode: string): Discount | null {
    const row = this.db
      .prepare(
        `
      SELECT * FROM discounts 
      WHERE businessId = ? 
        AND couponCode = ? 
        AND isActive = 1
        AND requiresCouponCode = 1
    `
      )
      .get(businessId, couponCode) as any;

    if (!row) return null;

    const discount = this.deserializeDiscount(row);

    // Check if within date range
    const now = new Date().toISOString();
    if (discount.startDate && discount.startDate > now) return null;
    if (discount.endDate && discount.endDate < now) return null;

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit)
      return null;

    return discount;
  }

  /**
   * Deserialize discount from database row
   */
  private deserializeDiscount(row: any): Discount {
    return {
      ...row,
      isActive: Boolean(row.isActive),
      requiresCouponCode: Boolean(row.requiresCouponCode),
      combinableWithOthers: Boolean(row.combinableWithOthers),
      categoryIds: row.categoryIds ? JSON.parse(row.categoryIds) : undefined,
      productIds: row.productIds ? JSON.parse(row.productIds) : undefined,
      daysOfWeek: row.daysOfWeek ? JSON.parse(row.daysOfWeek) : undefined,
    };
  }
}
