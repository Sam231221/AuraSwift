export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: "cashier" | "manager" | "admin";
  businessId: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  address: string;
}

export interface Permission {
  action: string;
  resource: string;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  address?: string;
  phone?: string;
  vatNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  taxRate: number;
  sku: string;
  plu?: string;
  image?: string;
  category: string;
  stockLevel: number;
  minStockLevel: number;
  businessId: string;
  modifiers: Modifier[];
  isActive: boolean;
  // Weight-based product fields
  requiresWeight?: boolean;
  unit?: "lb" | "kg" | "oz" | "g" | "each";
  pricePerUnit?: number; // Price per weight unit (e.g., $1.99/lb)
  createdAt: string;
  updatedAt: string;
}

export interface Modifier {
  id: string;
  name: string;
  type: "single" | "multiple";
  options: ModifierOption[];
  required: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  type: "add" | "remove" | "sale" | "waste" | "adjustment";
  quantity: number;
  reason: string;
  userId: string;
  businessId: string;
  timestamp: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  description?: string;
  businessId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Discount {
  id: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed_amount" | "buy_x_get_y";
  value: number; // Percentage (0-100) or fixed amount
  businessId: string;
  // Applicability
  applicableTo: "all" | "category" | "product" | "transaction";
  categoryIds?: string[]; // For category-based discounts
  productIds?: string[]; // For product-specific discounts
  // Buy X Get Y specifics
  buyQuantity?: number; // Buy X items
  getQuantity?: number; // Get Y items
  getDiscountType?: "free" | "percentage" | "fixed"; // Discount on Y items
  getDiscountValue?: number; // Value of discount on Y items
  // Conditions
  minPurchaseAmount?: number; // Minimum transaction amount
  minQuantity?: number; // Minimum quantity required
  maxDiscountAmount?: number; // Cap on discount amount
  // Validity
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  // Usage tracking
  usageLimit?: number; // Maximum number of times this discount can be used
  usageCount: number; // Current usage count
  perCustomerLimit?: number; // Max uses per customer
  // Priority (higher number = higher priority when multiple discounts apply)
  priority: number;
  // Restrictions
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday), empty means all days
  timeStart?: string; // HH:MM format
  timeEnd?: string; // HH:MM format
  requiresCouponCode?: boolean;
  couponCode?: string;
  combinableWithOthers: boolean; // Can be combined with other discounts
  createdAt: string;
  updatedAt: string;
  createdBy: string; // userId
}

export interface AppliedDiscount {
  discountId: string;
  discountName: string;
  discountType: "percentage" | "fixed_amount" | "buy_x_get_y";
  discountValue: number;
  discountAmount: number; // Actual amount discounted
  appliedTo: "transaction" | "item"; // Where the discount was applied
  itemId?: string; // If applied to specific item
}

export interface Schedule {
  id: string;
  staffId: string;
  businessId: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  status: "upcoming" | "active" | "completed" | "missed";
  assignedRegister?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  scheduleId?: string; // Optional - may be unscheduled
  cashierId: string;
  businessId: string;
  startTime: string;
  endTime?: string;
  status: "active" | "ended";
  startingCash: number;
  finalCashDrawer?: number;
  expectedCashDrawer?: number;
  cashVariance?: number;
  totalSales?: number;
  totalTransactions?: number;
  totalRefunds?: number;
  totalVoids?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
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
  voidReason?: string;
  customerId?: string;
  receiptNumber: string;
  timestamp: string;
  createdAt: string;
  // Discount fields
  discountAmount?: number; // Total discount amount
  appliedDiscounts?: AppliedDiscount[]; // All discounts applied to this transaction
  // Refund-specific fields
  originalTransactionId?: string; // For refunds, links to original sale
  refundReason?: string; // Why the refund was processed
  refundMethod?: "original" | "store_credit" | "cash" | "card";
  managerApprovalId?: string; // Manager who approved the refund (if required)
  isPartialRefund?: boolean; // True if only some items were refunded
}

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  appliedModifiers?: AppliedModifier[];
  // Discount fields
  discountAmount?: number; // Discount amount for this item
  appliedDiscounts?: AppliedDiscount[]; // Discounts applied to this item
  // Refund support
  refundedQuantity?: number; // How many of this item have been refunded
  weight?: number; // For weight-based products
}

export interface RefundItem {
  originalItemId: string;
  productId: string;
  productName: string;
  originalQuantity: number;
  refundQuantity: number;
  unitPrice: number;
  refundAmount: number;
  reason: string;
  restockable: boolean; // Whether to return to inventory
}

export interface AppliedModifier {
  modifierId: string;
  modifierName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CashDrawerCount {
  id: string;
  shiftId: string;
  businessId: string;
  countType: "mid-shift" | "end-shift";
  expectedAmount: number;
  countedAmount: number;
  variance: number;
  notes?: string;
  countedBy: string; // userId
  timestamp: string;
  createdAt: string;
}

export interface ShiftReport {
  shift: Shift;
  schedule?: Schedule;
  transactions: Transaction[];
  cashDrawerCounts: CashDrawerCount[];
  totalSales: number;
  totalRefunds: number;
  totalVoids: number;
  cashVariance: number;
  attendanceVariance?: {
    plannedStart?: string;
    actualStart: string;
    plannedEnd?: string;
    actualEnd?: string;
    earlyMinutes?: number;
    lateMinutes?: number;
  };
}

export interface PrintJob {
  job_id: string;
  printer_name: string;
  document_path?: string;
  document_type: "pdf" | "image" | "text" | "raw";
  status:
    | "pending"
    | "queued"
    | "printing"
    | "completed"
    | "failed"
    | "cancelled"
    | "retrying";
  options?: string; // JSON string
  metadata?: string; // JSON string
  created_by?: string;
  business_id?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  last_retry_at?: string;
  retry_count: number;
  progress: number;
  pages_total?: number;
  pages_printed?: number;
  error?: string;
}

export interface PrintJobRetry {
  id: number;
  job_id: string;
  attempt: number;
  error: string;
  timestamp: string;
  next_retry_at: string;
}
