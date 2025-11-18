/**
 * Transaction API Service
 * Abstraction layer for transaction-related API calls
 */

import type { APIResponse } from "@/shared/types/global";

export interface TransactionItem {
  productId: string;
  productName: string;
  itemType: "UNIT" | "WEIGHT";
  quantity?: number;
  weight?: number;
  unitOfMeasure?: string;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  batchId?: string;
  batchNumber?: string;
  expiryDate?: Date | string;
  ageRestrictionLevel?: "NONE" | "AGE_16" | "AGE_18" | "AGE_21";
  ageVerified?: boolean;
  cartItemId?: string;
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

