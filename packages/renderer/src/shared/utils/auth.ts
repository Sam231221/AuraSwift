import type { User } from "@/types/domain";
import { getUserRoleName } from "./rbac-helpers";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('auth');

/**
 * Check if a user has a specific permission
 * Note: This is deprecated. Use the backend RBAC system instead.
 */
export function hasPermission(
  user: User,
  action: string,
  resource: string
): boolean {
  // Temporary: Admin has all permissions
  if (getUserRoleName(user) === "admin") return true;

  // For now, return false - permissions should be checked via backend
  logger.warn("hasPermission is deprecated. Use backend RBAC checks instead.");
  return false;
}

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
