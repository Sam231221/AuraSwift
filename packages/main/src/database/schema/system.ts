import { text, integer } from "drizzle-orm/sqlite-core";
import { createTable, timestampColumns } from "./common.js";
import { users } from "./auth.js";

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

