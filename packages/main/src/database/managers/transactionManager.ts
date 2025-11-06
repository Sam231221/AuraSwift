import type { Transaction, TransactionItem } from "../models/transaction.js";

export class TransactionManager {
  private db: any;
  private uuid: any;

  constructor(db: any, uuid: any) {
    this.db = db;
    this.uuid = uuid;
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
}
