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
} as const;

export type InventoryRoute =
  (typeof INVENTORY_ROUTES)[keyof typeof INVENTORY_ROUTES];
