/**
 * Permission Constants - SINGLE SOURCE OF TRUTH
 *
 * This file is the ONLY place where permissions should be defined.
 * Both main and renderer processes import from this shared package.
 *
 * Format: "action:resource"
 * - action: read, write, manage, view, override, delete
 * - resource: sales, reports, inventory, users, settings, analytics, transactions
 *
 * Usage:
 * ```typescript
 * import { PERMISSIONS, getAllAvailablePermissions } from "@app/shared/constants/permissions";
 *
 * // In main process
 * if (!user.permissions.includes(PERMISSIONS.USERS_MANAGE)) {
 *   return { success: false, message: "Unauthorized" };
 * }
 *
 * // In renderer (UI components)
 * const availablePermissions = getAllAvailablePermissions();
 * ```
 */

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

export const PERMISSIONS = {
  // ---------------------------------------------------------------------------
  // Sales Permissions
  // ---------------------------------------------------------------------------

  /** View sales transactions and data */
  SALES_READ: "read:sales",

  /** Create new sales transactions */
  SALES_WRITE: "write:sales",

  // ---------------------------------------------------------------------------
  // Inventory Permissions
  // ---------------------------------------------------------------------------

  /**
   * Manage inventory: create, update, delete products, categories,
   * adjust stock levels, manage suppliers
   */
  INVENTORY_MANAGE: "manage:inventory",

  // ---------------------------------------------------------------------------
  // User Management Permissions
  // ---------------------------------------------------------------------------

  /**
   * Manage users: create, update, delete users,
   * assign roles and permissions
   */
  USERS_MANAGE: "manage:users",

  // ---------------------------------------------------------------------------
  // Reports & Analytics Permissions
  // ---------------------------------------------------------------------------

  /** View reports (sales reports, inventory reports, etc.) */
  REPORTS_READ: "read:reports",

  /** Create and generate custom reports */
  REPORTS_WRITE: "write:reports",

  /** View analytics dashboard and insights */
  ANALYTICS_VIEW: "view:analytics",

  // ---------------------------------------------------------------------------
  // Transaction Override Permissions
  // ---------------------------------------------------------------------------

  /**
   * Override transactions: void transactions, issue refunds,
   * apply special discounts
   */
  TRANSACTIONS_OVERRIDE: "override:transactions",

  /** Issue refunds for transactions */
  TRANSACTIONS_REFUND: "refund:transactions",

  /** Apply discounts to transactions */
  DISCOUNTS_APPLY: "discount:apply",

  // ---------------------------------------------------------------------------
  // Settings Permissions
  // ---------------------------------------------------------------------------

  /**
   * Manage system settings: business settings, tax rates,
   * receipt templates, integrations
   */
  SETTINGS_MANAGE: "manage:settings",

  // ---------------------------------------------------------------------------
  // Product & Inventory Management Permissions
  // ---------------------------------------------------------------------------

  /** Manage products: create, update, delete products */
  PRODUCTS_MANAGE: "manage:products",

  /** Manage categories: create, update, delete categories */
  CATEGORIES_MANAGE: "manage:categories",

  /** Manage suppliers: create, update, delete suppliers */
  SUPPLIERS_MANAGE: "manage:suppliers",

  /** Manage customers: create, update, delete customers */
  CUSTOMERS_MANAGE: "manage:customers",

  // ---------------------------------------------------------------------------
  // Schedule Management Permissions
  // ---------------------------------------------------------------------------

  /**
   * Manage schedules for all staff (cashiers and managers)
   * Typically granted to admins
   */
  SCHEDULES_MANAGE_ALL: "manage:schedules:all",

  /**
   * Manage schedules for cashiers only
   * Typically granted to managers
   */
  SCHEDULES_MANAGE_CASHIERS: "manage:schedules:cashiers",

  // ---------------------------------------------------------------------------
  // Special Permissions
  // ---------------------------------------------------------------------------

  /** Wildcard: grants all permissions (typically for admin/owner) */
  ALL: "*:*",
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all available permissions for UI components
 * This is the single source of truth for permission lists
 *
 * @returns Array of all permission strings, sorted (with "*:*" first)
 */
export function getAllAvailablePermissions(): string[] {
  return Object.values(PERMISSIONS).sort((a, b) => {
    if (a === PERMISSIONS.ALL) return -1;
    if (b === PERMISSIONS.ALL) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Check if a permission string is valid
 *
 * @param permission - Permission string to validate
 * @returns Whether the permission is valid
 */
export function isValidPermission(permission: string): boolean {
  return Object.values(PERMISSIONS).includes(permission as any);
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Type-safe permission string */
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
