import { text, integer } from "drizzle-orm/sqlite-core";
import { createTable, timestampColumns } from "./common.js";
import type { Permission } from "./common.js";

export const businesses = createTable("businesses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("ownerId").notNull(), // References users.id - resolved via relations to avoid circular dependency

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
    .references(() => businesses.id, { onDelete: "cascade" }),
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

