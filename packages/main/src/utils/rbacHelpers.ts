/**
 * RBAC Permission Resolution
 *
 * Core logic for aggregating user permissions from roles and direct grants
 * Implements permission caching for performance
 */

import type { DatabaseManagers } from "../database/index.js";
import type { Permission } from "../constants/permissions.js";

import { getLogger } from "./logger.js";
const logger = getLogger("rbacHelpers");

/**
 * Permission cache - stores aggregated permissions per user
 * Cache invalidated when:
 * - User roles change
 * - User permissions change
 * - Role permissions change
 */
const permissionCache = new Map<
  string,
  {
    permissions: string[];
    timestamp: number;
  }
>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get all effective permissions for a user
 * Aggregates from: all assigned roles + direct permissions
 *
 * @param db - Database managers
 * @param userId - User ID
 * @param useCache - Whether to use cached permissions (default: true)
 * @returns Array of permission strings
 */
export async function getUserPermissions(
  db: DatabaseManagers,
  userId: string,
  useCache = true
): Promise<string[]> {
  logger.info("[getUserPermissions] Starting for userId:", userId);

  // Check cache first
  if (useCache) {
    const cached = permissionCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      logger.info(
        "[getUserPermissions] Returning cached permissions:",
        cached.permissions
      );
      return cached.permissions;
    }
  }

  const permissions = new Set<string>();

  try {
    // 1. Get permissions from all assigned roles
    const userRoles = db.userRoles.getActiveRolesByUser(userId);
    logger.info(
      "[getUserPermissions] Found",
      userRoles.length,
      "active roles for user"
    );

    // If no roles in user_roles table, fall back to primaryRoleId
    if (userRoles.length === 0) {
      logger.info(
        "[getUserPermissions] No roles in user_roles table, checking primaryRoleId fallback"
      );
      const user = db.users.getUserById(userId);
      if (user?.primaryRoleId) {
        logger.info(
          "[getUserPermissions] Found primaryRoleId:",
          user.primaryRoleId
        );
        const primaryRole = db.roles.getRoleById(user.primaryRoleId);
        if (primaryRole) {
          logger.info(
            "[getUserPermissions] Using primary role:",
            primaryRole.name
          );
          // Process primary role permissions
          if (primaryRole.isActive && primaryRole.permissions) {
            let rolePermissions: string[] = [];
            if (typeof primaryRole.permissions === "string") {
              try {
                rolePermissions = JSON.parse(primaryRole.permissions);
              } catch (e) {
                logger.error(
                  "[getUserPermissions] Failed to parse primary role permissions:",
                  e
                );
                rolePermissions = [primaryRole.permissions];
              }
            } else if (Array.isArray(primaryRole.permissions)) {
              rolePermissions = primaryRole.permissions as string[];
            }

            logger.info(
              "[getUserPermissions] Primary role permissions:",
              rolePermissions
            );

            for (const permission of rolePermissions) {
              logger.info(
                "[getUserPermissions] Adding permission from primary role:",
                permission
              );
              permissions.add(permission);
            }
          }
        }
      }
    } else {
      // Process roles from user_roles table
      for (const userRole of userRoles) {
        try {
          const role = db.roles.getRoleById(userRole.roleId);
          logger.info(
            "[getUserPermissions] Processing role:",
            role?.name,
            "isActive:",
            role?.isActive
          );
          logger.info(
            "[getUserPermissions] Role permissions type:",
            typeof role?.permissions,
            "value:",
            role?.permissions
          );

          if (role && role.isActive && role.permissions) {
            // Handle permissions - could be array or JSON string
            let rolePermissions: string[] = [];
            if (typeof role.permissions === "string") {
              try {
                rolePermissions = JSON.parse(role.permissions);
              } catch (e) {
                logger.error(
                  "[getUserPermissions] Failed to parse role permissions:",
                  e
                );
                rolePermissions = [role.permissions];
              }
            } else if (Array.isArray(role.permissions)) {
              rolePermissions = role.permissions as string[];
            }

            logger.info(
              "[getUserPermissions] Parsed permissions:",
              rolePermissions
            );

            // Add all role permissions
            for (const permission of rolePermissions) {
              logger.info(
                "[getUserPermissions] Adding permission from role:",
                permission
              );
              permissions.add(permission);
            }
          }
        } catch (error) {
          logger.error(
            "[getUserPermissions] Error processing role:",
            userRole.roleId,
            error
          );
        }
      }
    }

    // 2. Get direct permissions assigned to user
    const directPermissions =
      db.userPermissions.getActivePermissionsByUser(userId);
    logger.info(
      "[getUserPermissions] Found",
      directPermissions.length,
      "direct permissions"
    );

    for (const perm of directPermissions) {
      logger.info(
        "[getUserPermissions] Adding direct permission:",
        perm.permission
      );
      permissions.add(perm.permission);
    }
  } catch (error) {
    logger.error("[getUserPermissions] Error aggregating permissions:", error);
  }

  const permissionArray = Array.from(permissions);
  logger.info(
    "[getUserPermissions] Final aggregated permissions:",
    permissionArray
  );

  // Update cache
  permissionCache.set(userId, {
    permissions: permissionArray,
    timestamp: Date.now(),
  });

  return permissionArray;
}

/**
 * Invalidate permission cache for a user
 * Call this when user's roles or permissions change
 */
export function invalidateUserPermissionCache(userId: string): void {
  permissionCache.delete(userId);
}

/**
 * Invalidate permission cache for all users with a specific role
 * Call this when role permissions change
 */
export function invalidateRolePermissionCache(
  db: DatabaseManagers,
  roleId: string
): void {
  const userRoles = db.userRoles.getUsersByRole(roleId, true);

  for (const userRole of userRoles) {
    permissionCache.delete(userRole.userId);
  }
}

/**
 * Clear entire permission cache
 * Use sparingly - mainly for testing or system-wide permission updates
 */
export function clearPermissionCache(): void {
  permissionCache.clear();
}

/**
 * Get cache statistics
 */
export function getPermissionCacheStats() {
  return {
    size: permissionCache.size,
    entries: Array.from(permissionCache.entries()).map(([userId, data]) => ({
      userId,
      permissionCount: data.permissions.length,
      age: Date.now() - data.timestamp,
    })),
  };
}
