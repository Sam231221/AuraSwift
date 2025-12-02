/**
 * Dashboard Features
 *
 * Central export for all dashboard-related features, components, and hooks.
 */

// Components
export {
  FeatureCard,
  DashboardGrid,
  StatsCards,
  ManagerStatsCards,
} from "./components";

// Feature Components
export {
  UserManagementCard,
  ManagementActionsCard,
  ReportsAnalyticsCard,
  AdvancedReportsCard,
  SystemSettingsCard,
  DatabaseManagementCard,
  QuickActionsCard,
} from "./features";

// Hooks
export { useUserPermissions, useFeatureVisibility } from "./hooks";

// Registry
export {
  FEATURE_REGISTRY,
  getFeaturesByCategory,
  getFeatureById,
  getAllFeatureIds,
} from "./registry";

// Types
export type {
  FeatureConfig,
  FeatureAction,
  FeatureStats,
  FeatureCategory,
} from "./types";

// Views
export {
  DashboardView,
  AdminDashboardView,
  CashierDashboardView,
  ManagerDashboardView,
} from "./views";
