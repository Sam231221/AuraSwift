/**
 * Browser History Integration Hook
 *
 * Syncs the custom navigation system with browser history API.
 * Enables back/forward buttons and deep linking support.
 */

import { useEffect, useCallback } from "react";
import type { NavigationState } from "../types/navigation.types";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("browser-history");

interface HistoryState {
  viewId: string;
  params?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Hook to sync navigation state with browser history
 *
 * @param currentState - Current navigation state
 * @param navigateTo - Navigation function
 * @param enabled - Whether history sync is enabled (default: true)
 */
export function useBrowserHistory(
  currentState: NavigationState,
  navigateTo: (viewId: string, params?: Record<string, unknown>) => void,
  enabled = true
) {
  /**
   * Update browser history when navigation state changes
   */
  useEffect(() => {
    if (!enabled) return;

    const historyState: HistoryState = {
      viewId: currentState.currentView,
      params: currentState.viewParams,
      timestamp: Date.now(),
    };

    // Use hash-based routing for Electron compatibility
    const hash = `#/${currentState.currentView}`;
    
    // Only push if the current hash is different
    if (window.location.hash !== hash) {
      window.history.pushState(historyState, "", hash);
      logger.debug(`Pushed state: ${currentState.currentView}`, historyState);
    }
  }, [currentState.currentView, currentState.viewParams, enabled]);

  /**
   * Handle browser back/forward buttons
   */
  const handlePopState = useCallback(
    (event: PopStateEvent) => {
      if (!enabled) return;

      const state = event.state as HistoryState | null;
      
      if (state?.viewId) {
        logger.debug(`Pop state: ${state.viewId}`, state);
        navigateTo(state.viewId, state.params);
      } else {
        // No state - parse from hash
        const hash = window.location.hash.replace(/^#\/?/, "");
        if (hash && hash !== currentState.currentView) {
          logger.debug(`Pop state from hash: ${hash}`);
          navigateTo(hash);
        }
      }
    },
    [enabled, navigateTo, currentState.currentView]
  );

  /**
   * Setup popstate listener
   */
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enabled, handlePopState]);

  /**
   * Initialize from URL on mount
   */
  useEffect(() => {
    if (!enabled) return;

    const hash = window.location.hash.replace(/^#\/?/, "");
    if (hash && hash !== currentState.currentView) {
      logger.debug(`Initial navigation from hash: ${hash}`);
      navigateTo(hash);
    }
  }, []); // Only run on mount
}

/**
 * Parse view ID and params from URL hash
 *
 * @param hash - URL hash (e.g., "#/users:management?tab=active")
 * @returns Parsed view ID and params
 */
export function parseHashRoute(hash: string): {
  viewId: string;
  params: Record<string, unknown>;
} {
  const cleanHash = hash.replace(/^#\/?/, "");
  const [viewId, queryString] = cleanHash.split("?");
  
  const params: Record<string, unknown> = {};
  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  }
  
  return { viewId, params };
}

/**
 * Generate hash route from view ID and params
 *
 * @param viewId - View identifier
 * @param params - View parameters
 * @returns Hash route string
 */
export function generateHashRoute(
  viewId: string,
  params?: Record<string, unknown>
): string {
  let hash = `#/${viewId}`;
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, String(value));
    });
    hash += `?${searchParams.toString()}`;
  }
  
  return hash;
}

