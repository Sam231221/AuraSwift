/**
 * Transaction Test Fixtures
 *
 * Factory functions for creating test transaction data.
 */

import { createMockProduct } from "./products.fixture";

// TODO: Replace with actual types from your codebase
// import type { Transaction, TransactionItem } from '@/types/domain/transaction';
type TransactionItem = {
  id: string;
  transactionId: string;
  productId: string;
  product?: any;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  discountType: "percentage" | "fixed" | null;
  tax: number;
  taxRate: number;
  total: number;
  notes: string | null;
  [key: string]: any;
};

type Transaction = {
  id: string;
  receiptNumber: string;
  status: "pending" | "completed" | "voided" | "refunded" | "failed";
  type: "sale" | "refund" | "void";
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  total: number;
  paymentMethod: "cash" | "card" | "contactless" | "mobile" | "account";
  amountPaid: number;
  changeDue: number;
  items: TransactionItem[];
  customerId: string | null;
  cashierId: string;
  terminalId: string;
  businessId: string;
  shiftId: string | null;
  notes: string | null;
  createdAt: Date;
  completedAt: Date | null;
  voidedAt: Date | null;
  refundedAt: Date | null;
  [key: string]: any;
};

/**
 * Create a single mock transaction item
 */
export function createMockTransactionItem(
  overrides?: Partial<TransactionItem>
): TransactionItem {
  const product = overrides?.product || createMockProduct();
  const quantity = overrides?.quantity ?? 1;
  const unitPrice = overrides?.unitPrice ?? product.price;

  return {
    id:
      overrides?.id ||
      `item-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    transactionId: overrides?.transactionId || "txn-test-1",
    productId: overrides?.productId || product.id,
    product,
    quantity,
    unitPrice,
    subtotal: overrides?.subtotal ?? quantity * unitPrice,
    discount: overrides?.discount ?? 0,
    discountType: overrides?.discountType || null,
    tax: overrides?.tax ?? quantity * unitPrice * 0.2, // 20% VAT
    taxRate: overrides?.taxRate ?? 20,
    total:
      overrides?.total ??
      quantity * unitPrice * 1.2 - (overrides?.discount ?? 0),
    notes: overrides?.notes || null,
    ...overrides,
  };
}

/**
 * Create multiple mock transaction items
 */
export function createMockTransactionItems(count: number): TransactionItem[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTransactionItem({
      id: `item-${i}`,
      quantity: i + 1,
    })
  );
}

/**
 * Create a single mock transaction
 */
export function createMockTransaction(
  overrides?: Partial<Transaction>
): Transaction {
  const items = overrides?.items || createMockTransactionItems(2);
  const subtotal =
    overrides?.subtotal ?? items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalTax =
    overrides?.totalTax ?? items.reduce((sum, item) => sum + item.tax, 0);
  const totalDiscount =
    overrides?.totalDiscount ??
    items.reduce((sum, item) => sum + item.discount, 0);
  const total = overrides?.total ?? subtotal + totalTax - totalDiscount;

  return {
    id:
      overrides?.id ||
      `txn-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    receiptNumber: overrides?.receiptNumber || `RCP-${Date.now()}`,
    status: overrides?.status || "completed",
    type: overrides?.type || "sale",
    subtotal,
    totalTax,
    totalDiscount,
    total,
    paymentMethod: overrides?.paymentMethod || "cash",
    amountPaid: overrides?.amountPaid ?? total,
    changeDue: overrides?.changeDue ?? 0,
    items,
    customerId: overrides?.customerId || null,
    cashierId: overrides?.cashierId || "cashier-test-1",
    terminalId: overrides?.terminalId || "terminal-test-1",
    businessId: overrides?.businessId || "business-test-1",
    shiftId: overrides?.shiftId || null,
    notes: overrides?.notes || null,
    createdAt: overrides?.createdAt || new Date(),
    completedAt: overrides?.completedAt || new Date(),
    voidedAt: overrides?.voidedAt || null,
    refundedAt: overrides?.refundedAt || null,
    ...overrides,
  };
}

/**
 * Create multiple mock transactions
 */
export function createMockTransactions(count: number): Transaction[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTransaction({
      id: `txn-${i}`,
      receiptNumber: `RCP-${1000 + i}`,
    })
  );
}

/**
 * Create a mock cash transaction
 */
export function createCashTransaction(
  overrides?: Partial<Transaction>
): Transaction {
  const total = overrides?.total ?? 50.0;
  const amountPaid = overrides?.amountPaid ?? 60.0;

  return createMockTransaction({
    paymentMethod: "cash",
    amountPaid,
    changeDue: amountPaid - total,
    ...overrides,
  });
}

/**
 * Create a mock card transaction
 */
export function createCardTransaction(
  overrides?: Partial<Transaction>
): Transaction {
  return createMockTransaction({
    paymentMethod: "card",
    changeDue: 0,
    cardDetails: {
      last4: "4242",
      brand: "visa",
      authCode: "AUTH123",
    },
    ...overrides,
  });
}

/**
 * Create a mock pending transaction
 */
export function createPendingTransaction(
  overrides?: Partial<Transaction>
): Transaction {
  return createMockTransaction({
    status: "pending",
    completedAt: null,
    ...overrides,
  });
}

/**
 * Create a mock voided transaction
 */
export function createVoidedTransaction(
  overrides?: Partial<Transaction>
): Transaction {
  return createMockTransaction({
    status: "voided",
    voidedAt: new Date(),
    voidReason: "Customer requested cancellation",
    ...overrides,
  });
}

/**
 * Create a mock refunded transaction
 */
export function createRefundedTransaction(
  overrides?: Partial<Transaction>
): Transaction {
  return createMockTransaction({
    status: "refunded",
    refundedAt: new Date(),
    refundReason: "Product defective",
    ...overrides,
  });
}

/**
 * Create a transaction with age-restricted items
 */
export function createAgeVerificationTransaction(
  overrides?: Partial<Transaction>
): Transaction {
  const ageRestrictedProduct = createMockProduct({
    requiresAgeVerification: true,
    ageRestriction: 18,
    name: "Age Restricted Item",
  });

  const items = [createMockTransactionItem({ product: ageRestrictedProduct })];

  return createMockTransaction({
    items,
    ageVerified: true,
    ageVerificationMethod: "id_scan",
    ...overrides,
  });
}

/**
 * Create a transaction with discounts
 */
export function createDiscountedTransaction(
  discountPercent: number = 10,
  overrides?: Partial<Transaction>
): Transaction {
  const items = createMockTransactionItems(2).map((item) => ({
    ...item,
    discount: item.subtotal * (discountPercent / 100),
    discountType: "percentage" as const,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const totalTax = items.reduce((sum, item) => sum + item.tax, 0);

  return createMockTransaction({
    items,
    subtotal,
    totalDiscount,
    totalTax,
    total: subtotal + totalTax - totalDiscount,
    ...overrides,
  });
}

/**
 * Transaction status constants
 */
export const TRANSACTION_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  VOIDED: "voided",
  REFUNDED: "refunded",
  FAILED: "failed",
} as const;

/**
 * Payment method constants
 */
export const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  CONTACTLESS: "contactless",
  MOBILE: "mobile",
  ACCOUNT: "account",
} as const;
