import {
  text,
  integer,
  unique,
  real,
  sqliteTableCreator,
  SQLiteColumn,
  SQLiteTableWithColumns,
} from "drizzle-orm/sqlite-core";
import { index as drizzleIndex } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
// Permission type: update this if you add/remove permissions in the schema
export type Permission =
  | "read:sales"
  | "write:sales"
  | "read:reports"
  | "manage:inventory"
  | "manage:users"
  | "view:analytics"
  | "override:transactions"
  | "manage:settings";

export const timestampColumns = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
};

export const commonColumns = {
  // Internal ID for relationships (fast)
  id: integer("id", { mode: "number" })
    .primaryKey({ autoIncrement: true })
    .notNull(),

  // External ID for APIs, security (safe)
  publicId: text("public_id")
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),

  businessId: text("business_id").notNull(),
  // ... timestamp columns
};

export const createTable = sqliteTableCreator((name) => name);

// ============================================
// BUSINESSES & USERS
// ============================================

export const businesses = createTable("businesses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("ownerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), // or "restrict"

  // Contact Information
  email: text("email").default(""),
  phone: text("phone").default(""),
  website: text("website").default(""),

  // Location
  address: text("address").default(""),
  country: text("country").notNull().default(""),
  city: text("city").notNull().default(""),
  postalCode: text("postalCode").default(""),

  // Business Identity
  vatNumber: text("vatNumber").unique().default(""),
  businessType: text("businessType", {
    enum: ["retail", "restaurant", "service", "wholesale", "other"],
  })
    .notNull()
    .default("retail"),
  currency: text("currency").notNull().default("USD"),
  timezone: text("timezone").notNull().default("UTC"),

  // Status & Metadata
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  ...timestampColumns,
});

export const users = createTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  pinHash: text("pin_hash").notNull(),
  salt: text("salt").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  businessName: text("businessName").notNull(),
  role: text("role", {
    enum: ["cashier", "supervisor", "manager", "admin", "owner"],
  }).notNull(),
  businessId: text("businessId")
    .notNull()
    .references((): any => businesses.id, { onDelete: "cascade" }),
  permissions: text("permissions", { mode: "json" })
    .$type<Permission[]>()
    .notNull(),

  lastLoginAt: integer("lastLoginAt", { mode: "timestamp_ms" }),
  isActive: integer("isActive", { mode: "boolean" }).default(true),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
  address: text("address").default(""),
  ...timestampColumns,
});

export const sessions = createTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  token: text("token").unique().notNull(),
  expiresAt: text("expiresAt").notNull(),
  ...timestampColumns,
});

// ============================================
// PRODUCTS & INVENTORY
// ============================================

export const vatCategories = createTable(
  "vat_categories",
  {
    id: text("id").primaryKey(), // Use text/UUID for consistency
    name: text("name").notNull(), // e.g. "Standard", "Reduced", "Zero"
    ratePercent: real("rate_percent").notNull(), // e.g. 20.00
    code: text("code").notNull(), // Should not be nullable  // e.g. "STD", "RED"
    description: text("description"), // Add description
    businessId: text("business_id") // 🔥 CRITICAL: Add business reference
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    isDefault: integer("is_default", { mode: "boolean" }).default(false),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    ...timestampColumns,
  },
  (table) => [
    index("vat_business_idx").on(table.businessId),
    index("vat_code_idx").on(table.code),
  ]
);
export const categories = createTable(
  "categories",
  {
    id: text("id").primaryKey(), // Consistent ID type
    name: text("name").notNull(),
    parentId: text("parent_id").references((): any => categories.id, {
      // Fixed type
      onDelete: "set null",
    }),
    description: text("description"),
    vatCategoryId: text("vat_category_id").references(
      // Fixed type
      () => vatCategories.id,
      { onDelete: "set null" }
    ),
    // (e.g. 0, 5, 20) or null
    vatOverridePercent: real("vat_override_percent"),
    businessId: text("business_id") // 🔥 CRITICAL: Add business reference
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0),
    color: text("color"), // For UI organization
    image: text("image"), // Category images
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    ...timestampColumns,
  },
  (table) => [
    index("categories_business_idx").on(table.businessId),
    index("categories_parent_idx").on(table.parentId),
    index("categories_vat_idx").on(table.vatCategoryId),
    // Ensure category names are unique within a business
    unique("category_name_business_unique").on(table.name, table.businessId),
  ]
);

