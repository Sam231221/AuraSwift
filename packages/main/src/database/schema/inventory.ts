import { text, integer, real, unique } from "drizzle-orm/sqlite-core";
import { createTable, timestampColumns, index } from "./common.js";
import { businesses } from "./auth.js";
import { users } from "./auth.js";
import { products } from "./products.js";

export const stockAdjustments = createTable("stock_adjustments", {
  id: text("id").primaryKey(),
  productId: text("productId")
    .notNull()
    .references(() => products.id),
  type: text("type", {
    enum: ["add", "remove", "sale", "waste", "adjustment"],
  }).notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  note: text("note"),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  timestamp: text("timestamp").notNull(),
});

// Suppliers table for traceability
export const suppliers = createTable(
  "suppliers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    ...timestampColumns,
  },
  (table) => [
    index("suppliers_business_idx").on(table.businessId),
    index("suppliers_name_idx").on(table.name),
  ]
);

// Product Batches/Lot Tracking (Core Table)
// 🔥 KEY RELATIONSHIP: Product Stock = SUM(currentQuantity) of all ACTIVE batches
// When selling, system should deduct from batches following FEFO (First-Expiry-First-Out)
export const productBatches = createTable(
  "product_batches",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    batchNumber: text("batch_number").notNull(), // Supplier batch number or auto-generated
    manufacturingDate: integer("manufacturing_date", { mode: "timestamp_ms" }),
    expiryDate: integer("expiry_date", { mode: "timestamp_ms" }).notNull(),

    // Stock tracking per batch
    // ⚠️ CONSTRAINT: currentQuantity should never be negative
    // ⚠️ CONSTRAINT: currentQuantity <= initialQuantity (unless batch transfer occurred)
    initialQuantity: real("initial_quantity").notNull(),
    currentQuantity: real("current_quantity").notNull(),

    // Supplier information
    supplierId: text("supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    purchaseOrderNumber: text("purchase_order_number"),
    costPrice: real("cost_price"), // Batch-specific cost

    // Status
    // ACTIVE: Batch has stock and hasn't expired
    // EXPIRED: Expiry date has passed (auto-updated by system)
    // SOLD_OUT: currentQuantity reached 0 (auto-updated by system)
    // REMOVED: Manually removed/wasted
    status: text("status", {
      enum: ["ACTIVE", "EXPIRED", "SOLD_OUT", "REMOVED"],
    })
      .notNull()
      .default("ACTIVE"),

    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),

    ...timestampColumns,
  },
  (table) => [
    index("batches_product_idx").on(table.productId),
    index("batches_expiry_idx").on(table.expiryDate),
    index("batches_status_idx").on(table.status),
    index("batches_business_idx").on(table.businessId),
    index("batches_number_idx").on(table.batchNumber),
    index("batches_supplier_idx").on(table.supplierId),
    // 🔥 CRITICAL: Composite index for FEFO queries (find oldest active batches first)
    // Used for: SELECT * FROM product_batches WHERE productId = ? AND status = 'ACTIVE' ORDER BY expiryDate ASC
    index("batches_product_status_expiry_idx").on(
      table.productId,
      table.status,
      table.expiryDate
    ),
    // Composite index for finding batches expiring soon (for notifications)
    index("batches_business_status_expiry_idx").on(
      table.businessId,
      table.status,
      table.expiryDate
    ),
    // Composite index for stock calculation queries (SUM currentQuantity by product)
    index("batches_product_status_quantity_idx").on(
      table.productId,
      table.status,
      table.currentQuantity
    ),
    // Ensure batch number is unique per product and business
    unique("batch_number_product_business_unique").on(
      table.batchNumber,
      table.productId,
      table.businessId
    ),
  ]
);

