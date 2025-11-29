/**
 * User Type Definitions for RBAC System
 *
 * @deprecated This file is deprecated. Use @/types/domain/user instead.
 * @see /Users/admin/Documents/Developer/Electron/AuraSwift/packages/renderer/src/types/domain/user.ts
 * 
 * This file defines the modern User type with RBAC support.
 * Deprecated fields (role, permissions) are removed.
 * 
 * Migration: Replace imports with:
 * ```typescript
 * // Old
 * import { User } from '@/shared/types/user';
 * 
 * // New
 * import { User } from '@/types/domain';
 * ```
 */

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: Permission[];
  isSystemRole?: boolean;
  isActive?: boolean;
}

/**
 * Modern User interface using RBAC system
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
 */
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
 * Business/Organization entity
 */
export interface Business {
  id: string;
  firstName: string;
  lastName: string;
  businessName: string;
  ownerId: string;

  // Contact
  email?: string;
  phone?: string;
  website?: string;

  // Location
  address?: string;
  country?: string;
  city?: string;
  postalCode?: string;

  // Business info
  vatNumber?: string;
  businessType?: "retail" | "restaurant" | "service" | "wholesale" | "other";
  currency?: string;
  timezone?: string;

  // Status
  isActive?: boolean;
  avatar?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}