export const products = createTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),

    // 🔥 PRICING STRUCTURE - Clarify the confusion
    basePrice: real("base_price").notNull(), // Standard price
    costPrice: real("cost_price").default(0),

    // Identifiers
    sku: text("sku").notNull(),
    barcode: text("barcode"), // More standard than PLU
    plu: text("plu"), // For scale integration

    // Media
    image: text("image"),

    // Classification
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),

    // 🔥 PRODUCT TYPE SYSTEM - Simplified
    productType: text("product_type", {
      enum: ["STANDARD", "WEIGHTED", "GENERIC"],
    })
      .notNull()
      .default("STANDARD"),

    // Unit configuration
    salesUnit: text("sales_unit", {
      enum: ["PIECE", "KG", "GRAM", "LITRE", "ML", "PACK"],
    })
      .notNull()
      .default("PIECE"),

    // Scale integration
    usesScale: integer("uses_scale", { mode: "boolean" }).default(false),
    pricePerKg: real("price_per_kg"), // Specific to weighted items

    // Generic item behavior
    isGenericButton: integer("is_generic_button", { mode: "boolean" }).default(
      false
    ),
    genericDefaultPrice: real("generic_default_price"), // Suggested price for generic items

    // Inventory
    trackInventory: integer("track_inventory", { mode: "boolean" }).default(
      true
    ),
    stockLevel: real("stock_level").default(0), // Use real for weighted items
    minStockLevel: real("min_stock_level").default(0),
    reorderPoint: real("reorder_point").default(0),

    // VAT
    vatCategoryId: text("vat_category_id").references(() => vatCategories.id, {
      onDelete: "set null",
    }),

    // (e.g. 0, 5, 20) or null
    vatOverridePercent: real("vat_override_percent"),
    // Business
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),

    // Settings
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    allowPriceOverride: integer("allow_price_override", {
      mode: "boolean",
    }).default(false),
    allowDiscount: integer("allow_discount", { mode: "boolean" }).default(true),

    // Timestamps
    ...timestampColumns,
  },
  (table) => [
    index("products_business_idx").on(table.businessId),
    index("products_category_idx").on(table.categoryId),
    index("products_sku_idx").on(table.sku),
    index("products_barcode_idx").on(table.barcode),
    index("products_plu_idx").on(table.plu),
    index("products_type_idx").on(table.productType),
    // Ensure SKU is unique per business
    unique("product_sku_business_unique").on(table.sku, table.businessId),
  ]
);
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

// ============================================
// OPERATIONS
// ============================================

export const schedules = createTable("schedules", {
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
  ...timestampColumns,
});

export const shifts = createTable("shifts", {
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
  ...timestampColumns,
});

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

export const cashDrawerCounts = createTable(
  "cash_drawer_counts",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").notNull(),
    createdAt: text("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => sql`CURRENT_TIMESTAMP`),

    shiftId: text("shift_id").notNull(),
    countType: text("count_type", {
      enum: ["mid-shift", "end-shift"],
    }).notNull(),
    expectedAmount: real("expected_amount").notNull(),
    countedAmount: real("counted_amount").notNull(),
    variance: real("variance").notNull(),
    notes: text("notes"),
    countedBy: text("counted_by").notNull(), // userId
    timestamp: text("timestamp").notNull(), // ISO string
  },
  (table) => [
    // Index for frequent queries
    drizzleIndex("cash_drawer_counts_shift_idx").on(table.shiftId),
    drizzleIndex("cash_drawer_counts_business_idx").on(table.businessId),
    drizzleIndex("cash_drawer_counts_timestamp_idx").on(table.timestamp),
    drizzleIndex("cash_drawer_counts_counted_by_idx").on(table.countedBy),

    // Ensure only one end-shift count per shift
    unique("cash_drawer_counts_shift_type_unique").on(
      table.shiftId,
      table.countType
    ),
  ]
);

// Define standard validation issue codes for consistency
export const VALIDATION_ISSUE_CODES = {
  // Attendance issues
  LATE_CLOCK_IN: "LATE_CLOCK_IN",
  MISSED_CLOCK_OUT: "MISSED_CLOCK_OUT",
  SHIFT_OVERLAP: "SHIFT_OVERLAP",

  // Cash management issues
  CASH_VARIANCE_HIGH: "CASH_VARIANCE_HIGH",
  MISSING_END_SHIFT_COUNT: "MISSING_END_SHIFT_COUNT",
  MULTIPLE_END_SHIFT_COUNTS: "MULTIPLE_END_SHIFT_COUNTS",

  // Transaction issues
  VOIDED_TRANSACTION_NO_REASON: "VOIDED_TRANSACTION_NO_REASON",
  REFUND_WITHOUT_APPROVAL: "REFUND_WITHOUT_APPROVAL",
  SUSPICIOUS_DISCOUNT: "SUSPICIOUS_DISCOUNT",

  // Compliance issues
  MISSING_BREAK: "MISSING_BREAK",
  EXCESSIVE_OVERTIME: "EXCESSIVE_OVERTIME",
} as const;

