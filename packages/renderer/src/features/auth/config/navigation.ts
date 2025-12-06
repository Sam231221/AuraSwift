/**
 * Auth Feature - Navigation Routes
 *
 * Centralized route definitions for the auth feature.
 * Uses namespaced format for consistency with other features.
 */

export const AUTH_ROUTES = {
  /** Authentication page */
  AUTH: "auth:page", // ✅ Changed from "/auth" to namespaced format
} as const;

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