// Expiry Notification Settings
export const expirySettings = createTable(
  "expiry_settings",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),

    // Notification thresholds (in days)
    criticalAlertDays: integer("critical_alert_days").notNull().default(3),
    warningAlertDays: integer("warning_alert_days").notNull().default(7),
    infoAlertDays: integer("info_alert_days").notNull().default(14),

    // Notification channels
    notifyViaEmail: integer("notify_via_email", { mode: "boolean" }).default(
      true
    ),
    notifyViaPush: integer("notify_via_push", { mode: "boolean" }).default(
      true
    ),
    notifyViaDashboard: integer("notify_via_dashboard", {
      mode: "boolean",
    }).default(true),

    // Auto-actions
    autoDisableExpired: integer("auto_disable_expired", {
      mode: "boolean",
    }).default(true),
    allowSellNearExpiry: integer("allow_sell_near_expiry", {
      mode: "boolean",
    }).default(false),
    nearExpiryThreshold: integer("near_expiry_threshold").default(2), // days

    // Recipients (JSON array of user IDs or roles)
    notificationRecipients: text("notification_recipients", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),

    ...timestampColumns,
  },
  (table) => [
    index("expiry_settings_business_idx").on(table.businessId),
    // Ensure one settings record per business
    unique("expiry_settings_business_unique").on(table.businessId),
  ]
);

// Expiry Notifications Log
export const expiryNotifications = createTable(
  "expiry_notifications",
  {
    id: text("id").primaryKey(),
    productBatchId: text("product_batch_id")
      .notNull()
      .references(() => productBatches.id, { onDelete: "cascade" }),

    // Notification details
    notificationType: text("notification_type", {
      enum: ["INFO", "WARNING", "CRITICAL", "EXPIRED"],
    }).notNull(),
    daysUntilExpiry: integer("days_until_expiry").notNull(),
    message: text("message").notNull(),

    // Delivery status
    status: text("status", {
      enum: ["PENDING", "SENT", "DELIVERED", "FAILED", "ACKNOWLEDGED"],
    })
      .notNull()
      .default("PENDING"),

    // Channels attempted
    channels: text("channels", { mode: "json" })
      .$type<Array<"EMAIL" | "PUSH" | "DASHBOARD">>()
      .notNull()
      .default([]),

    // Acknowledgment
    acknowledgedBy: text("acknowledged_by").references(() => users.id),
    acknowledgedAt: integer("acknowledged_at", { mode: "timestamp_ms" }),

    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),

    scheduledFor: integer("scheduled_for", { mode: "timestamp_ms" }).notNull(),
    sentAt: integer("sent_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [
    index("notifications_batch_idx").on(table.productBatchId),
    index("notifications_status_idx").on(table.status),
    index("notifications_scheduled_idx").on(table.scheduledFor),
    index("notifications_business_idx").on(table.businessId),
    index("notifications_type_idx").on(table.notificationType),
  ]
);

// Stock Movements with Batch Tracking
// 🔥 IMPORTANT: All stock movements should update batch.currentQuantity accordingly
// OUTBOUND movements should follow FEFO (deduct from oldest batch first)
export const stockMovements = createTable(
  "stock_movements",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // batchId: The primary batch affected by this movement
    // For OUTBOUND: batchId is the batch being deducted from
    // For INBOUND: batchId is the batch being added to (or null if creating new batch)
    batchId: text("batch_id").references(() => productBatches.id, {
      onDelete: "set null",
    }),
    movementType: text("movement_type", {
      enum: ["INBOUND", "OUTBOUND", "ADJUSTMENT", "TRANSFER", "WASTE"],
    }).notNull(),
    // ⚠️ For OUTBOUND/WASTE: quantity should be positive (system will subtract)
    // ⚠️ For INBOUND: quantity should be positive (system will add)
    quantity: real("quantity").notNull(),
    reason: text("reason"),
    reference: text("reference"), // Sale ID, PO number, transaction ID, etc.

    // Batch-specific movement (for transfers between batches)
    fromBatchId: text("from_batch_id").references(() => productBatches.id, {
      onDelete: "set null",
    }),
    toBatchId: text("to_batch_id").references(() => productBatches.id, {
      onDelete: "set null",
    }),

    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),

    timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull(),
    ...timestampColumns,
  },
  (table) => [
    index("movements_product_idx").on(table.productId),
    index("movements_batch_idx").on(table.batchId),
    index("movements_timestamp_idx").on(table.timestamp),
    index("movements_type_idx").on(table.movementType),
    index("movements_business_idx").on(table.businessId),
    // Composite index for batch movement history queries
    index("movements_batch_timestamp_idx").on(table.batchId, table.timestamp),
    // Composite index for product movement history queries
    index("movements_product_timestamp_idx").on(
      table.productId,
      table.timestamp
    ),
    // Index for reference lookups (e.g., find movements for a specific sale)
    index("movements_reference_idx").on(table.reference),
  ]
);
