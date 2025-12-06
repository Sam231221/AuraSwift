/**
 * Inventory Feature Configuration
 *
 * Central configuration for the inventory feature.
 * This is used by the navigation system and dashboard.
 */

import { Package } from "lucide-react";
import { INVENTORY_PERMISSIONS } from "./permissions";
import { INVENTORY_ROUTES } from "./navigation";
// eslint-disable-next-line no-restricted-imports
import type { FeatureConfig } from "@/features/dashboard/types/feature-config";
import type { ViewConfig } from "@/navigation/types";

/**
 * Inventory Feature Configuration for Dashboard
 */
export const inventoryFeature: FeatureConfig = {
  id: "inventory",
  title: "Inventory Management",
  description: "Manage products, batches, and stock levels",
  icon: Package,
  permissions: [INVENTORY_PERMISSIONS.READ, INVENTORY_PERMISSIONS.MANAGE],
  category: "management",
  order: 1,
  actions: [
    {
      id: "view-products",
      label: "View Products",
      icon: Package,
      onClick: () => {}, // Will be injected by dashboard
      permissions: [INVENTORY_PERMISSIONS.READ],
    },
    {
      id: "manage-products",
      label: "Manage Products",
      icon: Package,
      onClick: () => {},
      permissions: [INVENTORY_PERMISSIONS.MANAGE],
    },
    {
      id: "manage-batches",
      label: "Manage Batches",
      icon: Package,
      onClick: () => {},
      permissions: [INVENTORY_PERMISSIONS.MANAGE_BATCHES],
    },
    {
      id: "manage-categories",
      label: "Manage Categories",
      icon: Package,
      onClick: () => {},
      permissions: [INVENTORY_PERMISSIONS.MANAGE_CATEGORIES],
    },
  ],
};

/**
 * View Registry for Inventory Feature
 *
 * All views in the inventory feature are registered here.
 * This is used by the navigation system.
 *
 * NOTE: These will be updated to use new view locations after migration.
 */
