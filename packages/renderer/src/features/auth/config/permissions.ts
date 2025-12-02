/**
 * Auth Feature - Permissions
 *
 * Centralized permission definitions for the auth feature.
 * These permissions control access to authentication-related functionality.
 */

export const AUTH_PERMISSIONS = {
  // Authentication permissions
  LOGIN: "auth:login",
  REGISTER: "auth:register",
  LOGOUT: "auth:logout",
  VALIDATE_SESSION: "auth:validate_session",
  
  // User management (for creating users during registration)
  CREATE_USER: "auth:create_user",
  
  // Time tracking (clock in/out)
  CLOCK_IN: "auth:clock_in",
  CLOCK_OUT: "auth:clock_out",
} as const;

export type AuthPermission = (typeof AUTH_PERMISSIONS)[keyof typeof AUTH_PERMISSIONS];

