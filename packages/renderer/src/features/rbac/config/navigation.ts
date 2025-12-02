/**
 * RBAC Feature Navigation Routes
 *
 * Centralized route definitions for the RBAC feature.
 * These routes are used for navigation throughout the feature.
 */

export const RBAC_ROUTES = {
  /** Role management view */
  ROLE_MANAGEMENT: "rbac:role-management",

  /** User role assignment view */
  USER_ROLE_ASSIGNMENT: "rbac:user-role-assignment",
} as const;

export type RbacRoute =
  (typeof RBAC_ROUTES)[keyof typeof RBAC_ROUTES];

