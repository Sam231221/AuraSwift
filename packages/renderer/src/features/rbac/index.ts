/**
 * RBAC Feature - Public API
 *
 * This is the main entry point for the RBAC feature.
 * Export all public APIs here for easy importing.
 */

// ============================================================================
// Config
// ============================================================================
export { rbacFeature, rbacViews } from "./config/feature-config";
export { RBAC_PERMISSIONS } from "./config/permissions";
export { RBAC_ROUTES } from "./config/navigation";
export type { RbacPermission } from "./config/permissions";
export type { RbacRoute } from "./config/navigation";

// ============================================================================
// Components
// ============================================================================
export {
  RoleCard,
  CreateRoleDialog,
  EditRoleDialog,
  DeleteRoleDialog,
  AssignRoleDialog,
  UserRolesList,
  ViewRoleUsersDialog,
} from "./components";

// ============================================================================
// Hooks
// ============================================================================
export * from "./hooks";

// ============================================================================
// Views
// ============================================================================
export { default as RoleManagementView } from "./views/role-management-view";
export { default as UserRoleAssignmentView } from "./views/user-role-assignment-view";

// ============================================================================
// Schemas
// ============================================================================
export * from "./schemas";

