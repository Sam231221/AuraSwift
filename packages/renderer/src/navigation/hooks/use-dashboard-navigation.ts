/**
 * Dashboard Navigation Hook
 *
 * Hook for dashboard-specific navigation.
 * Maps feature actions to views and provides navigation functionality.
 */

import { useCallback } from "react";
import { useNavigation } from "./use-navigation";
import { mapActionToView } from "../utils/navigation-mapper";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("use-dashboard-navigation");

/**
 * Hook for dashboard navigation
 *
 * Provides navigation functionality that maps feature actions to views.
 * Used by dashboard pages to handle feature card clicks.
 *
 * @returns Navigation handler function
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const handleActionClick = useDashboardNavigation();
 *
 *   return (
 *     <DashboardGrid
 *       features={FEATURE_REGISTRY}
 *       onActionClick={handleActionClick}
 *     />
 *   );
 * }
 * ```
 */
export function useDashboardNavigation() {
  const { navigateTo } = useNavigation();

  const handleActionClick = useCallback(
    (featureId: string, actionId: string) => {
      const viewId = mapActionToView(featureId, actionId);

      if (viewId) {
        navigateTo(viewId);
      }
      // No view mapping - action may be handled elsewhere (e.g., modals, dialogs)
    },
    [navigateTo]
  );

  return handleActionClick;
}
