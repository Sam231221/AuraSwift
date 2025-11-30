/**
 * useFeatureVisibility Hook
 * 
 * Hook for determining if a feature should be visible based on user permissions.
 * Uses the useUserPermissions hook to check feature-level permissions.
 */

import { useUserPermissions } from "./use-user-permissions";
import type { FeatureConfig } from "../types/feature-config";

/**
 * Check if a feature should be visible based on user permissions
 * 
 * @param feature - Feature configuration to check
 * @returns Whether the feature should be visible
 */
export function useFeatureVisibility(feature: FeatureConfig): boolean {
  const { hasAnyPermission, hasAllPermissions, isLoading } = useUserPermissions();

  // Don't show features while loading permissions
  if (isLoading) return false;

  // If no permissions required, show the feature
  if (!feature.permissions || feature.permissions.length === 0) {
    return true;
  }

  // Check permissions based on requiredAll flag
  return feature.requiredAll
    ? hasAllPermissions(feature.permissions)
    : hasAnyPermission(feature.permissions);
}

