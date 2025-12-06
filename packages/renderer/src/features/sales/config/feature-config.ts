/**
 * Sales Feature Configuration
 *
 * Central configuration for the sales feature.
 * This is used by the navigation system and dashboard.
 */

import { ShoppingCart } from "lucide-react";
import { SALES_PERMISSIONS } from "./permissions";
import { SALES_ROUTES } from "./navigation";
import type { FeatureConfig } from "@/features/dashboard/types/feature-config";
import type { ViewConfig } from "@/navigation/types";

/**
 * Sales Feature Configuration for Dashboard
 */
export const salesFeature: FeatureConfig = {
  id: "sales",
  title: "Sales",
  description: "Process sales transactions",
  icon: ShoppingCart,
  permissions: [SALES_PERMISSIONS.READ, SALES_PERMISSIONS.WRITE],
  category: "actions",
  order: 0,
  actions: [
    {
      id: "new-sale",
      label: "New Sale",
      icon: ShoppingCart,
      onClick: () => {}, // Will be injected by dashboard
      permissions: [SALES_PERMISSIONS.WRITE],
    },
  ],
};

/**
 * Sales Views Registry
 *
 * All views for the sales feature are registered here.
 * This is spread into the main VIEW_REGISTRY.
 */
export const salesViews: Record<string, ViewConfig> = {
  [SALES_ROUTES.NEW_TRANSACTION]: {
    id: SALES_ROUTES.NEW_TRANSACTION,
    level: "root",
    componentLoader: () => import("../views/new-transaction-view"),
    metadata: {
      title: "New Transaction",
      description: "Create a new sale",
    },
    permissions: [SALES_PERMISSIONS.WRITE],
    requiresAuth: true,
    defaultParams: { embeddedInDashboard: true },
    preloadStrategy: "eager",
    loadPriority: 10,
    cacheable: true,
  },
  [SALES_ROUTES.CASHIER_DASHBOARD]: {
    id: SALES_ROUTES.CASHIER_DASHBOARD,
    level: "root",
    componentLoader: () =>
      import("@/features/dashboard/views/cashier-dashboard-view"),
    metadata: {
      title: "Cashier Dashboard",
      description: "Cashier dashboard",
    },
    permissions: [SALES_PERMISSIONS.READ],
    requiresAuth: true,
    preloadStrategy: "preload",
    loadPriority: 9,
    cacheable: true,
  },
};
