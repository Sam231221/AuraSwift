/**
 * Auth Feature Configuration
 *
 * Central configuration for the auth feature including views, routes, and metadata.
 */

import { AUTH_ROUTES } from "./navigation";
import AuthPage from "@/features/auth/views/auth-page";

export const authFeature = {
  id: "auth",
  name: "Authentication",
  description: "User authentication, registration, and session management",
  category: "core",
} as const;

export const authViews = {
  auth: {
    path: AUTH_ROUTES.AUTH,
    component: AuthPage,
    title: "Authentication",
    requiresAuth: false,
  },
} as const;

