import { useState, useCallback } from "react";

/**
 * Custom hook for managing view navigation state with type safety
 * 
 * @template T - Union type of view names (e.g., "dashboard" | "settings")
 * @param initialView - The initial view to display
 * @param views - Array of all valid view names for type checking
 * @returns Object with currentView, navigateTo, goBack, and setCurrentView
 * 
 * @example
 * ```tsx
 * const views = ["dashboard", "settings", "profile"] as const;
 * const { currentView, navigateTo, goBack } = useViewNavigation("dashboard", views);
 * 
 * // Navigate to a view
 * navigateTo("settings");
 * 
 * // Go back to initial view
 * goBack();
 * ```
 */
export function useViewNavigation<T extends string>(
  initialView: T,
  views: readonly T[]
) {
  const [currentView, setCurrentView] = useState<T>(initialView);

  const navigateTo = useCallback(
    (view: T) => {
      if (views.includes(view)) {
        setCurrentView(view);
      } else {
        console.warn(
          `Invalid view: "${view}". Valid views are: ${views.join(", ")}`
        );
      }
    },
    [views]
  );

  const goBack = useCallback(() => {
    setCurrentView(initialView);
  }, [initialView]);

  return {
    currentView,
    navigateTo,
    goBack,
    setCurrentView, // For direct control if needed
  };
}

