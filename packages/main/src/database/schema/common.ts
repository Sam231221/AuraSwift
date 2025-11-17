import { integer, text, sqliteTableCreator } from "drizzle-orm/sqlite-core";
import { index as drizzleIndex } from "drizzle-orm/sqlite-core";

/**
 * Permission type: update this if you add/remove permissions in the schema
 */
export type Permission =
  | "read:sales"
  | "write:sales"
  | "read:reports"
  | "manage:inventory"
  | "manage:users"
  | "view:analytics"
  | "override:transactions"
  | "manage:settings";

/**
 * Common timestamp columns used across tables
 */
export const timestampColumns = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
};

/**
 * Common columns for tables that need internal/external IDs
 */
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

/**
 * Table creator function
 */
export const createTable = sqliteTableCreator((name) => name);

/**
 * Re-export index function for convenience
 */
export const index = drizzleIndex;
