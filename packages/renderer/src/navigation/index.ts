/**
 * Navigation System
 *
 * Centralized navigation system for the Electron desktop application.
 * Provides type-safe, hierarchical view navigation with RBAC support.
 *
 * @module navigation
 */

// Context & Provider
export {
  NavigationContext,
  useNavigationContext,
  NavigationProvider,
} from "./context";

// Hooks
export { useNavigation, useNestedNavigation } from "./hooks";

// Registry
export {
  VIEW_REGISTRY,
  getView,
  getRootViews,
  getNestedViews,
  getViewHierarchy,
  canAccessView,
} from "./registry";

// Components
export {
  NavigationContainer,
  NestedViewContainer,
} from "./components";

// Types
export type {
  ViewLevel,
  ViewMetadata,
  ViewConfig,
  NavigationState,
  NavigationContextValue,
} from "./types";

