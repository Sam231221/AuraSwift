/**
 * Navigation Container
 *
 * Main navigation container component.
 * Renders the current view based on navigation state.
 * Now supports lazy loading with ViewWrapper.
 */

import { useMemo } from "react";
import { useNavigation } from "../hooks/use-navigation";
import { getView } from "../registry/view-registry";
import { ViewWrapper } from "./view-wrapper";
import { ViewTransitionContainer } from "@/components/view-transition-container";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("navigation-container");

/**
 * Main navigation container
 *
 * Renders the current view based on navigation state.
 * Handles view transitions and parameter passing.
 * Uses ViewWrapper for lazy loading and error boundaries.
 *
 * @example
 * ```tsx
 * <NavigationProvider>
 *   <NavigationContainer />
 * </NavigationProvider>
 * ```
 */
export function NavigationContainer() {
  const { currentViewId, currentParams, goBack } = useNavigation();
  const view = getView(currentViewId);

  const viewComponent = useMemo(() => {
    if (!view) {
      logger.error(`View not found: ${currentViewId}`);
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">View Not Found</h2>
            <p className="text-muted-foreground">
              The view "{currentViewId}" could not be found.
            </p>
          </div>
        </div>
      );
    }

    // Merge default params with current params
    const mergedParams = {
      ...view.defaultParams,
      ...currentParams,
    };

    // Use ViewWrapper for lazy loading and error boundaries
    return <ViewWrapper config={view} params={mergedParams} onBack={goBack} />;
  }, [view, currentViewId, currentParams, goBack]);

  if (!view) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">View Not Found</h2>
          <p className="text-muted-foreground">
            The view "{currentViewId}" could not be found in the registry.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Check the console for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ViewTransitionContainer
      currentView={currentViewId}
      views={{ [currentViewId]: viewComponent }}
    />
  );
}