export const shiftValidationIssues = createTable(
  "shift_validation_issues",
  {
    ...commonColumns,

    validationId: text("validation_id").notNull(),
    type: text("type", { enum: ["violation", "warning"] }).notNull(),
    message: text("message").notNull(),
    code: text("code").notNull(), // Machine-readable error code for programmatic handling
    severity: text("severity", {
      enum: ["low", "medium", "high", "critical"],
    }).default("medium"),

    // Additional context for the issue
    category: text("category", {
      enum: [
        "attendance",
        "cash_management",
        "transactions",
        "compliance",
        "system",
      ],
    }).notNull(),

    // Resolution tracking
    resolved: integer("resolved", { mode: "boolean" }).default(false),
    resolvedAt: text("resolved_at"),
    resolvedBy: text("resolved_by"), // userId
    resolutionNotes: text("resolution_notes"),

    // Additional metadata for debugging/fixing
    relatedEntityId: text("related_entity_id"), // e.g., transactionId, userId, etc.
    relatedEntityType: text("related_entity_type"), // e.g., 'transaction', 'user', 'cash_drawer_count'
    dataSnapshot: text("data_snapshot"), // JSON snapshot of relevant data at time of validation
  },
  (table) => [
    unique("validation_issues_public_id_unique").on(table.publicId),
    drizzleIndex("validation_issues_validation_idx").on(table.validationId),
    drizzleIndex("validation_issues_type_idx").on(table.type),
    drizzleIndex("validation_issues_severity_idx").on(table.severity),
    drizzleIndex("validation_issues_category_idx").on(table.category),
    drizzleIndex("validation_issues_resolved_idx").on(table.resolved),
    drizzleIndex("validation_issues_business_idx").on(table.businessId),
    drizzleIndex("validation_issues_related_entity_idx").on(
      table.relatedEntityType,
      table.relatedEntityId
    ),

    // Composite index for common query patterns
    drizzleIndex("validation_issues_status_severity_idx").on(
      table.resolved,
      table.severity
    ),
  ]
);

export const shiftValidations = createTable(
  "shift_validations",
  {
    ...commonColumns,

    shiftId: text("shift_id").notNull(),
    valid: integer("valid", { mode: "boolean" }).notNull(),
    requiresReview: integer("requires_review", { mode: "boolean" }).notNull(),

    // Computed aggregates for quick access
    violationCount: integer("violation_count").notNull().default(0),
    warningCount: integer("warning_count").notNull().default(0),
    criticalIssueCount: integer("critical_issue_count").notNull().default(0),
    unresolvedIssueCount: integer("unresolved_issue_count")
      .notNull()
      .default(0),

    // Validation metadata
    validatedAt: text("validated_at"),
    validatedBy: text("validated_by"), // userId
    validationMethod: text("validation_method", {
      enum: ["auto", "manual"],
    }).default("auto"),

    // Resolution tracking
    resolution: text("resolution", {
      enum: ["approved", "rejected", "pending", "needs_review"],
    }).default("pending"),
    resolvedAt: text("resolved_at"),
    resolvedBy: text("resolved_by"), // userId
    resolutionNotes: text("resolution_notes"),
  },
  (table) => [
    unique("shift_validations_public_id_unique").on(table.publicId),
    drizzleIndex("shift_validations_shift_idx").on(table.shiftId),
    drizzleIndex("shift_validations_business_idx").on(table.businessId),
    drizzleIndex("shift_validations_valid_idx").on(table.valid),
    drizzleIndex("shift_validations_requires_review_idx").on(
      table.requiresReview
    ),
    drizzleIndex("shift_validations_resolution_idx").on(table.resolution),
    drizzleIndex("shift_validations_unresolved_count_idx").on(
      table.unresolvedIssueCount
    ),

    // One validation record per shift
    unique("shift_validations_shift_unique").on(table.shiftId),
  ]
);
export const shiftValidationsRelations = relations(
  shiftValidations,
  ({ one, many }) => ({
    issues: many(shiftValidationIssues),
    shiftReport: one(shiftReports, {
      fields: [shiftValidations.shiftId],
      references: [shiftReports.shiftId],
    }),
    // Reference to shifts table if you have one
    // shift: one(shifts, { fields: [shiftValidations.shiftId], references: [shifts.id] }),
  })
);

