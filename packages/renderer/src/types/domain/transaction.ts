/**
 * Transaction Domain Types
 * 
 * @module types/domain/transaction
 */

import type { PaymentMethod } from './payment';

export type TransactionType = 'sale' | 'refund' | 'void';
export type TransactionStatus = 'completed' | 'voided' | 'pending';
export type ItemType = 'UNIT' | 'WEIGHT';

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId?: string;
  categoryId?: string;
  productName: string;
  itemType: ItemType;
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
  createdAt?: string;
}

export interface Transaction {
  id: string;
  shiftId: string;
  businessId: string;
  type: TransactionType;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string; // Main payment method type
  cashAmount?: number;
  cardAmount?: number;
  status: TransactionStatus;
  customerId?: string;
  receiptNumber: string;
  timestamp: string;
  cartSessionId?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Relations (populated when fetched with relations)
  items?: TransactionItem[];
  paymentMethods?: PaymentMethod[];
}

/**
 * Customer information for receipts
 */
export interface CustomerInfo {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * Transaction data for receipts/printing
 */
export interface TransactionData {
  id: string;
  timestamp: Date;
  cashierId: string;
  cashierName: string;
  businessId: string;
  businessName: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethods: PaymentMethod[];
  receiptNumber: string;
  customerInfo?: CustomerInfo;
  notes?: string;
  refundedAmount?: number;
  isRefund?: boolean;
  originalTransactionId?: string;
}
