/**
 * Navigation Provider
 *
 * Provides navigation state management to the application.
 * Manages view history, current view, and nested navigation states.
 */

import { useState, useCallback, useMemo, type ReactNode } from "react";
import { NavigationContext } from "./navigation-context";
import type {
  NavigationState,
  NavigationContextValue,
} from "../types/navigation.types";
import { getView } from "../registry/view-registry";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("navigation-provider");

/**
 * Maximum number of views to keep in navigation history
 * Prevents unbounded memory growth from navigation history
 */
const MAX_HISTORY_LENGTH = 50;

interface NavigationProviderProps {
  /** Child components */
  children: ReactNode;
  /** Initial view to display */
  initialView?: string;
}

/**
 * Navigation Provider Component
 *
 * Manages global navigation state including:
 * - Current view
 * - View history (for back navigation)
 * - View parameters
 * - Nested navigation states
 *
 * @example
 * ```tsx
 * <NavigationProvider initialView="dashboard">
 *   <App />
 * </NavigationProvider>
 * ```
 */
export function NavigationProvider({
  children,
  initialView = "dashboard",
}: NavigationProviderProps) {
  const [state, setState] = useState<NavigationState>({
    currentView: initialView,
    viewHistory: [initialView],
    viewParams: {},
    nestedViews: {},
  });

  /**
   * Navigate to a view
   */
  const navigateTo = useCallback(
    (viewId: string, params?: Record<string, unknown>) => {
      const view = getView(viewId);
      if (!view) {
        logger.warn(`View not found: ${viewId}`);
        return;
      }

      logger.info(`Navigating to view: ${viewId}`, params);

      setState((prev) => ({
        ...prev,
        currentView: viewId,
        viewHistory: [...prev.viewHistory, viewId].slice(-MAX_HISTORY_LENGTH),
        viewParams: params || {},
      }));
    },
    []
  );

  /**
   * Navigate back to previous view
   */
  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.viewHistory.length <= 1) {
        logger.warn("Cannot go back: already at root view");
        return prev;
      }

      const newHistory = [...prev.viewHistory];
      newHistory.pop(); // Remove current view
      const previousView = newHistory[newHistory.length - 1];

      logger.info(`Navigating back to: ${previousView}`);

      return {
        ...prev,
        currentView: previousView,
        viewHistory: newHistory,
        viewParams: {},
      };
    });
  }, []);

  /**
   * Navigate to root view
   */
  const goToRoot = useCallback(() => {
    logger.info(`Navigating to root view: ${initialView}`);

    setState((prev) => ({
      ...prev,
      currentView: initialView,
      viewHistory: [initialView],
      viewParams: {},
      nestedViews: {},
    }));
  }, [initialView]);

  /**
   * Check if back navigation is possible
   */
  const canGoBack = useMemo(
    () => state.viewHistory.length > 1,
    [state.viewHistory.length]
  );

  /**
   * Get nested navigation context for a parent view
   * Creates isolated navigation state for nested views
   */
  const getNestedNavigation = useCallback(
    (parentViewId: string): NavigationContextValue => {
      const nestedState =
        state.nestedViews[parentViewId] ||
        ({
          currentView: "",
          viewHistory: [],
          viewParams: {},
          nestedViews: {},
        } as NavigationState);

      return {
        state: nestedState,
        navigateTo: (viewId: string, params?: Record<string, unknown>) => {
          const view = getView(viewId);
          if (!view) {
            logger.warn(`Nested view not found: ${viewId}`);
            return;
          }

          if (view.parentId !== parentViewId) {
            logger.warn(
              `View ${viewId} is not a nested view of ${parentViewId}`
            );
            return;
          }

          logger.info(
            `Navigating to nested view: ${viewId} in parent: ${parentViewId}`,
            params
          );

          setState((prev) => {
            const currentNested = prev.nestedViews[parentViewId] || {
              currentView: "",
              viewHistory: [],
              viewParams: {},
              nestedViews: {},
            };

            return {
              ...prev,
              nestedViews: {
                ...prev.nestedViews,
                [parentViewId]: {
                  currentView: viewId,
                  viewHistory: [...currentNested.viewHistory, viewId].slice(
                    -MAX_HISTORY_LENGTH
                  ),
                  viewParams: params || {},
                  nestedViews: {},
                },
              },
            };
          });
        },
        goBack: () => {
          setState((prev) => {
            const nested = prev.nestedViews[parentViewId];
            if (!nested || nested.viewHistory.length <= 1) {
              logger.warn(`Cannot go back in nested view: ${parentViewId}`);
              return prev;
            }

            const newHistory = [...nested.viewHistory];
            newHistory.pop();
            const previousView = newHistory[newHistory.length - 1];

            logger.info(
              `Navigating back in nested view ${parentViewId} to: ${previousView}`
            );

            return {
              ...prev,
              nestedViews: {
                ...prev.nestedViews,
                [parentViewId]: {
                  ...nested,
                  currentView: previousView,
                  viewHistory: newHistory,
                  viewParams: {},
                },
              },
            };
          });
        },
        goToRoot: () => {
          logger.info(`Navigating to root of nested view: ${parentViewId}`);

          setState((prev) => ({
            ...prev,
            nestedViews: {
              ...prev.nestedViews,
              [parentViewId]: {
                currentView: "",
                viewHistory: [],
                viewParams: {},
                nestedViews: {},
              },
            },
          }));
        },
        canGoBack: nestedState.viewHistory.length > 1,
        getNestedNavigation: () => {
          throw new Error(
            "Nested navigation not supported for nested views (max 2 levels)"
          );
        },
      };
    },
    [state]
  );

  const value: NavigationContextValue = useMemo(
    () => ({
      state,
      navigateTo,
      goBack,
      goToRoot,
      canGoBack,
      getNestedNavigation,
    }),
    [state, navigateTo, goBack, goToRoot, canGoBack, getNestedNavigation]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
