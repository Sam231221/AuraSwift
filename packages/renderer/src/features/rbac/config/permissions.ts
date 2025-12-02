/**
 * RBAC Feature Permissions
 *
 * Centralized permission definitions for the RBAC feature.
 * These permissions are used for RBAC throughout the feature.
 */

import { PERMISSIONS } from "@app/shared/constants/permissions";

/**
 * RBAC Feature Permissions
 *
 * Maps to the existing permission system while providing
 * feature-specific constants for better organization.
 */
export const RBAC_PERMISSIONS = {
  /** Manage users (required for RBAC operations) */
  MANAGE: PERMISSIONS.USERS_MANAGE, // "manage:users"
} as const;

export type RbacPermission =
  (typeof RBAC_PERMISSIONS)[keyof typeof RBAC_PERMISSIONS];

