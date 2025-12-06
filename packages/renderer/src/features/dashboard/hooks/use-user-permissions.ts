/**
 * useUserPermissions Hook
 *
 * Hook for fetching and checking user permissions from the RBAC system.
 * Provides cached permission checking with automatic refresh.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/shared/hooks";
import { PERMISSIONS } from "@app/shared/constants/permissions";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("use-user-permissions");

interface UserPermissions {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isLoading: boolean;
  error: Error | null;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const permissionCache = new Map<
  string,
  {
    permissions: string[];
    timestamp: number;
  }
>();

// Expose cache for external clearing (e.g., on login)
if (typeof window !== "undefined") {
  (
    window as typeof window & { permissionCache?: typeof permissionCache }
  ).permissionCache = permissionCache;
}

export function useUserPermissions(): UserPermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadPermissions() {
      if (!user?.id) {
        setPermissions([]);
        setIsLoading(false);
        setError(null);
        // Clear cache when user logs out
        permissionCache.clear();
        return;
      }

      // Check cache first
      const cached = permissionCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        setPermissions(cached.permissions);
        setIsLoading(false);
        setError(null);
        return;
      }

      // Clear cache for other users when switching users
      if (cached && cached.timestamp < Date.now() - CACHE_TTL_MS) {
        permissionCache.delete(user.id);
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch user permissions from RBAC API
        const sessionToken = await window.authStore.get("token");
        if (!sessionToken) {
          // Silently handle missing session token - user is not authenticated yet
          // This is expected during initial load or before login
          setPermissions([]);
          setIsLoading(false);
          return;
        }

        const response =
          await window.rbacAPI.userPermissions.getUserPermissions(
            sessionToken,
            user.id
          );

        if (response.success && response.data) {
          // Response data is an object with 'direct' and 'all' properties
          const userPermissions = Array.isArray(response.data.all)
            ? response.data.all
            : Array.isArray(response.data)
            ? response.data
            : [];

          if (userPermissions.length === 0) {
            logger.warn(
              `[useUserPermissions] No permissions found for user ${user.id}. Response:`,
              response
            );
          }

          setPermissions(userPermissions);

          // Update cache
          permissionCache.set(user.id, {
            permissions: userPermissions,
            timestamp: Date.now(),
          });
        } else {
          logger.warn(
            `[useUserPermissions] Invalid response format for user ${user.id}:`,
            response
          );
          setPermissions([]);
        }
      } catch (err) {
        logger.error("[useUserPermissions] Failed to load permissions:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load permissions")
        );
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPermissions();
  }, [user?.id]);

  // Clear cache when user changes (login/logout)
  useEffect(() => {
    if (!user?.id) {
      permissionCache.clear();
      setPermissions([]);
    }
  }, [user?.id]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!permission) return false;

      // Check for wildcard permission (admin has all)
      if (permissions.includes(PERMISSIONS.ALL)) return true;

      // Check for exact match
      if (permissions.includes(permission)) return true;

      // Check wildcards
      const [action, resource] = permission.split(":");
      if (action && resource) {
        // Check for action wildcard (e.g., "manage:*" covers "manage:users")
        if (permissions.includes(`${action}:*`)) return true;

        // Check for resource wildcard (e.g., "*:users" covers "manage:users")
        if (permissions.includes(`*:${resource}`)) return true;
      }

      return false;
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions: string[]): boolean => {
      return requiredPermissions.some((perm) => hasPermission(perm));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions: string[]): boolean => {
      return requiredPermissions.every((perm) => hasPermission(perm));
    },
    [hasPermission]
  );

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    error,
  };
}
