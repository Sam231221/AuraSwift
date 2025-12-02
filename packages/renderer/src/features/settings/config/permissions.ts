/**
 * Settings Feature Permissions
 *
 * Centralized permission definitions for the settings feature.
 * These permissions are used for RBAC throughout the feature.
 */

import { PERMISSIONS } from "@app/shared/constants/permissions";

/**
 * Settings Feature Permissions
 *
 * Maps to the existing permission system while providing
 * feature-specific constants for better organization.
 */
export const SETTINGS_PERMISSIONS = {
  /** Manage system settings */
  MANAGE: PERMISSIONS.SETTINGS_MANAGE, // "manage:settings"
} as const;

export type SettingsPermission =
  (typeof SETTINGS_PERMISSIONS)[keyof typeof SETTINGS_PERMISSIONS];

