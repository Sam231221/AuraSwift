import { text, integer, real } from "drizzle-orm/sqlite-core";
import { createTable, timestampColumns } from "./common.js";
import { businesses } from "./auth.js";
import { users } from "./auth.js";
import { products } from "./products.js";
import { shifts } from "./shifts.js";

export const transactions = createTable("transactions", {
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
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
  originalTransactionId: text("originalTransactionId").references(
    () => transactions.id
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

export const transactionItems = createTable("transaction_items", {
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
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
});

