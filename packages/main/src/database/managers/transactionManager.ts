import type {
  Transaction,
  TransactionItem,
  AppliedModifier,
  RefundItem,
} from "../models/transaction.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class TransactionManager {
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

  // Transaction CRUD methods - to be implemented from database.ts
  createTransaction(
    transactionData: Omit<Transaction, "id" | "createdAt">
  ): Transaction {
    const transactionId = this.uuid.v4();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO transactions (id, shiftId, businessId, type, subtotal, tax, total, paymentMethod, cashAmount, cardAmount, status, voidReason, customerId, receiptNumber, timestamp, createdAt, originalTransactionId, refundReason, refundMethod, managerApprovalId, isPartialRefund)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        transactionId,
        transactionData.shiftId,
        transactionData.businessId,
        transactionData.type,
        transactionData.subtotal,
        transactionData.tax,
        transactionData.total,
        transactionData.paymentMethod,
        transactionData.cashAmount || null,
        transactionData.cardAmount || null,
        transactionData.status,
        transactionData.voidReason || null,
        transactionData.customerId || null,
        transactionData.receiptNumber,
        transactionData.timestamp,
        now,
        transactionData.originalTransactionId || null,
        transactionData.refundReason || null,
        transactionData.refundMethod || null,
        transactionData.managerApprovalId || null,
        transactionData.isPartialRefund ? 1 : 0
      );

    return this.getTransactionById(transactionId);
  }

  getTransactionById(id: string): Transaction {
    const transaction = this.db
      .prepare("SELECT * FROM transactions WHERE id = ?")
      .get(id) as any;

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const items = this.getTransactionItems(id);

    return {
      ...transaction,
      isPartialRefund: Boolean(transaction.isPartialRefund),
      items,
    };
  }

  getTransactionItems(transactionId: string): TransactionItem[] {
    return this.db
      .prepare(
        "SELECT * FROM transaction_items WHERE transactionId = ? ORDER BY createdAt ASC"
      )
      .all(transactionId) as TransactionItem[];
  }

  getTransactionsByShift(shiftId: string): Transaction[] {
    const transactions = this.db
      .prepare(
        "SELECT * FROM transactions WHERE shiftId = ? ORDER BY timestamp DESC"
      )
      .all(shiftId) as any[];

    return transactions.map((tx) => ({
      ...tx,
      isPartialRefund: Boolean(tx.isPartialRefund),
      items: this.getTransactionItems(tx.id),
    }));
  }

  // ============================================
  // DRIZZLE ORM METHODS
  // ============================================

  /**
   * Get transaction by ID using Drizzle ORM (type-safe)
   */
  async getByIdDrizzle(transactionId: string): Promise<Transaction | null> {
    const drizzle = this.getDrizzleInstance();

    const [transaction] = await drizzle
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.id, transactionId),
          eq(schema.transactions.status, "completed")
        )
      )
      .limit(1);

    if (!transaction) return null;

    // Get items separately (use Drizzle method)
    const items = this.getItemsDrizzle(transaction.id);

    return {
      ...transaction,
      items,
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    } as Transaction;
  }

  /**
   * Get recent transactions using Drizzle ORM (type-safe)
   */
  async getRecentDrizzle(
    businessId: string,
    limit: number = 50
  ): Promise<Transaction[]> {
    const drizzle = this.getDrizzleInstance();

    const transactions = await drizzle
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.businessId, businessId),
          eq(schema.transactions.status, "completed")
        )
      )
      .orderBy(desc(schema.transactions.timestamp))
      .limit(limit);

    // Get items for each transaction
    const transactionsWithItems = transactions.map((transaction) => ({
      ...transaction,
      items: this.getItemsDrizzle(transaction.id),
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    }));

    return transactionsWithItems as Transaction[];
  }

  /**
   * Get transactions by shift using Drizzle ORM (type-safe)
   */
  async getByShiftDrizzle(
    shiftId: string,
    limit: number = 50
  ): Promise<Transaction[]> {
    const drizzle = this.getDrizzleInstance();

    const transactions = await drizzle
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.shiftId, shiftId),
          eq(schema.transactions.status, "completed")
        )
      )
      .orderBy(desc(schema.transactions.timestamp))
      .limit(limit);

    // Get items for each transaction
    const transactionsWithItems = transactions.map((transaction) => ({
      ...transaction,
      items: this.getItemsDrizzle(transaction.id),
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    }));

    return transactionsWithItems as Transaction[];
  }

  /**
   * Get transaction items using Drizzle ORM (type-safe)
   */
  getItemsDrizzle(transactionId: string): TransactionItem[] {
    const db = this.getDrizzleInstance();

    const items = db
      .select()
      .from(schema.transactionItems)
      .where(eq(schema.transactionItems.transactionId, transactionId))
      .all();

    // Get applied modifiers for each item
    return items.map((item) => {
      const modifiers = db
        .select()
        .from(schema.appliedModifiers)
        .where(eq(schema.appliedModifiers.transactionItemId, item.id))
        .all();

      return {
        ...item,
        refundedQuantity: item.refundedQuantity ?? undefined,
        weight: item.weight ?? undefined,
        discountAmount: item.discountAmount ?? undefined,
        appliedDiscounts: item.appliedDiscounts
          ? JSON.parse(item.appliedDiscounts)
          : undefined,
        appliedModifiers: modifiers as AppliedModifier[],
      };
    });
  }

  /**
   * Create transaction with items and modifiers (Drizzle)
   * Complex operation with atomic transaction support
   */
  createDrizzle(
    transaction: Omit<Transaction, "id" | "createdAt">
  ): Transaction {
    const db = this.getDrizzleInstance();
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    // Use Drizzle transaction for atomicity
    const result = db.transaction((tx) => {
      // 1. Insert main transaction
      tx.insert(schema.transactions)
        .values({
          id,
          shiftId: transaction.shiftId,
          businessId: transaction.businessId,
          type: transaction.type,
          subtotal: transaction.subtotal,
          tax: transaction.tax,
          total: transaction.total,
          paymentMethod: transaction.paymentMethod,
          cashAmount: transaction.cashAmount ?? null,
          cardAmount: transaction.cardAmount ?? null,
          status: transaction.status,
          voidReason: transaction.voidReason ?? null,
          customerId: transaction.customerId ?? null,
          receiptNumber: transaction.receiptNumber,
          appliedDiscounts: transaction.appliedDiscounts
            ? JSON.stringify(transaction.appliedDiscounts)
            : null,
          timestamp: transaction.timestamp,
          createdAt: now,
        })
        .run();

      // 2. Insert transaction items
      if (transaction.items && transaction.items.length > 0) {
        for (const item of transaction.items) {
          const itemId = this.uuid.v4();

          tx.insert(schema.transactionItems)
            .values({
              id: itemId,
              transactionId: id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              refundedQuantity: item.refundedQuantity ?? null,
              weight: item.weight ?? null,
              discountAmount: item.discountAmount ?? null,
              appliedDiscounts: item.appliedDiscounts
                ? JSON.stringify(item.appliedDiscounts)
                : null,
              createdAt: now,
            })
            .run();

          // 3. Insert applied modifiers for each item
          if (item.appliedModifiers && item.appliedModifiers.length > 0) {
            for (const modifier of item.appliedModifiers) {
              const modifierId = this.uuid.v4();

              tx.insert(schema.appliedModifiers)
                .values({
                  id: modifierId,
                  transactionItemId: itemId,
                  modifierId: modifier.modifierId,
                  modifierName: modifier.modifierName,
                  optionId: modifier.optionId,
                  optionName: modifier.optionName,
                  price: modifier.price,
                  createdAt: now,
                })
                .run();
            }
          }
        }
      }

      return {
        ...transaction,
        id,
        createdAt: now,
      };
    });

    return result;
  }

  /**
   * Create transaction item (Drizzle)
   * Helper method for individual item creation
   */
  createItemDrizzle(
    transactionId: string,
    item: Omit<TransactionItem, "id" | "createdAt">
  ): string {
    const db = this.getDrizzleInstance();
    const itemId = this.uuid.v4();
    const now = new Date().toISOString();

    db.transaction((tx) => {
      // Insert transaction item
      tx.insert(schema.transactionItems)
        .values({
          id: itemId,
          transactionId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          refundedQuantity: item.refundedQuantity ?? null,
          weight: item.weight ?? null,
          discountAmount: item.discountAmount ?? null,
          appliedDiscounts: item.appliedDiscounts
            ? JSON.stringify(item.appliedDiscounts)
            : null,
          createdAt: now,
        })
        .run();

      // Insert applied modifiers if any
      if (item.appliedModifiers && item.appliedModifiers.length > 0) {
        for (const modifier of item.appliedModifiers) {
          const modifierId = this.uuid.v4();

          tx.insert(schema.appliedModifiers)
            .values({
              id: modifierId,
              transactionItemId: itemId,
              modifierId: modifier.modifierId,
              modifierName: modifier.modifierName,
              optionId: modifier.optionId,
              optionName: modifier.optionName,
              price: modifier.price,
              createdAt: now,
            })
            .run();
        }
      }
    });

    return itemId;
  }

  /**
   * Create applied modifier (Drizzle)
   * Helper method for individual modifier creation
   */
  createAppliedModifierDrizzle(
    transactionItemId: string,
    modifier: Omit<AppliedModifier, "id" | "createdAt">
  ): void {
    const db = this.getDrizzleInstance();
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    db.insert(schema.appliedModifiers)
      .values({
        id,
        transactionItemId,
        modifierId: modifier.modifierId,
        modifierName: modifier.modifierName,
        optionId: modifier.optionId,
        optionName: modifier.optionName,
        price: modifier.price,
        createdAt: now,
      })
      .run();
  }

  /**
   * Create refund transaction (Drizzle)
   * Complex operation with proportional tax calculation and inventory restoration
   */
  async createRefundDrizzle(refundData: {
    originalTransactionId: string;
    shiftId: string;
    businessId: string;
    refundItems: RefundItem[];
    refundReason: string;
    refundMethod: "original" | "store_credit" | "cash" | "card";
    managerApprovalId?: string;
    cashierId: string;
  }): Promise<Transaction> {
    const db = this.getDrizzleInstance();

    // Get original transaction to validate refund
    const originalTransaction = await this.getByIdDrizzle(
      refundData.originalTransactionId
    );
    if (!originalTransaction) {
      throw new Error("Original transaction not found");
    }

    // Calculate refund totals
    const refundSubtotal = refundData.refundItems.reduce(
      (sum, item) => sum + item.refundAmount,
      0
    );
    const refundTax =
      refundSubtotal * (originalTransaction.tax / originalTransaction.subtotal);
    const refundTotal = refundSubtotal + refundTax;

    // Determine payment method for refund
    let paymentMethod: "cash" | "card" | "mixed";
    if (refundData.refundMethod === "original") {
      paymentMethod = originalTransaction.paymentMethod;
    } else if (refundData.refundMethod === "cash") {
      paymentMethod = "cash";
    } else if (refundData.refundMethod === "card") {
      paymentMethod = "card";
    } else {
      paymentMethod = "cash"; // Store credit treated as cash
    }

    const refundId = this.uuid.v4();
    const receiptNumber = `REF-${Date.now()}`;
    const now = new Date().toISOString();

    // Check if partial refund
    const isPartialRefund =
      refundData.refundItems.length < originalTransaction.items.length ||
      refundData.refundItems.some((refundItem) => {
        const originalItem = originalTransaction.items.find(
          (item) => item.id === refundItem.originalItemId
        );
        return (
          originalItem && refundItem.refundQuantity < originalItem.quantity
        );
      });

    // Use Drizzle transaction for atomicity
    db.transaction((tx) => {
      // 1. Create refund transaction record
      tx.insert(schema.transactions)
        .values({
          id: refundId,
          shiftId: refundData.shiftId,
          businessId: refundData.businessId,
          type: "refund",
          subtotal: -refundSubtotal, // Negative for refund
          tax: -refundTax,
          total: -refundTotal,
          paymentMethod,
          cashAmount: paymentMethod === "cash" ? -refundTotal : null,
          cardAmount: paymentMethod === "card" ? -refundTotal : null,
          status: "completed",
          receiptNumber,
          timestamp: now,
          createdAt: now,
          originalTransactionId: refundData.originalTransactionId,
          refundReason: refundData.refundReason,
          refundMethod: refundData.refundMethod,
          managerApprovalId: refundData.managerApprovalId ?? null,
          isPartialRefund: isPartialRefund,
          voidReason: null,
          customerId: null,
          appliedDiscounts: null,
        })
        .run();

      // 2. Create refund transaction items
      for (const refundItem of refundData.refundItems) {
        const itemId = this.uuid.v4();

        tx.insert(schema.transactionItems)
          .values({
            id: itemId,
            transactionId: refundId,
            productId: refundItem.productId,
            productName: refundItem.productName,
            quantity: -refundItem.refundQuantity, // Negative for refund
            unitPrice: refundItem.unitPrice,
            totalPrice: -refundItem.refundAmount,
            refundedQuantity: null,
            weight: null,
            discountAmount: null,
            appliedDiscounts: null,
            createdAt: now,
          })
          .run();

        // 3. Update original item's refunded quantity
        const currentRefunded = tx
          .select({
            refundedQuantity: schema.transactionItems.refundedQuantity,
          })
          .from(schema.transactionItems)
          .where(eq(schema.transactionItems.id, refundItem.originalItemId))
          .get();

        tx.update(schema.transactionItems)
          .set({
            refundedQuantity:
              (currentRefunded?.refundedQuantity ?? 0) +
              refundItem.refundQuantity,
          })
          .where(eq(schema.transactionItems.id, refundItem.originalItemId))
          .run();

        // 4. Update inventory if item is restockable
        if (refundItem.restockable) {
          const currentProduct = tx
            .select({ stockLevel: schema.products.stockLevel })
            .from(schema.products)
            .where(eq(schema.products.id, refundItem.productId))
            .get();

          tx.update(schema.products)
            .set({
              stockLevel:
                (currentProduct?.stockLevel ?? 0) + refundItem.refundQuantity,
              updatedAt: now,
            })
            .where(eq(schema.products.id, refundItem.productId))
            .run();
        }
      }
    });

    // Return the created refund transaction
    const createdTransaction = await this.getByIdDrizzle(refundId);
    if (!createdTransaction) {
      throw new Error("Failed to retrieve created refund transaction");
    }
    return createdTransaction;
  }

  /**
   * Void transaction (Drizzle)
   * Complex operation with validation, inventory restoration, and audit logging
   */
  async voidDrizzle(voidData: {
    transactionId: string;
    cashierId: string;
    reason: string;
    managerApprovalId?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const db = this.getDrizzleInstance();

    try {
      // Get original transaction
      const originalTransaction = await this.getByIdDrizzle(
        voidData.transactionId
      );

      if (!originalTransaction) {
        throw new Error("Transaction not found");
      }

      // Check if transaction can be voided
      if (originalTransaction.status !== "completed") {
        throw new Error("Only completed transactions can be voided");
      }

      // Check time window (30 minutes for void)
      const transactionTime = new Date(originalTransaction.timestamp);
      const now = new Date();
      const timeDifferenceMinutes =
        (now.getTime() - transactionTime.getTime()) / (1000 * 60);

      if (timeDifferenceMinutes > 30 && !voidData.managerApprovalId) {
        throw new Error(
          "Transaction is older than 30 minutes and requires manager approval"
        );
      }

      const now_iso = new Date().toISOString();

      // Use Drizzle transaction for atomicity
      db.transaction((tx) => {
        // 1. Update transaction status to voided
        tx.update(schema.transactions)
          .set({
            status: "voided",
            voidReason: voidData.reason,
          })
          .where(eq(schema.transactions.id, voidData.transactionId))
          .run();

        // 2. Restore inventory for all items in the transaction
        for (const item of originalTransaction.items) {
          const currentProduct = tx
            .select({ stockLevel: schema.products.stockLevel })
            .from(schema.products)
            .where(eq(schema.products.id, item.productId))
            .get();

          tx.update(schema.products)
            .set({
              stockLevel: (currentProduct?.stockLevel ?? 0) + item.quantity,
              updatedAt: now_iso,
            })
            .where(eq(schema.products.id, item.productId))
            .run();
        }

        // 3. Create audit log entry
        const auditId = this.uuid.v4();
        tx.insert(schema.auditLogs)
          .values({
            id: auditId,
            userId: voidData.cashierId,
            action: "void",
            resource: "transactions",
            resourceId: voidData.transactionId,
            details: JSON.stringify({
              reason: voidData.reason,
              managerApproval: voidData.managerApprovalId,
              originalAmount: originalTransaction.total,
            }),
            timestamp: now_iso,
            createdAt: now_iso,
          })
          .run();
      });

      return {
        success: true,
        message: "Transaction voided successfully",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to void transaction",
      };
    }
  }
}
