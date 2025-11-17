import { text, integer, real } from "drizzle-orm/sqlite-core";
import { createTable, timestampColumns } from "./common.js";
import { businesses } from "./auth.js";
import { users } from "./auth.js";

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

