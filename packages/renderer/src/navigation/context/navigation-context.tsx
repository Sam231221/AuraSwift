/**
 * Navigation Context
 *
 * React context for navigation state management.
 * Provides type-safe access to navigation functionality.
 */

import { createContext, useContext } from "react";
import type { NavigationContextValue } from "../types/navigation.types";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("navigation-context");

/**
 * Navigation context
 * Undefined when used outside NavigationProvider
 */
export const NavigationContext = createContext<
  NavigationContextValue | undefined
>(undefined);

/**
 * Hook to access navigation context
 *
 * @returns Navigation context value
 * @throws Error if used outside NavigationProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { navigateTo, goBack } = useNavigationContext();
 *   // ...
 * }
 * ```
 */
export function useNavigationContext(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    const error = new Error(
      "useNavigationContext must be used within NavigationProvider"
    );
    logger.error(error.message);
    throw error;
  }
  return context;
}

