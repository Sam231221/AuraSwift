import { useMemo } from "react";
import type { ReactNode } from "react";

/**
 * Type for view component factory function
 * Takes navigateTo function and returns a ReactNode
 */
type ViewComponentFactory<T extends string> = (
  navigateTo: (view: T) => void
) => ReactNode;

/**
 * Type for view definitions
 * Maps view names to their component factories
 */
type ViewDefinitions<T extends string> = Record<T, ViewComponentFactory<T>>;

/**
 * Type for view definitions factory function
 * Takes navigateTo function and returns view definitions
 */
type ViewDefinitionsFactory<T extends string> = (
  navigateTo: (view: T) => void
) => Record<T, ReactNode>;

/**
 * Custom hook to create a view map from view definitions
 *
 * This hook eliminates the repeated pattern of creating views objects
 * in dashboard components. It accepts either:
 * 1. View definitions object (Record of factories)
 * 2. Factory function that creates view definitions
 *
 * @template T - Union type of view names
 * @param definitionsOrFactory - View definitions object or factory function
 * @param navigateTo - Function to navigate between views
 * @returns Memoized Record of view names to ReactNode
 *
 * @example
 * ```tsx
 * // Using view definitions object
 * const viewDefinitions: ViewDefinitions<AdminView> = {
 *   dashboard: (navigateTo) => (
 *     <AdminDashboardPage onFront={() => navigateTo("userManagement")} />
 *   ),
 *   userManagement: (navigateTo) => (
 *     <UserManagementView onBack={() => navigateTo("dashboard")} />
 *   ),
 * };
 * const views = useViewMap(viewDefinitions, navigateTo);
 *
 * // Using factory function (recommended for shared definitions)
 * const views = useViewMap(createAdminViewDefinitions, navigateTo);
 * ```
 */
export function useViewMap<T extends string>(
  definitionsOrFactory: ViewDefinitions<T> | ViewDefinitionsFactory<T>,
  navigateTo: (view: T) => void
): Record<T, ReactNode> {
  return useMemo(() => {
    // Check if it's a factory function (has call signature)
    if (typeof definitionsOrFactory === "function") {
      // If it's a factory function, call it with navigateTo
      return definitionsOrFactory(navigateTo);
    }

    // Otherwise, treat it as view definitions object
    const views = {} as Record<T, ReactNode>;
    for (const [viewName, factory] of Object.entries(definitionsOrFactory) as [
      T,
      ViewComponentFactory<T>
    ][]) {
      views[viewName] = factory(navigateTo);
    }

    return views;
  }, [definitionsOrFactory, navigateTo]);
}
