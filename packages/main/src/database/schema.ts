/**
 * Drizzle ORM Schema Definition for AuraSwift POS System
 *
 * This schema matches the existing SQLite database structure.
 * It provides type-safe queries and migrations using Drizzle ORM.
 *
 * @see /packages/main/src/database/docs/07_DRIZZLE_ORM_INTEGRATION.md
 */

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================
// BUSINESSES & USERS
// ============================================

export const businesses = sqliteTable("businesses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("ownerId").notNull(),
  address: text("address").default(""),
  phone: text("phone").default(""),
  vatNumber: text("vatNumber").default(""),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email"),
  password: text("password"),
  pin: text("pin").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  businessName: text("businessName").notNull(),
  role: text("role", { enum: ["cashier", "manager", "admin"] }).notNull(),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  permissions: text("permissions").notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  address: text("address").default(""),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  token: text("token").unique().notNull(),
  expiresAt: text("expiresAt").notNull(),
  createdAt: text("createdAt").notNull(),
});

// ============================================
// PRODUCTS & INVENTORY
// ============================================

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  parentId: text("parentId").references((): any => categories.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  sortOrder: integer("sortOrder").default(0),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  costPrice: real("costPrice").default(0),
  taxRate: real("taxRate").default(0),
  sku: text("sku").unique().notNull(),
  plu: text("plu").unique(),
  image: text("image"),
  category: text("category")
    .notNull()
    .references(() => categories.id),
  stockLevel: integer("stockLevel").default(0),
  minStockLevel: integer("minStockLevel").default(0),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  requiresWeight: integer("requiresWeight", { mode: "boolean" }).default(false),
  unit: text("unit").default("each"),
  pricePerUnit: real("pricePerUnit"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const modifiers = sqliteTable("modifiers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["single", "multiple"] }).notNull(),
  required: integer("required", { mode: "boolean" }).default(false),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const modifierOptions = sqliteTable("modifier_options", {
  id: text("id").primaryKey(),
  modifierId: text("modifierId")
    .notNull()
    .references(() => modifiers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: real("price").default(0),
  createdAt: text("createdAt").notNull(),
});

export const productModifiers = sqliteTable("product_modifiers", {
  productId: text("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  modifierId: text("modifierId")
    .notNull()
    .references(() => modifiers.id, { onDelete: "cascade" }),
});

export const stockAdjustments = sqliteTable("stock_adjustments", {
  id: text("id").primaryKey(),
  productId: text("productId")
    .notNull()
    .references(() => products.id),
  type: text("type", {
    enum: ["add", "remove", "sale", "waste", "adjustment"],
  }).notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  timestamp: text("timestamp").notNull(),
});

export const suppliers = sqliteTable("suppliers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contactPerson"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  taxId: text("taxId"),
  paymentTerms: text("paymentTerms"),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  notes: text("notes"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

// ============================================
// OPERATIONS
// ============================================

export const schedules = sqliteTable("schedules", {
  id: text("id").primaryKey(),
  staffId: text("staffId")
    .notNull()
    .references(() => users.id),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  startTime: text("startTime").notNull(),
  endTime: text("endTime").notNull(),
  status: text("status", {
    enum: ["upcoming", "active", "completed", "missed"],
  }).notNull(),
  assignedRegister: text("assignedRegister"),
  notes: text("notes"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const shifts = sqliteTable("shifts", {
  id: text("id").primaryKey(),
  scheduleId: text("scheduleId").references(() => schedules.id),
  cashierId: text("cashierId")
    .notNull()
    .references(() => users.id),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  startTime: text("startTime").notNull(),
  endTime: text("endTime"),
  status: text("status", { enum: ["active", "ended"] }).notNull(),
  startingCash: real("startingCash").notNull(),
  finalCashDrawer: real("finalCashDrawer"),
  expectedCashDrawer: real("expectedCashDrawer"),
  cashVariance: real("cashVariance"),
  totalSales: real("totalSales").default(0),
  totalTransactions: integer("totalTransactions").default(0),
  totalRefunds: real("totalRefunds").default(0),
  totalVoids: real("totalVoids").default(0),
  notes: text("notes"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  shiftId: text("shiftId")
    .notNull()
    .references(() => shifts.id),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  type: text("type", { enum: ["sale", "refund", "void"] }).notNull(),
  subtotal: real("subtotal").notNull(),
  tax: real("tax").notNull(),
  total: real("total").notNull(),
  paymentMethod: text("paymentMethod", {
    enum: ["cash", "card", "mixed"],
  }).notNull(),
  cashAmount: real("cashAmount"),
  cardAmount: real("cardAmount"),
  status: text("status", {
    enum: ["completed", "voided", "pending"],
  }).notNull(),
  voidReason: text("voidReason"),
  customerId: text("customerId"),
  receiptNumber: text("receiptNumber").notNull(),
  timestamp: text("timestamp").notNull(),
  createdAt: text("createdAt").notNull(),
  originalTransactionId: text("originalTransactionId").references(
    (): any => transactions.id
  ),
  refundReason: text("refundReason"),
  refundMethod: text("refundMethod", {
    enum: ["original", "store_credit", "cash", "card"],
  }),
  managerApprovalId: text("managerApprovalId").references(() => users.id),
  isPartialRefund: integer("isPartialRefund", { mode: "boolean" }).default(
    false
  ),
  discountAmount: real("discountAmount").default(0),
  appliedDiscounts: text("appliedDiscounts"),
});

export const transactionItems = sqliteTable("transaction_items", {
  id: text("id").primaryKey(),
  transactionId: text("transactionId")
    .notNull()
    .references(() => transactions.id),
  productId: text("productId")
    .notNull()
    .references(() => products.id),
  productName: text("productName").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unitPrice").notNull(),
  totalPrice: real("totalPrice").notNull(),
  refundedQuantity: integer("refundedQuantity").default(0),
  weight: real("weight"),
  discountAmount: real("discountAmount").default(0),
  appliedDiscounts: text("appliedDiscounts"),
  createdAt: text("createdAt").notNull(),
});

export const appliedModifiers = sqliteTable("applied_modifiers", {
  id: text("id").primaryKey(),
  transactionItemId: text("transactionItemId")
    .notNull()
    .references(() => transactionItems.id),
  modifierId: text("modifierId")
    .notNull()
    .references(() => modifiers.id),
  modifierName: text("modifierName").notNull(),
  optionId: text("optionId").notNull(),
  optionName: text("optionName").notNull(),
  price: real("price").notNull(),
  createdAt: text("createdAt").notNull(),
});

export const cashDrawerCounts = sqliteTable("cash_drawer_counts", {
  id: text("id").primaryKey(),
  shiftId: text("shiftId")
    .notNull()
    .references(() => shifts.id),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  countType: text("countType", { enum: ["mid-shift", "end-shift"] }).notNull(),
  expectedAmount: real("expectedAmount").notNull(),
  countedAmount: real("countedAmount").notNull(),
  variance: real("variance").notNull(),
  notes: text("notes"),
  countedBy: text("countedBy")
    .notNull()
    .references(() => users.id),
  timestamp: text("timestamp").notNull(),
  createdAt: text("createdAt").notNull(),
});

// ============================================
// DISCOUNTS & PROMOTIONS
// ============================================

export const discounts = sqliteTable("discounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", {
    enum: ["percentage", "fixed_amount", "buy_x_get_y"],
  }).notNull(),
  value: real("value").notNull(),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  applicableTo: text("applicableTo", {
    enum: ["all", "category", "product", "transaction"],
  }).notNull(),
  categoryIds: text("categoryIds"),
  productIds: text("productIds"),
  buyQuantity: integer("buyQuantity"),
  getQuantity: integer("getQuantity"),
  getDiscountType: text("getDiscountType", {
    enum: ["free", "percentage", "fixed"],
  }),
  getDiscountValue: real("getDiscountValue"),
  minPurchaseAmount: real("minPurchaseAmount"),
  minQuantity: integer("minQuantity"),
  maxDiscountAmount: real("maxDiscountAmount"),
  startDate: text("startDate"),
  endDate: text("endDate"),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  usageLimit: integer("usageLimit"),
  usageCount: integer("usageCount").default(0),
  perCustomerLimit: integer("perCustomerLimit"),
  priority: integer("priority").default(0),
  daysOfWeek: text("daysOfWeek"),
  timeStart: text("timeStart"),
  timeEnd: text("timeEnd"),
  requiresCouponCode: integer("requiresCouponCode", {
    mode: "boolean",
  }).default(false),
  couponCode: text("couponCode"),
  combinableWithOthers: integer("combinableWithOthers", {
    mode: "boolean",
  }).default(true),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  createdBy: text("createdBy")
    .notNull()
    .references(() => users.id),
});

// ============================================
// SYSTEM
// ============================================

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resourceId").notNull(),
  details: text("details"),
  timestamp: text("timestamp").notNull(),
  createdAt: text("createdAt").notNull(),
});

export const printJobs = sqliteTable("print_jobs", {
  jobId: text("job_id").primaryKey(),
  printerName: text("printer_name").notNull(),
  documentPath: text("document_path"),
  documentType: text("document_type", {
    enum: ["pdf", "image", "text", "raw"],
  }).notNull(),
  status: text("status", {
    enum: [
      "pending",
      "queued",
      "printing",
      "completed",
      "failed",
      "cancelled",
      "retrying",
    ],
  }).notNull(),
  options: text("options"),
  metadata: text("metadata"),
  createdBy: text("created_by").references(() => users.id),
  businessId: text("business_id").references(() => businesses.id),
  createdAt: text("created_at").notNull(),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  lastRetryAt: text("last_retry_at"),
  retryCount: integer("retry_count").default(0),
  progress: integer("progress").default(0),
  pagesTotal: integer("pages_total"),
  pagesPrinted: integer("pages_printed"),
  error: text("error"),
});

export const printJobRetries = sqliteTable("print_job_retries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id")
    .notNull()
    .references(() => printJobs.jobId, { onDelete: "cascade" }),
  attempt: integer("attempt").notNull(),
  error: text("error").notNull(),
  timestamp: text("timestamp").notNull(),
  nextRetryAt: text("next_retry_at").notNull(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Modifier = typeof modifiers.$inferSelect;
export type NewModifier = typeof modifiers.$inferInsert;

export type ModifierOption = typeof modifierOptions.$inferSelect;
export type NewModifierOption = typeof modifierOptions.$inferInsert;

export type ProductModifier = typeof productModifiers.$inferSelect;
export type NewProductModifier = typeof productModifiers.$inferInsert;

export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type NewStockAdjustment = typeof stockAdjustments.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type TransactionItem = typeof transactionItems.$inferSelect;
export type NewTransactionItem = typeof transactionItems.$inferInsert;

export type AppliedModifier = typeof appliedModifiers.$inferSelect;
export type NewAppliedModifier = typeof appliedModifiers.$inferInsert;

export type CashDrawerCount = typeof cashDrawerCounts.$inferSelect;
export type NewCashDrawerCount = typeof cashDrawerCounts.$inferInsert;

export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;

export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type PrintJob = typeof printJobs.$inferSelect;
export type NewPrintJob = typeof printJobs.$inferInsert;

export type PrintJobRetry = typeof printJobRetries.$inferSelect;
export type NewPrintJobRetry = typeof printJobRetries.$inferInsert;
