/**
 * RBAC Helper Utilities for Frontend
 *
 * These utilities help components work with the modern RBAC system
 * instead of deprecated user.role and user.permissions fields.
 *
 * @module rbac-helpers
 */

import type { User } from "@/types/domain/user";

import { getLogger } from "@/shared/utils/logger";
const logger = getLogger("rbac-helpers");

/**
 * Type for user objects that have RBAC role information
 * Used to make helpers work with both User and StaffUser types
 */
type UserWithRole = {
  primaryRole?: {
    name: string;
    displayName?: string;
  };
  roleName?: string;
  role?: string; // Deprecated but kept for backward compatibility
};

/**
 * Get user's primary role name (for UI display and logic)
 *
 * @param user - User object with RBAC data (User or StaffUser)
 * @returns Role name (e.g., "cashier", "manager", "admin") or default "cashier"
 *
 * @example
 * ```tsx
 * const roleName = getUserRoleName(user);
 * if (roleName === "admin") {
 *   // Show admin features
 * }
 * ```
 */
export function getUserRoleName(
  user: User | UserWithRole | null | undefined
): string {
  if (!user) return "cashier";

  // Try to get from primaryRole (RBAC system)
  if (user.primaryRole?.name) {
    return user.primaryRole.name;
  }

  // Fallback: try roleName field (from backend join query)
  if (user.roleName) {
    return user.roleName.toLowerCase();
  }

  // Fallback: try deprecated role field
  if ("role" in user && user.role) {
    return user.role.toLowerCase();
  }

  // Default fallback
  return "cashier";
}

/**
 * Get user's display role name (human-readable, for UI labels)
 *
 * @param user - User object with RBAC data (User or StaffUser)
 * @returns Display name (e.g., "Cashier", "Store Manager", "Administrator")
 *
 * @example
 * ```tsx
 * <Badge>{getUserRoleDisplayName(user)}</Badge>
 * ```
 */
export function getUserRoleDisplayName(
  user: User | UserWithRole | null | undefined
): string {
  if (!user) return "Cashier";

  // Try to get from primaryRole (RBAC system)
  if (user.primaryRole?.displayName) {
    return user.primaryRole.displayName;
  }

  // Fallback: capitalize roleName
  const roleName = getUserRoleName(user);
  return capitalizeRole(roleName);
}

/**
 * Check if user has a specific role
 *
 * @param user - User object with RBAC data
 * @param roleName - Role name to check (e.g., "admin", "manager")
 * @returns Whether user has the specified role
 *
 * @example
 * ```tsx
 * if (userHasRole(user, "admin")) {
 *   return <DashboardPageWrapper />;
 * }
 * ```
 */
export function userHasRole(
  user: User | null | undefined,
  roleName: string
): boolean {
  if (!user) return false;
  return getUserRoleName(user) === roleName.toLowerCase();
}

/**
 * Check if user has any of the specified roles
 *
 * @param user - User object with RBAC data
 * @param roleNames - Array of role names to check
 * @returns Whether user has at least one of the specified roles
 *
 * @example
 * ```tsx
 * if (userHasAnyRole(user, ["admin", "manager"])) {
 *   return <ManagementFeatures />;
 * }
 * ```
 */
export function userHasAnyRole(
  user: User | null | undefined,
  roleNames: string[]
): boolean {
  if (!user) return false;
  const userRole = getUserRoleName(user);
  return roleNames.some((role) => role.toLowerCase() === userRole);
}

/**
 * Check if user has permission (via RBAC API)
 *
 * Note: This makes an async API call. For performance-critical checks,
 * consider caching results or using role-based checks instead.
 *
 * @param userId - User ID
 * @param permission - Permission string (e.g., "read:products", "write:sales")
 * @returns Promise<boolean> Whether user has the permission
 *
 * @example
 * ```tsx
 * const canManageUsers = await userHasPermission(user.id, "manage:users");
 * ```
 */
export async function userHasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const sessionToken = await window.authStore.get("token");
    if (!sessionToken) return false;

    const response = await window.rbacAPI.userPermissions.getUserPermissions(
      sessionToken,
      userId
    );

    if (response.success && Array.isArray(response.data)) {
      return (response.data as string[]).includes(permission);
    }
    return false;
  } catch (error) {
    logger.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Get role badge variant for UI styling
 *
 * @param roleName - Role name
 * @returns Badge variant ("default" | "secondary" | "destructive" | "outline")
 *
 * @example
 * ```tsx
 * <Badge variant={getRoleBadgeVariant(getUserRoleName(user))}>
 *   {getUserRoleDisplayName(user)}
 * </Badge>
 * ```
 */
export function getRoleBadgeVariant(
  roleName: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (roleName.toLowerCase()) {
    case "admin":
    case "owner":
      return "default";
    case "manager":
    case "supervisor":
      return "secondary";
    case "cashier":
      return "outline";
    default:
      return "secondary";
  }
}

/**
 * Get role display name from role name
 * Helper function to capitalize and format role names
 *
 * @param roleName - Role name
 * @returns Formatted display name
 */
function capitalizeRole(roleName: string): string {
  const roleMap: Record<string, string> = {
    cashier: "Cashier",
    supervisor: "Supervisor",
    manager: "Store Manager",
    admin: "Administrator",
    owner: "Owner",
  };

  return (
    roleMap[roleName.toLowerCase()] ||
    roleName.charAt(0).toUpperCase() + roleName.slice(1)
  );
}

/**
 * Check if user needs shift management (based on role)
 *
 * @param user - User object
 * @returns Whether user requires shift tracking
 *
 * @example
 * ```tsx
 * if (userRequiresShift(user)) {
 *   return <ShiftManagement />;
 * }
 * ```
 */
export function userRequiresShift(user: User | null | undefined): boolean {
  if (!user) return false;

  // Check explicit shiftRequired field if available
  if (typeof user.shiftRequired === "boolean") {
    return user.shiftRequired;
  }

  // Default: cashiers and supervisors require shifts
  const roleName = getUserRoleName(user);
  return roleName === "cashier" || roleName === "supervisor";
}

/**
 * Type guard to check if user object has RBAC data
 *
 * @param user - User object to check
 * @returns Whether user has RBAC data loaded
 */
export function hasRBACData(
  user: User | null | undefined
): user is User & { primaryRole: NonNullable<User["primaryRole"]> } {
  return !!user?.primaryRole;
}
