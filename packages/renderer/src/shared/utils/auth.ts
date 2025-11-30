import type { User } from "@/types/domain";

/**
 * Authentication utility functions for frontend
 * 
 * ⚠️ IMPORTANT: Permission checking is handled by the backend RBAC system.
 * 
 * For permission checks in React components:
 * - ✅ Use `useUserPermissions()` hook from `@/features/dashboard/hooks/use-user-permissions`
 * - ✅ This hook fetches permissions from backend RBAC API
 * - ✅ Frontend permission checks are for UI only - backend enforces security
 * 
 * For role-based checks:
 * - ✅ Use `userHasRole()` from `@/shared/utils/rbac-helpers`
 * - ✅ Use `getUserRoleName()` for role name
 * 
 * ❌ DO NOT check permissions locally - always use backend RBAC system
 */

/**
 * Get the display name for a role
 */
export function getRoleDisplayName(role?: string): string {
  switch (role) {
    case "cashier":
      return "Cashier";
    case "manager":
      return "Manager";
    case "admin":
      return "Administrator";
    default:
      return "User";
  }
}

/**
 * Get the description for a role
 */
export function getRoleDescription(role?: string): string {
  switch (role) {
    case "cashier":
      return "Process sales and view basic reports";
    case "manager":
      return "Full sales management and inventory control";
    case "admin":
      return "Complete system access and user management";
    default:
      return "Standard user access";
  }
}

/**
 * Get the display name for a user (first name + last name)
 */
export function getUserDisplayName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}
