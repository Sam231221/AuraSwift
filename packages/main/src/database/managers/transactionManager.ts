import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../schema.js";
import type { Transaction, TransactionItem } from "../schema.js";

// Utility types for transaction operations
export interface RefundItem {
  originalItemId: string;
  productId: string;
  productName: string;
  refundQuantity: number;
  unitPrice: number;
  refundAmount: number;
  restockable: boolean;
}

export interface TransactionWithItems extends Transaction {
  items: TransactionItem[];
}

export class TransactionManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Create transaction
   */
  async createTransaction(
    transactionData: Omit<Transaction, "id" | "createdAt">
  ): Promise<TransactionWithItems> {
    const transactionId = this.uuid.v4();

    await this.db.insert(schema.transactions).values({
      id: transactionId,
      shiftId: transactionData.shiftId,
      businessId: transactionData.businessId,
      type: transactionData.type,
      subtotal: transactionData.subtotal,
      tax: transactionData.tax,
      total: transactionData.total,
      paymentMethod: transactionData.paymentMethod,
      cashAmount: transactionData.cashAmount ?? null,
      cardAmount: transactionData.cardAmount ?? null,
      status: transactionData.status,
      voidReason: transactionData.voidReason ?? null,
      customerId: transactionData.customerId ?? null,
      receiptNumber: transactionData.receiptNumber,
      timestamp: transactionData.timestamp,
      originalTransactionId: transactionData.originalTransactionId ?? null,
      refundReason: transactionData.refundReason ?? null,
      refundMethod: transactionData.refundMethod ?? null,
      managerApprovalId: transactionData.managerApprovalId ?? null,
      isPartialRefund: transactionData.isPartialRefund ?? false,
      appliedDiscounts: transactionData.appliedDiscounts
        ? JSON.stringify(transactionData.appliedDiscounts)
        : null,
    });

    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) {
      throw new Error("Failed to create transaction");
    }
    return transaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<TransactionWithItems | null> {
    const [transaction] = await this.db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, id))
      .limit(1);

    if (!transaction) return null;

    const items = await this.getTransactionItems(id);

    return {
      ...transaction,
      isPartialRefund: Boolean(transaction.isPartialRefund),
      items,
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    } as TransactionWithItems;
  }

  /**
   * Get transaction items
   */
  async getTransactionItems(transactionId: string): Promise<TransactionItem[]> {
    const items = await this.db
      .select()
      .from(schema.transactionItems)
      .where(eq(schema.transactionItems.transactionId, transactionId))
      .orderBy(schema.transactionItems.createdAt);

    return items.map((item) => ({
      ...item,
      appliedDiscounts: item.appliedDiscounts
        ? JSON.parse(item.appliedDiscounts)
        : undefined,
    })) as TransactionItem[];
  }

  /**
   * Get transactions by shift
   */
  async getTransactionsByShift(
    shiftId: string
  ): Promise<TransactionWithItems[]> {
    const transactions = await this.db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.shiftId, shiftId))
      .orderBy(desc(schema.transactions.timestamp));

    const transactionsWithItems = await Promise.all(
      transactions.map(async (tx) => {
        const items = await this.getTransactionItems(tx.id);
        return {
          ...tx,
          isPartialRefund: Boolean(tx.isPartialRefund),
          items,
          appliedDiscounts: tx.appliedDiscounts
            ? JSON.parse(tx.appliedDiscounts)
            : undefined,
        } as TransactionWithItems;
      })
    );

    return transactionsWithItems;
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(
    businessId: string,
    limit: number = 50
  ): Promise<TransactionWithItems[]> {
    const transactions = await this.db
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

    const transactionsWithItems = await Promise.all(
      transactions.map(async (transaction) => {
        const items = await this.getTransactionItems(transaction.id);
        return {
          ...transaction,
          isPartialRefund: Boolean(transaction.isPartialRefund),
          items,
          appliedDiscounts: transaction.appliedDiscounts
            ? JSON.parse(transaction.appliedDiscounts)
            : undefined,
        } as TransactionWithItems;
      })
    );

    return transactionsWithItems;
  }

  /**
   * Create transaction with items and modifiers
   */
  async createTransactionWithItems(
    transaction: Omit<Transaction, "id" | "createdAt"> & {
      items?: TransactionItem[];
    }
  ): Promise<TransactionWithItems> {
    const id = this.uuid.v4();

    const result = await this.db.transaction(async (tx: any) => {
      // 1. Insert main transaction
      await tx.insert(schema.transactions).values({
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
        originalTransactionId: null,
        refundReason: null,
        refundMethod: null,
        managerApprovalId: null,
        isPartialRefund: false,
      });

      // 2. Insert transaction items
      if (transaction.items && transaction.items.length > 0) {
        for (const item of transaction.items) {
          const itemId = this.uuid.v4();

          await tx.insert(schema.transactionItems).values({
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
          });
          // Note: appliedModifiers table doesn't exist in schema
        }
      }

      return id;
    });

    // Return the created transaction with items
    const createdTransaction = await this.getTransactionById(result);
    if (!createdTransaction) {
      throw new Error("Failed to retrieve created transaction");
    }
    return createdTransaction;
  }

  /**
   * Create transaction item
   */
  async createTransactionItem(
    transactionId: string,
    item: Omit<TransactionItem, "id" | "createdAt">
  ): Promise<string> {
    const itemId = this.uuid.v4();

    await this.db.insert(schema.transactionItems).values({
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
    });
    // Note: appliedModifiers table doesn't exist in schema

    return itemId;
  }

  /**
   * Create refund transaction
   */
  async createRefundTransaction(refundData: {
    originalTransactionId: string;
    shiftId: string;
    businessId: string;
    refundItems: RefundItem[];
    refundReason: string;
    refundMethod: "original" | "store_credit" | "cash" | "card";
    managerApprovalId?: string;
    cashierId: string;
  }): Promise<TransactionWithItems> {
    // Get original transaction to validate refund
    const originalTransaction = await this.getTransactionById(
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

    // Check if partial refund
    const isPartialRefund =
      refundData.refundItems.length < originalTransaction.items.length ||
      refundData.refundItems.some((refundItem) => {
        const originalItem = originalTransaction.items.find(
          (item: TransactionItem) => item.id === refundItem.originalItemId
        );
        return (
          originalItem && refundItem.refundQuantity < originalItem.quantity
        );
      });

    // Use Drizzle transaction for atomicity
    await this.db.transaction(async (tx: any) => {
      // 1. Create refund transaction record
      await tx.insert(schema.transactions).values({
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
        timestamp: new Date().toISOString(),
        originalTransactionId: refundData.originalTransactionId,
        refundReason: refundData.refundReason,
        refundMethod: refundData.refundMethod,
        managerApprovalId: refundData.managerApprovalId ?? null,
        isPartialRefund: isPartialRefund,
        voidReason: null,
        customerId: null,
        appliedDiscounts: null,
      });

      // 2. Create refund transaction items
      for (const refundItem of refundData.refundItems) {
        const itemId = this.uuid.v4();

        await tx.insert(schema.transactionItems).values({
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
        });

        // 3. Update original item's refunded quantity
        const [currentItem] = await tx
          .select({
            refundedQuantity: schema.transactionItems.refundedQuantity,
          })
          .from(schema.transactionItems)
          .where(eq(schema.transactionItems.id, refundItem.originalItemId))
          .limit(1);

        await tx
          .update(schema.transactionItems)
          .set({
            refundedQuantity:
              (currentItem?.refundedQuantity ?? 0) + refundItem.refundQuantity,
          })
          .where(eq(schema.transactionItems.id, refundItem.originalItemId));

        // 4. Update inventory if item is restockable
        if (refundItem.restockable) {
          const [currentProduct] = await tx
            .select({ stockLevel: schema.products.stockLevel })
            .from(schema.products)
            .where(eq(schema.products.id, refundItem.productId))
            .limit(1);

          await tx
            .update(schema.products)
            .set({
              stockLevel:
                (currentProduct?.stockLevel ?? 0) + refundItem.refundQuantity,
            })
            .where(eq(schema.products.id, refundItem.productId));
        }
      }
    });

    // Return the created refund transaction
    const createdTransaction = await this.getTransactionById(refundId);
    if (!createdTransaction) {
      throw new Error("Failed to retrieve created refund transaction");
    }
    return createdTransaction;
  }

  /**
   * Void transaction
   */
  async voidTransaction(voidData: {
    transactionId: string;
    cashierId: string;
    reason: string;
    managerApprovalId?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Get original transaction
      const originalTransaction = await this.getTransactionById(
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

      // Use Drizzle transaction for atomicity
      await this.db.transaction(async (tx: any) => {
        // 1. Update transaction status to voided
        await tx
          .update(schema.transactions)
          .set({
            status: "voided",
            voidReason: voidData.reason,
          })
          .where(eq(schema.transactions.id, voidData.transactionId));

        // 2. Restore inventory for all items in the transaction
        for (const item of originalTransaction.items) {
          const [currentProduct] = await tx
            .select({ stockLevel: schema.products.stockLevel })
            .from(schema.products)
            .where(eq(schema.products.id, item.productId))
            .limit(1);

          await tx
            .update(schema.products)
            .set({
              stockLevel: (currentProduct?.stockLevel ?? 0) + item.quantity,
            })
            .where(eq(schema.products.id, item.productId));
        }

        // 3. Create audit log entry
        const auditId = this.uuid.v4();
        await tx.insert(schema.auditLogs).values({
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
          timestamp: new Date().toISOString(),
        });
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

  /**
   * Get transaction by receipt number
   */
  async getTransactionByReceiptNumber(
    receiptNumber: string
  ): Promise<TransactionWithItems | null> {
    const [transaction] = await this.db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.receiptNumber, receiptNumber),
          eq(schema.transactions.status, "completed")
        )
      )
      .orderBy(desc(schema.transactions.timestamp))
      .limit(1);

    if (!transaction) return null;

    const items = await this.getTransactionItems(transaction.id);

    return {
      ...transaction,
      isPartialRefund: Boolean(transaction.isPartialRefund),
      items,
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    } as TransactionWithItems;
  }

  /**
   * Get transaction by receipt number (any status)
   */
  async getTransactionByReceiptNumberAnyStatus(
    receiptNumber: string
  ): Promise<TransactionWithItems | null> {
    const [transaction] = await this.db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.receiptNumber, receiptNumber))
      .orderBy(desc(schema.transactions.timestamp))
      .limit(1);

    if (!transaction) return null;

    const items = await this.getTransactionItems(transaction.id);

    return {
      ...transaction,
      isPartialRefund: Boolean(transaction.isPartialRefund),
      items,
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    } as TransactionWithItems;
  }

  /**
   * Get transaction by ID (any status)
   */
  async getTransactionByIdAnyStatus(
    id: string
  ): Promise<TransactionWithItems | null> {
    const [transaction] = await this.db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, id))
      .limit(1);

    if (!transaction) return null;

    const items = await this.getTransactionItems(id);

    return {
      ...transaction,
      isPartialRefund: Boolean(transaction.isPartialRefund),
      items,
      appliedDiscounts: transaction.appliedDiscounts
        ? JSON.parse(transaction.appliedDiscounts)
        : undefined,
    } as TransactionWithItems;
  }

  /**
   * Get shift transactions with limit
   */
  async getShiftTransactions(
    shiftId: string,
    limit: number = 50
  ): Promise<TransactionWithItems[]> {
    const transactions = await this.db
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

    const transactionsWithItems = await Promise.all(
      transactions.map(async (transaction) => {
        const items = await this.getTransactionItems(transaction.id);
        return {
          ...transaction,
          isPartialRefund: Boolean(transaction.isPartialRefund),
          items,
          appliedDiscounts: transaction.appliedDiscounts
            ? JSON.parse(transaction.appliedDiscounts)
            : undefined,
        } as TransactionWithItems;
      })
    );

    return transactionsWithItems;
  }

  /**
   * Validate if a transaction can be voided
   */
  validateVoidEligibility(transactionId: string): {
    isValid: boolean;
    errors: string[];
    requiresManagerApproval: boolean;
  } {
    const errors: string[] = [];
    let requiresManagerApproval = false;

    // Note: This is a sync wrapper - in practice you'd want to make this async
    // For now, using a simple sync approach
    const transactions = this.db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, transactionId))
      .limit(1)
      .all();

    const transaction = transactions[0];

    if (!transaction) {
      errors.push("Transaction not found");
      return { isValid: false, errors, requiresManagerApproval: false };
    }

    // Check if already voided or refunded
    if (transaction.status !== "completed") {
      errors.push("Transaction is not in completed status");
    }

    // Check time window (30 minutes for normal void)
    const transactionTime = new Date(transaction.timestamp);
    const now = new Date();
    const timeDifferenceMinutes =
      (now.getTime() - transactionTime.getTime()) / (1000 * 60);

    if (timeDifferenceMinutes > 30) {
      requiresManagerApproval = true;
    }

    // Check if payment method allows void (card payments might be settled)
    if (transaction.paymentMethod === "card" && timeDifferenceMinutes > 60) {
      errors.push(
        "Card payment may be settled - refund required instead of void"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      requiresManagerApproval,
    };
  }

  /**
   * Validate if a transaction can be refunded
   */
  async validateRefundEligibility(
    transactionId: string,
    refundItems: RefundItem[]
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Get original transaction
    const originalTransaction = await this.getTransactionById(transactionId);
    if (!originalTransaction) {
      errors.push("Original transaction not found");
      return { isValid: false, errors };
    }

    // Check if transaction is too old (configurable - 30 days)
    const transactionDate = new Date(originalTransaction.timestamp);
    const daysDiff =
      (Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 30) {
      errors.push("Transaction is older than 30 days and cannot be refunded");
    }

    // Validate each refund item
    for (const refundItem of refundItems) {
      const originalItem = originalTransaction.items.find(
        (item: TransactionItem) => item.id === refundItem.originalItemId
      );
      if (!originalItem) {
        errors.push(
          `Item ${refundItem.productName} not found in original transaction`
        );
        continue;
      }

      // Check if refund quantity exceeds available quantity
      const availableQuantity =
        originalItem.quantity - (originalItem.refundedQuantity || 0);
      if (refundItem.refundQuantity > availableQuantity) {
        errors.push(
          `Cannot refund ${refundItem.refundQuantity} of ${refundItem.productName}. Only ${availableQuantity} available.`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
