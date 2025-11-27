/**
 * Permission Constants
 * 
 * Central definition of all permissions in the system.
 * Use these constants instead of hardcoding permission strings.
 * 
 * Format: "action:resource"
 * - action: read, write, manage, view, override, delete
 * - resource: sales, reports, inventory, users, settings, analytics, transactions
 * 
 * Usage:
 * ```typescript
 * import { PERMISSIONS } from "@/constants/permissions";
 * 
 * if (!user.permissions.includes(PERMISSIONS.USERS_MANAGE)) {
 *   return { success: false, message: "Unauthorized" };
 * }
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
  
  // ---------------------------------------------------------------------------
  // Settings Permissions
  // ---------------------------------------------------------------------------
  
  /** 
   * Manage system settings: business settings, tax rates,
   * receipt templates, integrations
   */
  SETTINGS_MANAGE: "manage:settings",
  
  // ---------------------------------------------------------------------------
  // Special Permissions
  // ---------------------------------------------------------------------------
  
  /** Wildcard: grants all permissions (typically for admin/owner) */
  ALL: "*:*",
  
} as const;

// ============================================================================
// PERMISSION GROUPS (For easier assignment)
// ============================================================================

/**
 * Permission groups for common role configurations
 */
export const PERMISSION_GROUPS = {
  /** All permissions - for admin/owner role */
  ADMIN: [
    PERMISSIONS.ALL, // Covers everything
  ],
  
  /** Manager permissions */
  MANAGER: [
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_WRITE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.TRANSACTIONS_OVERRIDE,
  ],
  
  /** Supervisor permissions (future role) */
  SUPERVISOR: [
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_WRITE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.TRANSACTIONS_OVERRIDE,
  ],
  
  /** Cashier permissions */
  CASHIER: [
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_WRITE,
  ],
  
  /** Read-only analyst (future role) */
  ANALYST: [
    PERMISSIONS.SALES_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  
} as const;

// ============================================================================
// PERMISSION METADATA
// ============================================================================

/**
 * Permission descriptions for UI and documentation
 */
export const PERMISSION_DESCRIPTIONS: Record<string, {
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}> = {
  [PERMISSIONS.SALES_READ]: {
    name: "View Sales",
    description: "View sales transactions and history",
    riskLevel: "low",
  },
  [PERMISSIONS.SALES_WRITE]: {
    name: "Process Sales",
    description: "Create new sales transactions",
    riskLevel: "medium",
  },
  [PERMISSIONS.REPORTS_READ]: {
    name: "View Reports",
    description: "Access sales, inventory, and business reports",
    riskLevel: "low",
  },
  [PERMISSIONS.INVENTORY_MANAGE]: {
    name: "Manage Inventory",
    description: "Add, edit, and delete products and manage stock levels",
    riskLevel: "high",
  },
  [PERMISSIONS.USERS_MANAGE]: {
    name: "Manage Users",
    description: "Create, update, and delete user accounts",
    riskLevel: "critical",
  },
  [PERMISSIONS.ANALYTICS_VIEW]: {
    name: "View Analytics",
    description: "Access business analytics and insights",
    riskLevel: "low",
  },
  [PERMISSIONS.TRANSACTIONS_OVERRIDE]: {
    name: "Override Transactions",
    description: "Void transactions, issue refunds, and apply special discounts",
    riskLevel: "high",
  },
  [PERMISSIONS.SETTINGS_MANAGE]: {
    name: "Manage Settings",
    description: "Change system settings and configurations",
    riskLevel: "critical",
  },
  [PERMISSIONS.ALL]: {
    name: "All Permissions",
    description: "Full system access (admin/owner only)",
    riskLevel: "critical",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all permissions for a role
 * 
 * @param role - Role name (admin, manager, supervisor, cashier)
 * @returns Array of permissions for the role
 */
export function getPermissionsForRole(
  role: "admin" | "owner" | "manager" | "supervisor" | "cashier"
): string[] {
  switch (role) {
    case "admin":
    case "owner":
      return PERMISSION_GROUPS.ADMIN;
    case "manager":
      return PERMISSION_GROUPS.MANAGER;
    case "supervisor":
      return PERMISSION_GROUPS.SUPERVISOR;
    case "cashier":
      return PERMISSION_GROUPS.CASHIER;
    default:
      return [];
  }
}

/**
 * Check if a permission string is valid
 * 
 * @param permission - Permission string to validate
 * @returns Whether the permission is valid
 */
export function isValidPermission(permission: string): boolean {
  const validPermissions = Object.values(PERMISSIONS);
  return validPermissions.includes(permission as any);
}

/**
 * Get permission details
 * 
 * @param permission - Permission string
 * @returns Permission metadata or null if not found
 */
export function getPermissionInfo(permission: string) {
  return PERMISSION_DESCRIPTIONS[permission] || null;
}

/**
 * Get all available permissions
 * 
 * @returns Array of all permission strings
 */
export function getAllPermissions(): string[] {
  return Object.values(PERMISSIONS);
}

/**
 * Group permissions by risk level
 * 
 * @returns Permissions grouped by risk level
 */
export function getPermissionsByRiskLevel() {
  const grouped: Record<string, string[]> = {
    low: [],
    medium: [],
    high: [],
    critical: [],
  };

  for (const [permission, metadata] of Object.entries(PERMISSION_DESCRIPTIONS)) {
    grouped[metadata.riskLevel].push(permission);
  }

  return grouped;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Type-safe permission string */
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/** Type-safe role string */
export type Role = "admin" | "owner" | "manager" | "supervisor" | "cashier";

/** Permission group name */
export type PermissionGroup = keyof typeof PERMISSION_GROUPS;

// ============================================================================
// FUTURE PERMISSIONS (Commented out until implemented)
// ============================================================================

/*
// Future granular permissions with scope:
export const FUTURE_PERMISSIONS = {
  // Scoped sales permissions
  SALES_READ_OWN: "read:sales:own",           // View only own transactions
  SALES_READ_BRANCH: "read:sales:branch",     // View branch transactions
  SALES_READ_ALL: "read:sales:all",           // View all transactions
  
  // Product-specific permissions
  PRODUCTS_CREATE: "create:products",
  PRODUCTS_UPDATE: "update:products",
  PRODUCTS_DELETE: "delete:products",
  
  // Category-specific permissions
  CATEGORIES_CREATE: "create:categories",
  CATEGORIES_UPDATE: "update:categories",
  CATEGORIES_DELETE: "delete:categories",
  
  // User-specific permissions
  USERS_CREATE: "create:users",
  USERS_UPDATE: "update:users",
  USERS_DELETE: "delete:users",
  USERS_VIEW: "view:users",
  
  // Discount permissions
  DISCOUNTS_APPLY: "apply:discounts",
  DISCOUNTS_MANAGE: "manage:discounts",
  
  // Shift permissions
  SHIFTS_MANAGE: "manage:shifts",
  SHIFTS_VIEW: "view:shifts",
  
  // Reporting permissions
  REPORTS_FINANCIAL: "view:reports:financial",
  REPORTS_INVENTORY: "view:reports:inventory",
  REPORTS_STAFF: "view:reports:staff",
  
  // Settings permissions
  SETTINGS_BUSINESS: "manage:settings:business",
  SETTINGS_PAYMENT: "manage:settings:payment",
  SETTINGS_TAX: "manage:settings:tax",
  SETTINGS_RECEIPT: "manage:settings:receipt",
  
  // Audit permissions
  AUDIT_VIEW: "view:audit",
  AUDIT_EXPORT: "export:audit",
};
*/

