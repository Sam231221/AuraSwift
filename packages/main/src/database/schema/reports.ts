import {
  text,
  integer,
  real,
  unique,
  sqliteTableCreator,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createTable, index } from "./common.js";

// Shift Report View - Materialized or computed
export const shiftReports = sqliteTableCreator((name: string) => `pos_${name}`)(
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
  (table: any) => [
    index("shift_report_view_shift_idx").on(table.shiftId),
    index("shift_report_view_business_idx").on(table.businessId),
    index("shift_report_view_user_idx").on(table.userId),
    index("shift_report_view_period_idx").on(table.periodCovered),
    index("shift_report_view_generated_at_idx").on(table.reportGeneratedAt),
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
    index("attendance_report_user_period_idx").on(
      table.userId,
      table.periodStartDate
    ),
    index("attendance_report_business_period_idx").on(
      table.businessId,
      table.periodType
    ),
    index("attendance_report_generated_at_idx").on(table.reportGeneratedAt),

    unique("attendance_report_unique").on(
      table.userId,
      table.periodStartDate,
      table.periodEndDate,
      table.businessId
    ),
  ]
);
