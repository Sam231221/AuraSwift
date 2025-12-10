/**
 * Auth Feature - Navigation Routes
 *
 * Centralized route definitions for the auth feature.
 */

export const AUTH_ROUTES = {
  AUTH: "/auth",
} as const;

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];

