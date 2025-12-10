/**
 * Auth Feature Configuration
 *
 * Central configuration for the auth feature including views, routes, and metadata.
 * Uses ViewConfig structure with lazy loading support.
 */

import { AUTH_ROUTES } from "./navigation";
import type { ViewConfig } from "@/navigation/types";
import AuthPage from "../views/auth-page";

export const authFeature = {
  id: "auth",
  name: "Authentication",
  description: "User authentication, registration, and session management",
  category: "core",
} as const;

/**
 * Auth Views Registry
 *
 * All views for the auth feature are registered here.
 * This is spread into the main VIEW_REGISTRY.
 */
export const authViews: Record<string, ViewConfig> = {
  [AUTH_ROUTES.AUTH]: {
    id: AUTH_ROUTES.AUTH,
    level: "root",
    component: AuthPage,
    metadata: {
      title: "Authentication",
      description: "User authentication and login",
    },
    requiresAuth: false,
    cacheable: true,
  },
};
