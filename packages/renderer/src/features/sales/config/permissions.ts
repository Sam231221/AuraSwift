/**
 * Sales Feature Permissions
 *
 * Centralized permission definitions for the sales feature.
 * These permissions are used for RBAC throughout the feature.
 */

import { PERMISSIONS } from "@app/shared/constants/permissions";

/**
 * Sales Feature Permissions
 *
 * Maps to the existing permission system while providing
 * feature-specific constants for better organization.
 */
export const SALES_PERMISSIONS = {
  /** Read sales data (view transactions, reports) */
  READ: PERMISSIONS.SALES_READ, // "read:sales"

  /** Create new sales transactions */
  WRITE: PERMISSIONS.SALES_WRITE, // "write:sales"

  /** Override transactions (void, refund) */
  OVERRIDE: PERMISSIONS.TRANSACTIONS_OVERRIDE, // "override:transactions"

  /** Issue refunds */
  REFUND: PERMISSIONS.TRANSACTIONS_REFUND, // "refund:transactions"
} as const;

export type SalesPermission =
  (typeof SALES_PERMISSIONS)[keyof typeof SALES_PERMISSIONS];

