/**
 * Inventory Feature Navigation Routes
 *
 * Centralized route definitions for the inventory feature.
 * These routes are used for navigation throughout the feature.
 */

export const INVENTORY_ROUTES = {
  /** Main inventory dashboard */
  DASHBOARD: "inventory:dashboard",

  /** Product list view */
  PRODUCTS: "inventory:products",

  /** Product details view */
  PRODUCT_DETAILS: "inventory:product-details",

  /** Batch management view */
  BATCHES: "inventory:batches",

  /** Category management view */
  CATEGORIES: "inventory:categories",

  /** Stock movement history view */
  HISTORY: "inventory:history",

  /** Product expiry dashboard view */
  EXPIRY_DASHBOARD: "inventory:expiry-dashboard",

  // Nested route constants for hierarchical views
  /** Product management root view */
  PRODUCT_MANAGEMENT: "productManagement",

  /** Product dashboard nested view */
  PRODUCT_DASHBOARD: "productDashboard",

  /** Product list nested view */
  PRODUCT_LIST: "productList",

  /** Product details nested view */
  PRODUCT_DETAILS_NESTED: "productDetails",

  /** Category management nested view */
  CATEGORY_MANAGEMENT: "categoryManagement",

  /** Batch management root view */
  BATCH_MANAGEMENT: "batchManagement",

  /** Batch dashboard nested view */
  BATCH_DASHBOARD: "batchDashboard",

  /** Batch list nested view */
  BATCH_LIST: "batchList",

  /** Expiry alerts nested view */
  EXPIRY_ALERTS: "expiryAlerts",

  /** Stock movement history nested view */
  STOCK_MOVEMENT_HISTORY: "stockMovementHistory",
} as const;

export type InventoryRoute =
  (typeof INVENTORY_ROUTES)[keyof typeof INVENTORY_ROUTES];
