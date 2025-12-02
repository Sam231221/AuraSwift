/**
 * Auth Feature - Public API
 *
 * This is the main entry point for the auth feature.
 * Export all public APIs here for easy importing.
 */

// ============================================================================
// Config
// ============================================================================
export { authFeature, authViews } from "./config/feature-config";
export { AUTH_PERMISSIONS } from "./config/permissions";
export { AUTH_ROUTES } from "./config/navigation";
export type { AuthPermission } from "./config/permissions";
export type { AuthRoute } from "./config/navigation";

// ============================================================================
// Components
// ============================================================================
export * from "./components";

// ============================================================================
// Context
// ============================================================================
export { AuthContext, AuthProvider } from "./context/auth-context";

// ============================================================================
// Hooks
// ============================================================================
export { useLoginForm } from "./hooks/use-login-form";
export { useRegisterForm } from "./hooks/use-register-form";

// ============================================================================
// Views
// ============================================================================
export { default as AuthPage } from "./views/auth-page";

// ============================================================================
// Schemas
// ============================================================================
export * from "./schemas/login-schema";
export * from "./schemas/register-schema";

