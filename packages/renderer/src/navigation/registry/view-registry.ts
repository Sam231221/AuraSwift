/**
 * Central View Registry
 *
 * Single source of truth for all views in the application.
 * Views are organized hierarchically with parent-child relationships.
 */

import React from "react";
import type { ViewConfig, ViewComponentProps } from "../types/navigation.types";

// Placeholder component for nested views that are rendered internally by their parent views
// These views are never actually rendered by the navigation system, but are registered
// for metadata, permissions, and navigation purposes.
const PlaceholderComponent: React.FC<ViewComponentProps> = () => {
  return null;
};

// Import actual view components
import NewTransactionView from "@/views/dashboard/pages/cashier/views/new-transaction";
import ProductManagementView from "@/views/dashboard/pages/manager/views/stock/manage-product-view";
import UserManagementView from "@/views/dashboard/pages/admin/views/user-management-view";
import StaffSchedulesView from "@/views/dashboard/pages/manager/views/staff-schedules-view";
import CashierManagementView from "@/views/dashboard/pages/manager/views/manage-cashier-view";
import RoleManagementView from "@/views/dashboard/pages/admin/views/role-management-view";
import UserRoleAssignmentView from "@/views/dashboard/pages/admin/views/user-role-assignment-view";
import GeneralSettingsView from "@/views/dashboard/pages/admin/views/general-settings-view";
import ManageCategoriesView from "@/views/dashboard/pages/manager/views/stock/manage-categories-view";
import BatchManagementView from "@/views/dashboard/pages/manager/views/stock/product-batch-management-view";
import StockMovementHistoryView from "@/views/dashboard/pages/manager/views/stock/stock-movement-history-view";

// Wrapper components that use navigation hook
import { DashboardPageWrapper } from "../components/dashboard-page-wrapper";

/**
 * Central View Registry
 *
 * All views in the application are registered here with their configuration.
 * Views can be organized hierarchically using parentId.
 */
export const VIEW_REGISTRY: Record<string, ViewConfig> = {
  // ============================================================================
  // Root Level Views
  // ============================================================================
  dashboard: {
    id: "dashboard",
    level: "root",
    component: DashboardPageWrapper,
    metadata: {
      title: "Dashboard",
      description: "Main dashboard",
    },
    requiresAuth: true,
  },

  // ============================================================================
  // Transaction Views
  // ============================================================================
  newTransaction: {
    id: "newTransaction",
    level: "root",
    component: NewTransactionView,
    metadata: {
      title: "New Transaction",
      description: "Create a new sale",
    },
    permissions: ["sales:write"],
    requiresAuth: true,
    defaultParams: { embeddedInDashboard: true },
  },

  // ============================================================================
  // User Management Views
  // ============================================================================
  userManagement: {
    id: "userManagement",
    level: "root",
    component: UserManagementView,
    metadata: {
      title: "User Management",
      description: "Manage staff users",
    },
    permissions: ["users:manage"],
    roles: ["admin"],
    requiresAuth: true,
  },

  roleManagement: {
    id: "roleManagement",
    level: "root",
    component: RoleManagementView,
    metadata: {
      title: "Role Management",
      description: "Manage RBAC roles",
    },
    permissions: ["users:manage"],
    roles: ["admin"],
    requiresAuth: true,
  },

  userRoleAssignment: {
    id: "userRoleAssignment",
    level: "root",
    component: UserRoleAssignmentView,
    metadata: {
      title: "User Role Assignment",
      description: "Assign roles to users",
    },
    permissions: ["users:manage"],
    roles: ["admin"],
    requiresAuth: true,
  },

  // ============================================================================
  // Inventory/Product Management Views (Hierarchical)
  // ============================================================================
  productManagement: {
    id: "productManagement",
    level: "root",
    component: ProductManagementView,
    metadata: {
      title: "Product Management",
      description: "Manage products and inventory",
    },
    permissions: ["inventory:manage"],
    roles: ["admin", "manager"],
    requiresAuth: true,
  },

  // Nested views within Product Management
  // Note: These views are rendered by ProductManagementView based on nested navigation state
  // The actual components are managed internally by ProductManagementView
  productDashboard: {
    id: "productDashboard",
    level: "nested",
    parentId: "productManagement",
    component: PlaceholderComponent, // Rendered internally by ProductManagementView
    metadata: {
      title: "Product Dashboard",
      breadcrumb: "Dashboard",
    },
    permissions: ["inventory:read"],
    requiresAuth: true,
  },

  productList: {
    id: "productList",
    level: "nested",
    parentId: "productManagement",
    component: PlaceholderComponent, // Rendered internally by ProductManagementView
    metadata: {
      title: "Product List",
      breadcrumb: "Products",
    },
    permissions: ["inventory:read"],
    requiresAuth: true,
  },

  productDetails: {
    id: "productDetails",
    level: "nested",
    parentId: "productManagement",
    component: PlaceholderComponent, // Rendered internally by ProductManagementView
    metadata: {
      title: "Product Details",
      breadcrumb: "Details",
    },
    permissions: ["inventory:read"],
    requiresAuth: true,
    defaultParams: { productId: null },
  },

  categoryManagement: {
    id: "categoryManagement",
    level: "nested",
    parentId: "productManagement",
    component: ManageCategoriesView,
    metadata: {
      title: "Category Management",
      breadcrumb: "Categories",
    },
    permissions: ["inventory:manage"],
    requiresAuth: true,
  },

  batchManagement: {
    id: "batchManagement",
    level: "nested",
    parentId: "productManagement",
    component: BatchManagementView,
    metadata: {
      title: "Batch Management",
      breadcrumb: "Batches",
    },
    permissions: ["inventory:read"],
    requiresAuth: true,
  },

  // Nested views within Batch Management
  // Note: These views are rendered by BatchManagementView based on nested navigation state
  // The actual components are managed internally by BatchManagementView
  batchDashboard: {
    id: "batchDashboard",
    level: "nested",
    parentId: "batchManagement",
    component: PlaceholderComponent, // Rendered internally by BatchManagementView
    metadata: {
      title: "Batch Dashboard",
      breadcrumb: "Dashboard",
    },
    permissions: ["inventory:read"],
    requiresAuth: true,
  },

  batchList: {
    id: "batchList",
    level: "nested",
    parentId: "batchManagement",
    component: PlaceholderComponent, // Rendered internally by BatchManagementView
    metadata: {
      title: "Batch List",
      breadcrumb: "All Batches",
    },
    permissions: ["inventory:read"],
    requiresAuth: true,
  },

  expiryAlerts: {
    id: "expiryAlerts",
    level: "nested",
    parentId: "batchManagement",
    component: PlaceholderComponent, // Rendered internally by BatchManagementView
    metadata: {
      title: "Expiry Alerts",
      breadcrumb: "Alerts",
    },
    permissions: ["inventory:read"],
    requiresAuth: true,
  },

  stockMovementHistory: {
    id: "stockMovementHistory",
    level: "nested",
    parentId: "productManagement",
    component: StockMovementHistoryView,
    metadata: {
      title: "Stock Movement History",
      breadcrumb: "History",
    },
    permissions: ["inventory:read"],
    requiresAuth: true,
  },

  // ============================================================================
  // Staff Management Views
  // ============================================================================
  cashierManagement: {
    id: "cashierManagement",
    level: "root",
    component: CashierManagementView,
    metadata: {
      title: "Cashier Management",
      description: "Manage cashiers",
    },
    permissions: ["users:manage"],
    roles: ["admin", "manager"],
    requiresAuth: true,
  },

  staffSchedules: {
    id: "staffSchedules",
    level: "root",
    component: StaffSchedulesView,
    metadata: {
      title: "Staff Schedules",
      description: "Manage staff schedules",
    },
    permissions: ["users:manage"],
    roles: ["admin", "manager"],
    requiresAuth: true,
  },

  // ============================================================================
  // Settings Views
  // ============================================================================
  generalSettings: {
    id: "generalSettings",
    level: "root",
    component: GeneralSettingsView,
    metadata: {
      title: "General Settings",
      description: "System settings",
    },
    permissions: ["settings:manage"],
    roles: ["admin"],
    requiresAuth: true,
  },
};

