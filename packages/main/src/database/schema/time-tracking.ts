import { text, integer, real } from "drizzle-orm/sqlite-core";
import { createTable, timestampColumns } from "./common.js";
import { businesses } from "./auth.js";
import { users } from "./auth.js";
import { schedules } from "./shifts.js";

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

