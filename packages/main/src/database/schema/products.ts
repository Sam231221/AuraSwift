import { text, integer, real, unique } from "drizzle-orm/sqlite-core";
import { createTable, timestampColumns, index } from "./common.js";
import { businesses } from "./auth.js";

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

// Define categories table with self-reference
// TypeScript limitation: self-referencing tables cause circular type inference
// This is a known issue with Drizzle ORM - the code works correctly at runtime
// @ts-ignore - Circular reference in self-referencing table
export const categories = createTable(
  "categories",
  {
    id: text("id").primaryKey(), // Consistent ID type
    name: text("name").notNull(),
    // @ts-ignore - Self-reference: categories.parentId -> categories.id
    parentId: text("parent_id").references(() => categories, {
      onDelete: "set null",
    }),
    description: text("description"),
    vatCategoryId: text("vat_category_id").references(() => vatCategories.id, {
      onDelete: "set null",
    }),
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
    // ⚠️ IMPORTANT: When requiresBatchTracking is true, stockLevel should be calculated
    // as SUM(currentQuantity) of all ACTIVE batches for this product.
    // This field serves as a cached value for performance but should be kept in sync.
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

    // 🔥 EXPIRY TRACKING FIELDS
    hasExpiry: integer("has_expiry", { mode: "boolean" }).default(false),
    shelfLifeDays: integer("shelf_life_days"), // Expected shelf life in days
    requiresBatchTracking: integer("requires_batch_tracking", {
      mode: "boolean",
    }).default(false),
    // FIFO/FEFO settings
    stockRotationMethod: text("stock_rotation_method", {
      enum: ["FIFO", "FEFO", "NONE"],
    }).default("FIFO"),

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
