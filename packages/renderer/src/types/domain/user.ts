/**
 * User Domain Types
 * 
 * Modern RBAC-based user type. This is the single source of truth for User types.
 * 
 * IMPORTANT: Do NOT use deprecated fields:
 * - ❌ user.role - REMOVED (use getUserRoleName(user) instead)
 * - ❌ user.permissions - REMOVED (use RBAC API instead)
 * 
 * Use instead:
 * - ✅ user.primaryRole.name - Primary role name
 * - ✅ user.primaryRole.displayName - Display name
 * - ✅ getUserRoleName(user) - Helper function
 * - ✅ userHasPermission(userId, permission) - Permission check
 * 
 * @module types/domain/user
 */

import type { Role } from './role';

export interface User {
  id: string;
  username: string;
  pin?: string;
  email?: string;
  firstName: string;
  lastName: string;
  businessName: string;
  businessId: string;

  // RBAC fields
  primaryRole?: Role;
  primaryRoleId?: string;
  roleName?: string; // From backend join query (lowercase)
  shiftRequired?: boolean;
  activeRoleContext?: string;

  // Account status
  isActive: boolean;
  lastLoginAt?: string;
  loginAttempts?: number;
  lockedUntil?: string;

  // Profile
  avatar?: string;
  address?: string;

  // Timestamps
  createdAt: string;
  updatedAt?: string;
}

/**
 * Simplified user type for login selection screen
 */
export interface UserForLogin {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  roleName: string; // Display role name
  color: string; // UI color for user avatar
}

/**
 * Helper function to get user's role name
 */
export function getUserRoleName(user: User): string {
  return user.primaryRole?.name || user.roleName || 'unknown';
}

/**
 * Helper function to get user's display name
 */
export function getUserDisplayName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}
