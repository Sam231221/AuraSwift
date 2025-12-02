/**
 * Users Feature Permissions
 *
 * Centralized permission definitions for the users feature.
 * These permissions are used for RBAC throughout the feature.
 */

import { PERMISSIONS } from "@app/shared/constants/permissions";

/**
 * Users Feature Permissions
 *
 * Maps to the existing permission system while providing
 * feature-specific constants for better organization.
 */
export const USERS_PERMISSIONS = {
  /** Manage users (create, update, delete, assign roles) */
  MANAGE: PERMISSIONS.USERS_MANAGE, // "manage:users"
} as const;

export type UsersPermission =
  (typeof USERS_PERMISSIONS)[keyof typeof USERS_PERMISSIONS];

