import { text, integer } from "drizzle-orm/sqlite-core";
import { createTable } from "./common.js";
import { businesses } from "./auth.js";
import { users } from "./auth.js";

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

