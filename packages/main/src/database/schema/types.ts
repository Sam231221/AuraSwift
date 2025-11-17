// Re-export all table types
// Note: Using regular imports (not type-only) because we need the actual table objects for typeof inference
import { businesses, users, sessions } from "./auth.js";
import {
  vatCategories,
  categories,
  products,
} from "./products.js";
import {
  stockAdjustments,
  suppliers,
  productBatches,
  expirySettings,
  expiryNotifications,
  stockMovements,
} from "./inventory.js";
import { transactions, transactionItems } from "./transactions.js";
import { schedules, shifts, cashDrawerCounts } from "./shifts.js";
import {
  shiftValidationIssues,
  shiftValidations,
} from "./validation.js";
import { shiftReports, attendanceReports } from "./reports.js";
import { discounts } from "./discounts.js";
import { appSettings, auditLogs } from "./system.js";
import {
  clockEvents,
  timeShifts,
  breaks,
  timeCorrections,
} from "./time-tracking.js";
import { printJobs, printJobRetries } from "./printing.js";

// Auth types
export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// Product types
export type VatCategory = typeof vatCategories.$inferSelect;
export type NewVatCategory = typeof vatCategories.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// Inventory types
export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type NewStockAdjustment = typeof stockAdjustments.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

export type ProductBatch = typeof productBatches.$inferSelect;
export type NewProductBatch = typeof productBatches.$inferInsert;

export type ExpirySettings = typeof expirySettings.$inferSelect;
export type NewExpirySettings = typeof expirySettings.$inferInsert;

export type ExpiryNotification = typeof expiryNotifications.$inferSelect;
export type NewExpiryNotification = typeof expiryNotifications.$inferInsert;

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;

// Transaction types
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type TransactionItem = typeof transactionItems.$inferSelect;
export type NewTransactionItem = typeof transactionItems.$inferInsert;

// Shift types
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;

export type CashDrawerCount = typeof cashDrawerCounts.$inferSelect;
export type NewCashDrawerCount = typeof cashDrawerCounts.$inferInsert;

// Validation types
export type ShiftValidationIssue = typeof shiftValidationIssues.$inferSelect;
export type NewShiftValidationIssue =
  typeof shiftValidationIssues.$inferInsert;

export type ShiftValidation = typeof shiftValidations.$inferSelect;
export type NewShiftValidation = typeof shiftValidations.$inferInsert;

// Report types
export type ShiftReport = typeof shiftReports.$inferSelect;
export type NewShiftReport = typeof shiftReports.$inferInsert;

export type AttendanceReport = typeof attendanceReports.$inferSelect;
export type NewAttendanceReport = typeof attendanceReports.$inferInsert;

// Discount types
export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;

// System types
export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// Time tracking types
export type ClockEvent = typeof clockEvents.$inferSelect;
export type NewClockEvent = typeof clockEvents.$inferInsert;

export type TimeShift = typeof timeShifts.$inferSelect;
export type NewTimeShift = typeof timeShifts.$inferInsert;

export type Break = typeof breaks.$inferSelect;
export type NewBreak = typeof breaks.$inferInsert;

export type TimeCorrection = typeof timeCorrections.$inferSelect;
export type NewTimeCorrection = typeof timeCorrections.$inferInsert;

// Printing types
export type PrintJob = typeof printJobs.$inferSelect;
export type NewPrintJob = typeof printJobs.$inferInsert;

export type PrintJobRetry = typeof printJobRetries.$inferSelect;
export type NewPrintJobRetry = typeof printJobRetries.$inferInsert;

// Helper interfaces
export interface ShiftValidationWithIssues extends ShiftValidation {
  issues: ShiftValidationIssue[];
}

export interface ProductBatchWithProduct extends ProductBatch {
  product?: Product;
  supplier?: Supplier;
}

export interface ExpiryNotificationWithBatch extends ExpiryNotification {
  batch?: ProductBatch;
}

export interface ExpiryNotificationDetail {
  batchId: string;
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  currentQuantity: number;
  notificationType: "INFO" | "WARNING" | "CRITICAL" | "EXPIRED";
}

/**
 * 🔥 CRITICAL RELATIONSHIP: Product Stock Calculation
 *
 * When a product has requiresBatchTracking = true:
 *   product.stockLevel = SUM(productBatches.currentQuantity) WHERE status = 'ACTIVE'
 *
 * When selling items (OUTBOUND movement):
 *   1. Find all ACTIVE batches for the product, ordered by expiryDate ASC (FEFO)
 *   2. Deduct quantity from the oldest batch first
 *   3. Update batch.currentQuantity
 *   4. If batch.currentQuantity reaches 0, set status = 'SOLD_OUT'
 *   5. Recalculate product.stockLevel from batches
 *
 * When receiving stock (INBOUND movement):
 *   1. Check if batch with same expiryDate exists
 *   2. If yes, add to existing batch
 *   3. If no, create new batch
 *   4. Update batch.currentQuantity
 *   5. Recalculate product.stockLevel from batches
 *
 * Batch Status Auto-Update Rules:
 *   - EXPIRED: expiryDate < currentDate AND currentQuantity > 0
 *   - SOLD_OUT: currentQuantity = 0 AND expiryDate >= currentDate
 *   - ACTIVE: currentQuantity > 0 AND expiryDate >= currentDate
 *   - REMOVED: Manually set (for waste/damage)
 */
export interface ProductStockCalculation {
  productId: string;
  calculatedStock: number; // SUM of all ACTIVE batch quantities
  cachedStock: number; // products.stockLevel (should match calculatedStock)
  batchCount: number; // Number of ACTIVE batches
  batches: Array<{
    batchId: string;
    batchNumber: string;
    expiryDate: Date;
    currentQuantity: number;
    status: "ACTIVE" | "EXPIRED" | "SOLD_OUT" | "REMOVED";
  }>;
}

export interface ValidationResult {
  valid: boolean;
  requiresReview: boolean;
  issues: Array<{
    type: "violation" | "warning";
    code: string;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    category:
      | "attendance"
      | "cash_management"
      | "transactions"
      | "compliance"
      | "system";
    relatedEntityId?: string;
    relatedEntityType?: string;
    dataSnapshot?: any;
  }>;
}

