/**
 * Users Feature - Public API
 *
 * This is the main entry point for the users feature.
 * Export all public APIs here for easy importing.
 */

// ============================================================================
// Config
// ============================================================================
export { usersFeature, usersViews } from "./config/feature-config";
export { USERS_PERMISSIONS } from "./config/permissions";
export { USERS_ROUTES } from "./config/navigation";
export type { UsersPermission } from "./config/permissions";
export type { UsersRoute } from "./config/navigation";

// ============================================================================
// Components
// ============================================================================
export * from "./components";

// ============================================================================
// Hooks
// ============================================================================
export * from "./hooks";

// ============================================================================
// Views
// ============================================================================
export { default as UserManagementView } from "./views/user-management-view";

// ============================================================================
// Schemas
// ============================================================================
export * from "./schemas";

// ============================================================================
// Utils
// ============================================================================
export * from "./utils";

