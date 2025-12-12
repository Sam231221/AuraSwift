/**
 * Feature Registry
 *
 * Central registry of all dashboard features.
 * This is the single source of truth for feature definitions.
 *
 * Features are automatically filtered based on user permissions.
 */

import {
  Users,
  Shield,
  Settings,
  Store,
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Package,
  Upload,
  Download,
  Trash2,
  Calendar,
  FileText,
} from "lucide-react";
import { PERMISSIONS } from "@app/shared/constants/permissions";
import type { FeatureConfig } from "../types/feature-config";

/**
 * Feature Registry
 *
 * All dashboard features with their permissions and actions.
 * Features are automatically shown/hidden based on user permissions.
 */
export const FEATURE_REGISTRY: FeatureConfig[] = [
  // ============================================================================
  // User Management
  // ============================================================================
  {
    id: "user-management",
    title: "User Management",
    description: "Manage staff and permissions",
    icon: Users,
    permissions: [PERMISSIONS.USERS_MANAGE],
    category: "management",
    order: 1,
    actions: [
      {
        id: "manage-users",
        label: "Manage Users",
        icon: Users,
        onClick: () => {}, // Will be injected by dashboard
        permissions: [PERMISSIONS.USERS_MANAGE],
      },
      {
        id: "role-permissions",
        label: "Role Permissions",
        icon: Shield,
        onClick: () => {},
        permissions: [PERMISSIONS.USERS_MANAGE],
      },
      {
        id: "user-role-assignment",
        label: "User Role Assignment",
        icon: Settings,
        onClick: () => {},
        permissions: [PERMISSIONS.USERS_MANAGE],
      },
      {
        id: "staff-schedules",
        label: "Staff Schedules",
        icon: Calendar,
        onClick: () => {},
        permissions: [PERMISSIONS.USERS_MANAGE],
      },
    ],
  },

  // ============================================================================
  // Management Actions
  // ============================================================================
  {
    id: "management-actions",
    title: "Inventory Actions",
    description: "Store operations and oversight",
    icon: Settings,
    permissions: [
      PERMISSIONS.SALES_WRITE,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.TRANSACTIONS_OVERRIDE,
      PERMISSIONS.USERS_MANAGE,
    ],
    category: "actions",
    order: 2,
    actions: [
      {
        id: "new-sale",
        label: "New Sale",
        icon: ShoppingCart,
        onClick: () => {},
        permissions: [PERMISSIONS.SALES_WRITE],
        variant: "default",
      },
      {
        id: "apply-discount",
        label: "Apply Discount",
        icon: TrendingUp,
        onClick: () => {},
        permissions: [PERMISSIONS.DISCOUNTS_APPLY],
      },
      {
        id: "manage-inventory",
        label: "Manage Inventory",
        icon: Package,
        onClick: () => {},
        permissions: [PERMISSIONS.INVENTORY_MANAGE],
      },
    ],
  },

  // ============================================================================
  // Reports & Analytics
  // ============================================================================
  {
    id: "reports-analytics",
    title: "Reports & Analytics",
    description: "Comprehensive business insights",
    icon: BarChart3,
    permissions: [PERMISSIONS.REPORTS_READ, PERMISSIONS.ANALYTICS_VIEW],
    category: "reports",
    order: 3,
    actions: [
      {
        id: "sales-reports",
        label: "Sales Reports",
        icon: BarChart3,
        onClick: () => {},
        permissions: [PERMISSIONS.REPORTS_READ],
      },
      {
        id: "performance-analytics",
        label: "Performance Analytics",
        icon: TrendingUp,
        onClick: () => {},
        permissions: [PERMISSIONS.ANALYTICS_VIEW],
      },
      {
        id: "inventory-reports",
        label: "Inventory Reports",
        icon: Package,
        onClick: () => {},
        permissions: [PERMISSIONS.REPORTS_READ],
      },
      {
        id: "staff-reports",
        label: "Staff Reports",
        icon: Users,
        onClick: () => {},
        permissions: [PERMISSIONS.REPORTS_READ],
      },
    ],
  },

  // ============================================================================
  // Advanced Reports (Admin-specific)
  // ============================================================================
  {
    id: "advanced-reports",
    title: "Advanced Reports",
    description: "Comprehensive analytics",
    icon: FileText,
    permissions: [PERMISSIONS.REPORTS_READ, PERMISSIONS.ANALYTICS_VIEW],
    category: "reports",
    order: 4,
    actions: [
      {
        id: "financial-reports",
        label: "Financial Reports",
        icon: BarChart3,
        onClick: () => {},
        permissions: [PERMISSIONS.REPORTS_READ],
      },
      {
        id: "business-intelligence",
        label: "Business Intelligence",
        icon: TrendingUp,
        onClick: () => {},
        permissions: [PERMISSIONS.ANALYTICS_VIEW],
      },
      {
        id: "user-activity-logs",
        label: "User Activity Logs",
        icon: Users,
        onClick: () => {},
        permissions: [PERMISSIONS.REPORTS_READ],
      },
    ],
  },

  // ============================================================================
  // System Settings
  // ============================================================================
  {
    id: "system-settings",
    title: "System Settings",
    description: "Configure system preferences",
    icon: Settings,
    permissions: [PERMISSIONS.SETTINGS_MANAGE],
    category: "settings",
    order: 5,
    actions: [
      {
        id: "general-settings",
        label: "General Settings",
        icon: Settings,
        onClick: () => {},
        permissions: [PERMISSIONS.SETTINGS_MANAGE],
      },
      {
        id: "store-configuration",
        label: "Terminal Configuration",
        icon: Store,
        onClick: () => {},
        permissions: [PERMISSIONS.SETTINGS_MANAGE],
      },
      {
        id: "security-settings",
        label: "Security Settings",
        icon: Shield,
        onClick: () => {},
        permissions: [PERMISSIONS.SETTINGS_MANAGE],
      },
    ],
  },

  // ============================================================================
  // Database Management
  // ============================================================================
  {
    id: "database-management",
    title: "DB Management",
    description: "Database backup and maintenance",
    icon: Download,
    permissions: [PERMISSIONS.SETTINGS_MANAGE], // Only admins typically have this
    category: "settings",
    order: 6,
    actions: [
      {
        id: "import-database",
        label: "Import Database",
        icon: Upload,
        onClick: () => {},
        permissions: [PERMISSIONS.SETTINGS_MANAGE],
      },
      {
        id: "backup-database",
        label: "Backup Database",
        icon: Download,
        onClick: () => {},
        permissions: [PERMISSIONS.SETTINGS_MANAGE],
      },
      {
        id: "empty-database",
        label: "Empty Database",
        icon: Trash2,
        onClick: () => {},
        permissions: [PERMISSIONS.SETTINGS_MANAGE],
        variant: "destructive",
      },
    ],
  },

  // ============================================================================
  // Quick Actions
  // ============================================================================
  {
    id: "quick-actions",
    title: "Quick Actions",
    description: "Common tasks",
    icon: ShoppingCart,
    permissions: [PERMISSIONS.SALES_WRITE, PERMISSIONS.USERS_MANAGE],
    category: "actions",
    order: 7,
    actions: [
      {
        id: "quick-new-sale",
        label: "New Sale",
        icon: ShoppingCart,
        onClick: () => {},
        permissions: [PERMISSIONS.SALES_WRITE],
        variant: "default",
      },
      {
        id: "quick-manage-users",
        label: "Manage Users",
        icon: Users,
        onClick: () => {},
        permissions: [PERMISSIONS.USERS_MANAGE],
      },
    ],
  },
];

/**
 * Get features by category
 *
 * @param category - Feature category to filter by
 * @returns Array of features in the specified category
 */
export function getFeaturesByCategory(
  category: FeatureConfig["category"]
): FeatureConfig[] {
  return FEATURE_REGISTRY.filter((feature) => feature.category === category);
}

/**
 * Get feature by ID
 *
 * @param id - Feature ID
 * @returns Feature configuration or undefined
 */
export function getFeatureById(id: string): FeatureConfig | undefined {
  return FEATURE_REGISTRY.find((feature) => feature.id === id);
}

/**
 * Get all feature IDs
 *
 * @returns Array of all feature IDs
 */
export function getAllFeatureIds(): string[] {
  return FEATURE_REGISTRY.map((feature) => feature.id);
}
