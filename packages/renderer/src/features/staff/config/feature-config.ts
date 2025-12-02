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

// Import views from new location
import ManageCashierView from "../views/manage-cashier-view";
import StaffSchedulesView from "../views/staff-schedules-view";

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
    component: ManageCashierView,
    metadata: {
      title: "Cashier Management",
      description: "Manage cashiers",
    },
    permissions: [STAFF_PERMISSIONS.MANAGE],
    roles: ["admin", "manager"],
    requiresAuth: true,
  },
  // Legacy route for backward compatibility
  cashierManagement: {
    id: "cashierManagement",
    level: "root",
    component: ManageCashierView,
    metadata: {
      title: "Cashier Management",
      description: "Manage cashiers",
    },
    permissions: [STAFF_PERMISSIONS.MANAGE],
    roles: ["admin", "manager"],
    requiresAuth: true,
  },
  [STAFF_ROUTES.SCHEDULES]: {
    id: STAFF_ROUTES.SCHEDULES,
    level: "root",
    component: StaffSchedulesView,
    metadata: {
      title: "Staff Schedules",
      description: "Manage staff schedules",
    },
    permissions: [STAFF_PERMISSIONS.MANAGE],
    roles: ["admin", "manager"],
    requiresAuth: true,
  },
  // Legacy route for backward compatibility
  staffSchedules: {
    id: "staffSchedules",
    level: "root",
    component: StaffSchedulesView,
    metadata: {
      title: "Staff Schedules",
      description: "Manage staff schedules",
    },
    permissions: [STAFF_PERMISSIONS.MANAGE],
    roles: ["admin", "manager"],
    requiresAuth: true,
  },
};

