/**
 * Main Navigation Hook
 *
 * Provides navigation functionality with RBAC checks.
 * This is the primary hook for navigation in the application.
 */

import { useCallback } from "react";
import { useNavigationContext } from "../context/navigation-context";
import { getView, canAccessView } from "../registry/view-registry";
import { useAuth } from "@/shared/hooks";
import { useUserPermissions } from "@/features/dashboard/hooks";
import { getUserRoleName } from "@/shared/utils/rbac-helpers";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("use-navigation");

/**
 * Main navigation hook
 *
 * Provides navigation functionality with automatic RBAC checks.
 * Automatically verifies user permissions before allowing navigation.
 *
 * @returns Navigation context with RBAC-aware navigateTo function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { navigateTo, goBack, currentView } = useNavigation();
 *
 *   return (
 *     <button onClick={() => navigateTo("userManagement")}>
 *       Go to User Management
 *     </button>
 *   );
 * }
 * ```
 */
export function useNavigation() {
  const context = useNavigationContext();
  const { user } = useAuth();
  const { permissions } = useUserPermissions();

  /**
   * Navigate to a view with RBAC check
   */
  const navigateTo = useCallback(
    (viewId: string, params?: Record<string, unknown>) => {
      const view = getView(viewId);
      if (!view) {
        logger.warn(`View not found: ${viewId}`);
        return;
      }

      // Check access if user is authenticated
      if (user) {
        const userRole = getUserRoleName(user);
        const userPermissions = permissions || [];

        if (!canAccessView(viewId, userPermissions, userRole)) {
          logger.warn(
            `Access denied to view: ${viewId} for user: ${user.id} (role: ${userRole})`
          );
          // Optionally show a toast/notification here
          return;
        }
      } else if (view.requiresAuth) {
        logger.warn(`View requires authentication: ${viewId}`);
        return;
      }

      // Navigate if access is granted
      context.navigateTo(viewId, params);
    },
    [context, user, permissions]
  );

  const currentView = getView(context.state.currentView);

  return {
    ...context,
    navigateTo,
    currentView,
    currentViewId: context.state.currentView,
    currentParams: context.state.viewParams,
  };
}

