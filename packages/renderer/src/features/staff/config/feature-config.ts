/**
 * Staff Feature Configuration
 *
 * Central configuration for the staff feature.
 * This is used by the navigation system and dashboard.
 */

import { Users } from "lucide-react";
import { STAFF_PERMISSIONS } from "./permissions";
import { STAFF_ROUTES } from "./navigation";
import type { FeatureConfig } from "@/features/dashboard/types/feature-config";
import type { ViewConfig } from "@/navigation/types";

/**
 * Staff Feature Configuration for Dashboard
 */
export const staffFeature: FeatureConfig = {
  id: "staff-management",
  title: "Staff Management",
  description: "Manage cashiers and staff schedules",
  icon: Users,
  permissions: [STAFF_PERMISSIONS.MANAGE],
  category: "management",
  order: 3,
  actions: [
    {
      id: "manage-cashiers",
      label: "Manage Cashiers",
      icon: Users,
      onClick: () => {}, // Will be injected by dashboard
      permissions: [STAFF_PERMISSIONS.MANAGE],
    },
    {
      id: "staff-schedules",
      label: "Staff Schedules",
      icon: Users,
      onClick: () => {},
      permissions: [STAFF_PERMISSIONS.MANAGE],
    },
  ],
};

/**
 * Staff Views Registry
 *
 * All views for the staff feature are registered here.
 * This is spread into the main VIEW_REGISTRY.
 */
export const staffViews: Record<string, ViewConfig> = {
  [STAFF_ROUTES.MANAGE_CASHIERS]: {
    id: STAFF_ROUTES.MANAGE_CASHIERS,
    level: "root",
    componentLoader: () => import("../views/manage-cashier-view"),
    metadata: {
      title: "Cashier Management",
      description: "Manage cashiers",
    },
    permissions: [STAFF_PERMISSIONS.MANAGE],
    roles: ["admin", "manager"],
    requiresAuth: true,
    preloadStrategy: "preload",
    loadPriority: 7,
    cacheable: true,
  },
  [STAFF_ROUTES.SCHEDULES]: {
    id: STAFF_ROUTES.SCHEDULES,
    level: "root",
    componentLoader: () => import("../views/staff-schedules-view"),
    metadata: {
      title: "Staff Schedules",
      description: "Manage staff schedules",
    },
    permissions: [STAFF_PERMISSIONS.MANAGE],
    roles: ["admin", "manager"],
    requiresAuth: true,
    preloadStrategy: "prefetch",
    loadPriority: 5,
    cacheable: true,
  },
};