export const shiftValidationIssuesRelations = relations(
  shiftValidationIssues,
  ({ one }) => ({
    validation: one(shiftValidations, {
      fields: [shiftValidationIssues.validationId],
      references: [shiftValidations.id],
    }),
  })
);

// Shift Report View - Materialized or computed
export const shiftReports = sqliteTableCreator((name) => `pos_${name}`)(
  "shift_reports",
  {
    id: text("id").primaryKey(), // shiftId or generated ID
    businessId: text("business_id").notNull(),
    shiftId: text("shift_id").notNull(),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),

    // Sales metrics
    totalSales: real("total_sales").notNull().default(0),
    totalRefunds: real("total_refunds").notNull().default(0),
    totalVoids: real("total_voids").notNull().default(0),
    netSales: real("net_sales").notNull().default(0),
    transactionCount: integer("transaction_count").notNull().default(0),
    averageTransactionValue: real("average_transaction_value")
      .notNull()
      .default(0),

    // Cash management
    expectedCashAmount: real("expected_cash_amount").notNull().default(0),
    countedCashAmount: real("counted_cash_amount").notNull().default(0),
    cashVariance: real("cash_variance").notNull().default(0),

    // Timing metrics
    plannedStart: text("planned_start"),
    actualStart: text("actual_start").notNull(),
    plannedEnd: text("planned_end"),
    actualEnd: text("actual_end"),
    shiftDurationMinutes: integer("shift_duration_minutes")
      .notNull()
      .default(0),
    lateMinutes: integer("late_minutes").default(0),
    earlyMinutes: integer("early_minutes").default(0),

    // Timestamps
    reportGeneratedAt: text("report_generated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    periodCovered: text("period_covered").notNull(), // e.g., '2024-01-day', '2024-01-week'
  },
  (table) => [
    drizzleIndex("shift_report_view_shift_idx").on(table.shiftId),
    drizzleIndex("shift_report_view_business_idx").on(table.businessId),
    drizzleIndex("shift_report_view_user_idx").on(table.userId),
    drizzleIndex("shift_report_view_period_idx").on(table.periodCovered),
    drizzleIndex("shift_report_view_generated_at_idx").on(
      table.reportGeneratedAt
    ),
  ]
);

export const attendanceReports = createTable(
  "attendance_reports",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").notNull(),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),

    // Period
    periodStartDate: text("period_start_date").notNull(),
    periodEndDate: text("period_end_date").notNull(),
    periodType: text("period_type", {
      enum: ["daily", "weekly", "monthly"],
    }).notNull(),

    // Shift metrics
    totalShifts: integer("total_shifts").notNull().default(0),
    completedShifts: integer("completed_shifts").notNull().default(0),
    incompleteShifts: integer("incomplete_shifts").notNull().default(0),

    // Hour calculations
    totalHours: real("total_hours").notNull().default(0),
    regularHours: real("regular_hours").notNull().default(0),
    overtimeHours: real("overtime_hours").notNull().default(0),

    // Compliance metrics
    lateClockIns: integer("late_clock_ins").notNull().default(0),
    missedClockOuts: integer("missed_clock_outs").notNull().default(0),
    tardinessMinutes: integer("tardiness_minutes").notNull().default(0),

    // Averages
    averageHoursPerShift: real("average_hours_per_shift").notNull().default(0),
    averageTardinessMinutes: real("average_tardiness_minutes")
      .notNull()
      .default(0),

    // Report metadata
    reportGeneratedAt: text("report_generated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    dataUpTo: text("data_up_to").notNull(), // Last data point included
  },
  (table) => [
    drizzleIndex("attendance_report_user_period_idx").on(
      table.userId,
      table.periodStartDate
    ),
    drizzleIndex("attendance_report_business_period_idx").on(
      table.businessId,
      table.periodType
    ),
    drizzleIndex("attendance_report_generated_at_idx").on(
      table.reportGeneratedAt
    ),

    unique("attendance_report_unique").on(
      table.userId,
      table.periodStartDate,
      table.periodEndDate,
      table.businessId
    ),
  ]
);

// ============================================
// DISCOUNTS & PROMOTIONS
// ============================================

export const discounts = createTable("discounts", {
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
  ...timestampColumns,
  createdBy: text("createdBy")
    .notNull()
    .references(() => users.id),
});

// ============================================
// SYSTEM
// ============================================

export const appSettings = createTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  ...timestampColumns,
});

