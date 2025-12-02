/**
 * Inventory Feature Permissions
 *
 * Centralized permission definitions for the inventory feature.
 * These permissions are used for RBAC throughout the feature.
 *
 * Note: Uses the existing permission format from the codebase.
 */

import { PERMISSIONS } from "@app/shared/constants/permissions";

/**
 * Inventory Feature Permissions
 *
 * Maps to the existing permission system while providing
 * feature-specific constants for better organization.
 */
export const INVENTORY_PERMISSIONS = {
  /** Read inventory data (products, batches, categories) */
  READ: "inventory:read",

  /** Manage inventory (create, update, delete products) */
  MANAGE: PERMISSIONS.INVENTORY_MANAGE, // "manage:inventory"

  /** Adjust stock levels */
  ADJUST: "inventory:adjust",

  /** View stock movement history */
  VIEW_HISTORY: "inventory:view-history",

  /** Manage categories */
  MANAGE_CATEGORIES: PERMISSIONS.CATEGORIES_MANAGE, // "manage:categories"

  /** Manage batches */
  MANAGE_BATCHES: "inventory:manage-batches",
} as const;

export type InventoryPermission =
  (typeof INVENTORY_PERMISSIONS)[keyof typeof INVENTORY_PERMISSIONS];
