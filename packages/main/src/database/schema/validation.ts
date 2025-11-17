import { text, integer, unique } from "drizzle-orm/sqlite-core";
import { createTable, commonColumns, index } from "./common.js";

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
    index("validation_issues_validation_idx").on(table.validationId),
    index("validation_issues_type_idx").on(table.type),
    index("validation_issues_severity_idx").on(table.severity),
    index("validation_issues_category_idx").on(table.category),
    index("validation_issues_resolved_idx").on(table.resolved),
    index("validation_issues_business_idx").on(table.businessId),
    index("validation_issues_related_entity_idx").on(
      table.relatedEntityType,
      table.relatedEntityId
    ),

    // Composite index for common query patterns
    index("validation_issues_status_severity_idx").on(
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
    index("shift_validations_shift_idx").on(table.shiftId),
    index("shift_validations_business_idx").on(table.businessId),
    index("shift_validations_valid_idx").on(table.valid),
    index("shift_validations_requires_review_idx").on(
      table.requiresReview
    ),
    index("shift_validations_resolution_idx").on(table.resolution),
    index("shift_validations_unresolved_count_idx").on(
      table.unresolvedIssueCount
    ),

    // One validation record per shift
    unique("shift_validations_shift_unique").on(table.shiftId),
  ]
);

