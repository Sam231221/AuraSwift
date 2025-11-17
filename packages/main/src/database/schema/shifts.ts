import { text, integer, real, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createTable, timestampColumns, index } from "./common.js";
import { businesses } from "./auth.js";
import { users } from "./auth.js";

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

    shiftId: text("shift_id")
      .notNull()
      .references(() => shifts.id),
    countType: text("count_type", {
      enum: ["mid-shift", "end-shift"],
    }).notNull(),
    expectedAmount: real("expected_amount").notNull(),
    countedAmount: real("counted_amount").notNull(),
    variance: real("variance").notNull(),
    notes: text("notes"),
    countedBy: text("counted_by")
      .notNull()
      .references(() => users.id), // userId
    timestamp: text("timestamp").notNull(), // ISO string
  },
  (table) => [
    // Index for frequent queries
    index("cash_drawer_counts_shift_idx").on(table.shiftId),
    index("cash_drawer_counts_business_idx").on(table.businessId),
    index("cash_drawer_counts_timestamp_idx").on(table.timestamp),
    index("cash_drawer_counts_counted_by_idx").on(table.countedBy),

    // Ensure only one end-shift count per shift
    unique("cash_drawer_counts_shift_type_unique").on(
      table.shiftId,
      table.countType
    ),
  ]
);

