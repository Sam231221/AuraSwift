/**
 * Transaction API Types
 * 
 * Types for transaction operations.
 * 
 * @module types/api/transaction
 */

import type { APIResponse } from './common';

export interface TransactionAPI {
  create: (transactionData: {
    shiftId: string;
    businessId: string;
    type: 'sale' | 'refund' | 'void';
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'cash' | 'card' | 'mobile' | 'voucher' | 'split';
    cashAmount?: number;
    cardAmount?: number;
    items: Array<{
      productId: string;
      productName: string;
      itemType: 'UNIT' | 'WEIGHT';
      quantity?: number;
      weight?: number;
      unitOfMeasure?: string;
      unitPrice: number;
      totalPrice: number;
      taxAmount: number;
      batchId?: string;
      batchNumber?: string;
      expiryDate?: Date | string;
      ageRestrictionLevel?: 'NONE' | 'AGE_16' | 'AGE_18' | 'AGE_21';
      ageVerified?: boolean;
      cartItemId?: string;
    }>;
    status: 'completed' | 'voided' | 'pending';
    customerId?: string;
    receiptNumber: string;
    timestamp: string;
    cartSessionId?: string;
  }) => Promise<APIResponse>;

  getByShift: (shiftId: string) => Promise<APIResponse>;

  createFromCart: (data: {
    cartSessionId: string;
    shiftId: string;
    businessId: string;
    paymentMethod: 'cash' | 'card' | 'mobile' | 'voucher' | 'split';
    cashAmount?: number;
    cardAmount?: number;
    receiptNumber: string;
  }) => Promise<APIResponse>;
}