/**
 * Get view by ID
 *
 * @param viewId - View identifier
 * @returns View configuration or undefined
 */
export function getView(viewId: string): ViewConfig | undefined {
  return VIEW_REGISTRY[viewId];
}

/**
 * Get all root-level views
 *
 * @returns Array of root view configurations
 */
export function getRootViews(): ViewConfig[] {
  return Object.values(VIEW_REGISTRY).filter((view) => view.level === "root");
}

/**
 * Get nested views for a parent view
 *
 * @param parentId - Parent view ID
 * @returns Array of nested view configurations
 */
export function getNestedViews(parentId: string): ViewConfig[] {
  return Object.values(VIEW_REGISTRY).filter(
    (view) => view.parentId === parentId
  );
}

/**
 * Get view hierarchy path (breadcrumb trail)
 *
 * @param viewId - View identifier
 * @returns Array of view configurations from root to target view
 */
export function getViewHierarchy(viewId: string): ViewConfig[] {
  const hierarchy: ViewConfig[] = [];
  let currentView = getView(viewId);

  while (currentView) {
    hierarchy.unshift(currentView);
    if (currentView.parentId) {
      currentView = getView(currentView.parentId);
    } else {
      break;
    }
  }

  return hierarchy;
}

/**
 * Check if user can access view based on RBAC
 *
 * @param viewId - View identifier
 * @param userPermissions - User's permissions array
 * @param userRole - User's role name
 * @returns Whether user can access the view
 */
export function canAccessView(
  viewId: string,
  userPermissions: string[],
  userRole: string
): boolean {
  const view = getView(viewId);
  if (!view) return false;

  // Check authentication requirement
  if (view.requiresAuth && !userPermissions.length && !userRole) {
    return false;
  }

  // Check role-based access
  if (view.roles && view.roles.length > 0) {
    if (!view.roles.includes(userRole)) {
      return false;
    }
  }

  // Check permission-based access
  if (view.permissions && view.permissions.length > 0) {
    // Check for wildcard permission (admin has all)
    if (userPermissions.includes("*:*")) return true;

    // Check for any matching permission
    const hasPermission = view.permissions.some((perm) => {
      // Exact match
      if (userPermissions.includes(perm)) return true;

      // Wildcard checks
      const [action, resource] = perm.split(":");
      if (action && resource) {
        // Action wildcard (e.g., "manage:*" covers "manage:users")
        if (userPermissions.includes(`${action}:*`)) return true;
        // Resource wildcard (e.g., "*:users" covers "manage:users")
        if (userPermissions.includes(`*:${resource}`)) return true;
      }

      return false;
    });

    if (!hasPermission) return false;
  }

  return true;
}