export const auditLogs = createTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resourceId").notNull(),
  entityType: text("entityType"),
  entityId: text("entityId"),
  details: text("details"),
  ipAddress: text("ipAddress"),
  terminalId: text("terminalId"),
  timestamp: text("timestamp").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// ============================================
// TIME TRACKING & CLOCK-IN/OUT SYSTEM
// ============================================

export const clockEvents = createTable("clock_events", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  terminalId: text("terminalId").notNull(),
  locationId: text("locationId"),
  type: text("type", { enum: ["in", "out"] }).notNull(),
  timestamp: text("timestamp").notNull(),
  method: text("method", {
    enum: ["login", "manual", "auto", "manager"],
  }).notNull(),
  status: text("status", { enum: ["pending", "confirmed", "disputed"] })
    .notNull()
    .default("confirmed"),
  geolocation: text("geolocation"),
  ipAddress: text("ipAddress"),
  notes: text("notes"),
  ...timestampColumns,
});

export const timeShifts = createTable("time_shifts", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id),
  clockInId: text("clockInId")
    .notNull()
    .references(() => clockEvents.id),
  clockOutId: text("clockOutId").references(() => clockEvents.id),
  scheduleId: text("scheduleId").references(() => schedules.id),
  status: text("status", { enum: ["active", "completed", "pending_review"] })
    .notNull()
    .default("active"),
  totalHours: real("totalHours"),
  regularHours: real("regularHours"),
  overtimeHours: real("overtimeHours"),
  breakDuration: integer("breakDuration"),
  notes: text("notes"),
  ...timestampColumns,
});

export const breaks = createTable("breaks", {
  id: text("id").primaryKey(),
  shiftId: text("shiftId")
    .notNull()
    .references(() => timeShifts.id),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  type: text("type", { enum: ["meal", "rest", "other"] })
    .notNull()
    .default("rest"),
  startTime: text("startTime").notNull(),
  endTime: text("endTime"),
  duration: integer("duration"),
  isPaid: integer("isPaid", { mode: "boolean" }).default(false),
  status: text("status", { enum: ["active", "completed"] })
    .notNull()
    .default("active"),
  notes: text("notes"),
  ...timestampColumns,
});

export const timeCorrections = createTable("time_corrections", {
  id: text("id").primaryKey(),
  clockEventId: text("clockEventId").references(() => clockEvents.id),
  shiftId: text("shiftId").references(() => timeShifts.id),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  correctionType: text("correctionType", {
    enum: ["clock_time", "break_time", "manual_entry"],
  }).notNull(),
  originalTime: text("originalTime"),
  correctedTime: text("correctedTime").notNull(),
  timeDifference: integer("timeDifference").notNull(),
  reason: text("reason").notNull(),
  requestedBy: text("requestedBy")
    .notNull()
    .references(() => users.id),
  approvedBy: text("approvedBy").references(() => users.id),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  ...timestampColumns,
});

// ============================================
// PRINTING SYSTEM
// ============================================

export const printJobs = createTable("print_jobs", {
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

export const printJobRetries = createTable("print_job_retries", {
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
export type VatCategory = typeof vatCategories.$inferSelect;
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

export type CashDrawerCount = typeof cashDrawerCounts.$inferSelect;
export type NewCashDrawerCount = typeof cashDrawerCounts.$inferInsert;

export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;

export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type ClockEvent = typeof clockEvents.$inferSelect;
export type NewClockEvent = typeof clockEvents.$inferInsert;

export type TimeShift = typeof timeShifts.$inferSelect;
export type NewTimeShift = typeof timeShifts.$inferInsert;

export type Break = typeof breaks.$inferSelect;
export type NewBreak = typeof breaks.$inferInsert;

export type TimeCorrection = typeof timeCorrections.$inferSelect;
export type NewTimeCorrection = typeof timeCorrections.$inferInsert;

export type PrintJob = typeof printJobs.$inferSelect;
export type NewPrintJob = typeof printJobs.$inferInsert;

export type PrintJobRetry = typeof printJobRetries.$inferSelect;
export type NewPrintJobRetry = typeof printJobRetries.$inferInsert;

export type ShiftValidationIssue = typeof shiftValidationIssues.$inferSelect;
export type NewShiftValidationIssue = typeof shiftValidationIssues.$inferInsert;

export type ShiftValidation = typeof shiftValidations.$inferSelect;
export type NewShiftValidation = typeof shiftValidations.$inferInsert;

// Helper type for frontend consumption
export interface ShiftValidationWithIssues extends ShiftValidation {
  issues: ShiftValidationIssue[];
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
export const index = drizzleIndex;