export const inventoryViews: Record<string, ViewConfig> = {
  // Main product management view (will become inventory dashboard)
  [INVENTORY_ROUTES.DASHBOARD]: {
    id: INVENTORY_ROUTES.DASHBOARD,
    level: "root",
    componentLoader: () => import("../views/product-management-view"),
    metadata: {
      title: "Inventory Dashboard",
      description: "Overview of inventory status",
    },
    permissions: [INVENTORY_PERMISSIONS.READ],
    requiresAuth: true,
    preloadStrategy: "preload",
    loadPriority: 9,
    cacheable: true,
  },

  // Product management view
  [INVENTORY_ROUTES.PRODUCT_MANAGEMENT]: {
    id: INVENTORY_ROUTES.PRODUCT_MANAGEMENT,
    level: "root",
    componentLoader: () =>
      import("../wrappers/product-management-wrapper").then((m) => ({
        default: m.ProductManagementWrapper,
      })),
    metadata: {
      title: "Product Management",
      description: "Manage products and inventory",
    },
    permissions: [INVENTORY_PERMISSIONS.MANAGE],
    roles: ["admin", "manager"],
    requiresAuth: true,
    preloadStrategy: "preload",
    loadPriority: 8,
    cacheable: true,
  },

  // Nested views within Product Management
  [INVENTORY_ROUTES.PRODUCT_DASHBOARD]: {
    id: INVENTORY_ROUTES.PRODUCT_DASHBOARD,
    level: "nested",
    parentId: INVENTORY_ROUTES.PRODUCT_MANAGEMENT,
    componentLoader: () => import("../views/inventory-dashboard-view"),
    metadata: {
      title: "Product Dashboard",
      breadcrumb: "Dashboard",
    },
    permissions: [INVENTORY_PERMISSIONS.READ],
    requiresAuth: true,
    preloadStrategy: "preload",
    loadPriority: 7,
    cacheable: true,
  },

  [INVENTORY_ROUTES.PRODUCT_LIST]: {
    id: INVENTORY_ROUTES.PRODUCT_LIST,
    level: "nested",
    parentId: INVENTORY_ROUTES.PRODUCT_MANAGEMENT,
    componentLoader: () => import("../views/product-management-view"),
    metadata: {
      title: "Product List",
      breadcrumb: "Products",
    },
    permissions: [INVENTORY_PERMISSIONS.READ],
    requiresAuth: true,
    preloadStrategy: "preload",
    loadPriority: 6,
    cacheable: true,
  },

  [INVENTORY_ROUTES.PRODUCT_DETAILS_NESTED]: {
    id: INVENTORY_ROUTES.PRODUCT_DETAILS_NESTED,
    level: "nested",
    parentId: INVENTORY_ROUTES.PRODUCT_MANAGEMENT,
    componentLoader: () => import("../views/product-details-view"),
    metadata: {
      title: "Product Details",
      breadcrumb: "Details",
    },
    permissions: [INVENTORY_PERMISSIONS.READ],
    requiresAuth: true,
    defaultParams: { productId: null },
    preloadStrategy: "prefetch",
    loadPriority: 5,
    cacheable: true,
  },

  // Category management
  [INVENTORY_ROUTES.CATEGORY_MANAGEMENT]: {
    id: INVENTORY_ROUTES.CATEGORY_MANAGEMENT,
    level: "nested",
    parentId: INVENTORY_ROUTES.PRODUCT_MANAGEMENT,
    componentLoader: () => import("../views/category-management-view"),
    metadata: {
      title: "Category Management",
      breadcrumb: "Categories",
    },
    permissions: [INVENTORY_PERMISSIONS.MANAGE_CATEGORIES],
    requiresAuth: true,
    preloadStrategy: "prefetch",
    loadPriority: 4,
    cacheable: true,
  },

  // Batch management
  [INVENTORY_ROUTES.BATCH_MANAGEMENT]: {
    id: INVENTORY_ROUTES.BATCH_MANAGEMENT,
    level: "nested",
    parentId: INVENTORY_ROUTES.PRODUCT_MANAGEMENT,
    componentLoader: () =>
      import("../wrappers/batch-management-wrapper").then((m) => ({
        default: m.BatchManagementWrapper,
      })),
    metadata: {
      title: "Batch Management",
      breadcrumb: "Batches",
    },
    permissions: [INVENTORY_PERMISSIONS.READ],
    requiresAuth: true,
    preloadStrategy: "preload",
    loadPriority: 6,
    cacheable: true,
  },

  // Nested views within Batch Management
  [INVENTORY_ROUTES.BATCH_DASHBOARD]: {
    id: INVENTORY_ROUTES.BATCH_DASHBOARD,
    level: "nested",
    parentId: INVENTORY_ROUTES.BATCH_MANAGEMENT,
    componentLoader: () => import("../views/batch-management-view"),
    metadata: {
      title: "Batch Dashboard",
      breadcrumb: "Dashboard",
    },
    permissions: [INVENTORY_PERMISSIONS.READ],
    requiresAuth: true,
    preloadStrategy: "preload",
    loadPriority: 7,
    cacheable: true,
  },

  [INVENTORY_ROUTES.BATCH_LIST]: {
    id: INVENTORY_ROUTES.BATCH_LIST,
    level: "nested",
    parentId: INVENTORY_ROUTES.BATCH_MANAGEMENT,
    componentLoader: () => import("../views/batch-management-view"),
    metadata: {
      title: "Batch List",
      breadcrumb: "All Batches",
    },
    permissions: [INVENTORY_PERMISSIONS.READ],
    requiresAuth: true,
    preloadStrategy: "preload",
    loadPriority: 6,
    cacheable: true,
  },

  [INVENTORY_ROUTES.EXPIRY_ALERTS]: {
    id: INVENTORY_ROUTES.EXPIRY_ALERTS,
    level: "nested",
    parentId: INVENTORY_ROUTES.BATCH_MANAGEMENT,
    componentLoader: () =>
      import("../views/expiry-dashboard-view").then((m) => ({
        default: m.ExpiryDashboardView,
      })),
    metadata: {
      title: "Expiry Alerts",
      breadcrumb: "Alerts",
    },
    permissions: [INVENTORY_PERMISSIONS.READ],
    requiresAuth: true,
    preloadStrategy: "prefetch",
    loadPriority: 3,
    cacheable: true,
  },

  // Stock movement history
  [INVENTORY_ROUTES.STOCK_MOVEMENT_HISTORY]: {
    id: INVENTORY_ROUTES.STOCK_MOVEMENT_HISTORY,
    level: "nested",
    parentId: INVENTORY_ROUTES.PRODUCT_MANAGEMENT,
    componentLoader: () => import("../views/stock-movement-history-view"),
    metadata: {
      title: "Stock Movement History",
      breadcrumb: "History",
    },
    permissions: [INVENTORY_PERMISSIONS.VIEW_HISTORY],
    requiresAuth: true,
    preloadStrategy: "prefetch",
    loadPriority: 3,
    cacheable: true,
  },
};
