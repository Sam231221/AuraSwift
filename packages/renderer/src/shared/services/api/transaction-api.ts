/**
 * Transaction API Service
 * Abstraction layer for transaction-related API calls
 */

import type { APIResponse } from "@/shared/types/global";

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateTransactionData {
  shiftId: string;
  businessId: string;
  type: "sale" | "refund" | "void";
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "mixed";
  cashAmount?: number;
  cardAmount?: number;
  items: TransactionItem[];
  status: "completed" | "voided" | "pending";
  customerId?: string;
  receiptNumber: string;
  timestamp: string;
}

/**
 * Transaction API Service
 */
export const transactionAPI = {
  /**
   * Create a new transaction
   */
  create: async (
    transactionData: CreateTransactionData
  ): Promise<APIResponse> => {
    if (!window.transactionAPI) {
      throw new Error("Transaction API not available");
    }
    return window.transactionAPI.create(transactionData);
  },

  /**
   * Get transactions by shift ID
   */
  getByShift: async (shiftId: string): Promise<APIResponse> => {
    if (!window.transactionAPI) {
      throw new Error("Transaction API not available");
    }
    return window.transactionAPI.getByShift(shiftId);
  },
};

