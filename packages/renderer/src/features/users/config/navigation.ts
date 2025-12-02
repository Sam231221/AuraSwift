/**
 * Users Feature Navigation Routes
 *
 * Centralized route definitions for the users feature.
 * These routes are used for navigation throughout the feature.
 */

export const USERS_ROUTES = {
  /** User management view */
  MANAGEMENT: "users:management",
} as const;

export type UsersRoute =
  (typeof USERS_ROUTES)[keyof typeof USERS_ROUTES];

