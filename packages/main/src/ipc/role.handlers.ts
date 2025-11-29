import { ipcMain } from "electron";
import { getDatabase } from "../database/index.js";
import { getLogger } from "../utils/logger.js";
import { PERMISSIONS } from "../constants/permissions.js";
import {
  logAction,
  validateSession,
  validateSessionAndPermission,
  hasAnyRole,
} from "../utils/authHelpers.js";

const logger = getLogger("roleHandlers");
let db: any = null;

export function registerRoleHandlers() {
  // ============================================================================
  // RBAC - Role Management
  // ============================================================================

  ipcMain.handle("roles:list", async (event, sessionToken, businessId) => {
    if (!db) db = await getDatabase();

    // First validate session
    const sessionValidation = await validateSession(db, sessionToken);
    if (!sessionValidation.success) {
      logger.error(
        "[roles:list] Session validation failed:",
        sessionValidation
      );
      return {
        success: false,
        message: sessionValidation.message,
        code: sessionValidation.code,
      };
    }

    // Then check permission
    const auth = await validateSessionAndPermission(
      db,
      sessionToken,
      PERMISSIONS.USERS_MANAGE
    );

    if (!auth.success) {
      logger.error(
        "[roles:list] Permission check failed for user:",
        sessionValidation.user?.id
      );
      return { success: false, message: auth.message, code: auth.code };
    }

    try {
      const roles = db.roles.getRolesByBusiness(businessId);
      console.log("\n\nRoles:", roles, "\n\n");
      return { success: true, data: roles };
    } catch (error) {
      logger.error("List roles IPC error:", error);
      return {
        success: false,
        message: "Failed to list roles",
      };
    }
  });

  ipcMain.handle("roles:create", async (event, sessionToken, roleData) => {
    if (!db) db = await getDatabase();

    const sessionValidation = await validateSession(db, sessionToken);
    if (!sessionValidation.success) {
      return { success: false, message: sessionValidation.message };
    }

    const { user } = sessionValidation;

    // Allow admins and owners to manage roles
    const hasRoleAccess = await hasAnyRole(db, user!, ["admin", "owner"]);
    if (!hasRoleAccess) {
      return {
        success: false,
        message: "Unauthorized: Insufficient permissions",
        code: "PERMISSION_DENIED",
      };
    }

    try {
      const role = await db.roles.createRole(roleData);

      await logAction(db, user!, "create", "roles", role.id, {
        roleName: role.name,
        permissions: role.permissions,
      });

      return { success: true, data: role };
    } catch (error) {
      logger.error("Create role IPC error:", error);
      return {
        success: false,
        message: "Failed to create role",
      };
    }
  });

  ipcMain.handle(
    "roles:update",
    async (event, sessionToken, roleId, updates) => {
      if (!db) db = await getDatabase();

      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.USERS_MANAGE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      try {
        // Check if role exists and is a system role
        const existingRole = db.roles.getRoleById(roleId);
        if (!existingRole) {
          return { success: false, message: "Role not found" };
        }

        if (existingRole.isSystemRole) {
          // Prevent changing critical fields for system roles
          const restrictedFields = ["name", "isSystemRole"];
          const hasRestrictedChanges = Object.keys(updates).some((key) =>
            restrictedFields.includes(key)
          );
          if (hasRestrictedChanges) {
            return {
              success: false,
              message: "Cannot modify system role properties",
              code: "SYSTEM_ROLE_PROTECTED",
            };
          }
        }

        const role = db.roles.updateRole(roleId, updates);

        await logAction(db, auth.user!, "update", "roles", roleId, { updates });

        return { success: true, data: role };
      } catch (error) {
        logger.error("Update role IPC error:", error);
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to update role",
        };
      }
    }
  );

  ipcMain.handle("roles:delete", async (event, sessionToken, roleId) => {
    if (!db) db = await getDatabase();

    const auth = await validateSessionAndPermission(
      db,
      sessionToken,
      PERMISSIONS.USERS_MANAGE
    );

    if (!auth.success) {
      return { success: false, message: auth.message, code: auth.code };
    }

    try {
      // Check if role exists and is a system role
      const role = db.roles.getRoleById(roleId);
      if (!role) {
        return { success: false, message: "Role not found" };
      }

      if (role.isSystemRole) {
        return {
          success: false,
          message: "Cannot delete system roles",
          code: "SYSTEM_ROLE_PROTECTED",
        };
      }

      // Check if role has users assigned
      const usersWithRole = db.userRoles.getUsersByRole(roleId, true);
      if (usersWithRole.length > 0) {
        return {
          success: false,
          message: `Cannot delete role. ${usersWithRole.length} user(s) are assigned to this role. Please revoke the role from all users first.`,
          code: "ROLE_IN_USE",
        };
      }

      db.roles.deleteRole(roleId);

      await logAction(db, auth.user!, "delete", "roles", roleId);

      return { success: true };
    } catch (error) {
      logger.error("Delete role IPC error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete role",
      };
    }
  });

  ipcMain.handle("roles:getById", async (event, sessionToken, roleId) => {
    if (!db) db = await getDatabase();

    const auth = await validateSessionAndPermission(
      db,
      sessionToken,
      PERMISSIONS.USERS_MANAGE
    );

    if (!auth.success) {
      return { success: false, message: auth.message, code: auth.code };
    }

    try {
      const role = db.roles.getRoleById(roleId);

      if (!role) {
        return { success: false, message: "Role not found" };
      }

      return { success: true, data: role };
    } catch (error) {
      logger.error("Get role IPC error:", error);
      return {
        success: false,
        message: "Failed to get role",
      };
    }
  });

  // ============================================================================
  // RBAC - User Role Assignment
  // ============================================================================

  ipcMain.handle(
    "userRoles:assign",
    async (event, sessionToken, userId, roleId) => {
      if (!db) db = await getDatabase();

      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.USERS_MANAGE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      try {
        const userRole = await db.userRoles.assignRole(
          userId,
          roleId,
          auth.user!.id
        );

        // Invalidate permission cache for this user
        const { invalidateUserPermissionCache } = await import(
          "../utils/rbacHelpers.js"
        );
        invalidateUserPermissionCache(userId);

        await logAction(
          db,
          auth.user!,
          "assign_role",
          "user_roles",
          userRole.id,
          { userId, roleId }
        );

        return { success: true, data: userRole };
      } catch (error) {
        logger.error("Assign role IPC error:", error);
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to assign role",
        };
      }
    }
  );

  ipcMain.handle(
    "userRoles:revoke",
    async (event, sessionToken, userId, roleId) => {
      if (!db) db = await getDatabase();

      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.USERS_MANAGE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      try {
        const userRole = db.userRoles.revokeRole(userId, roleId);

        // Invalidate permission cache
        const { invalidateUserPermissionCache } = await import(
          "../utils/rbacHelpers.js"
        );
        invalidateUserPermissionCache(userId);

        await logAction(
          db,
          auth.user!,
          "revoke_role",
          "user_roles",
          userRole.id,
          { userId, roleId }
        );

        return { success: true, data: userRole };
      } catch (error) {
        logger.error("Revoke role IPC error:", error);
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to revoke role",
        };
      }
    }
  );

  ipcMain.handle(
    "userRoles:getUserRoles",
    async (event, sessionToken, userId) => {
      if (!db) db = await getDatabase();

      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.USERS_MANAGE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      try {
        const userRoles = db.userRoles.getRolesWithDetailsForUser(userId);
        return { success: true, data: userRoles };
      } catch (error) {
        logger.error("Get user roles IPC error:", error);
        return {
          success: false,
          message: "Failed to get user roles",
        };
      }
    }
  );

  ipcMain.handle(
    "roles:getUsersByRole",
    async (event, sessionToken, roleId) => {
      if (!db) db = await getDatabase();

      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.USERS_MANAGE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      try {
        const usersWithRole = db.userRoles.getUsersWithDetailsByRole(roleId);
        return { success: true, data: usersWithRole };
      } catch (error) {
        logger.error("Get users by role IPC error:", error);
        return {
          success: false,
          message: "Failed to get users with role",
        };
      }
    }
  );

  // ============================================================================
  // RBAC - Direct Permission Grants
  // ============================================================================

  ipcMain.handle(
    "userPermissions:grant",
    async (event, sessionToken, userId, permission, reason, expiresAt) => {
      if (!db) db = await getDatabase();

      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.USERS_MANAGE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      try {
        const userPermission = await db.userPermissions.grantPermission(
          userId,
          permission,
          auth.user!.id,
          reason,
          expiresAt ? new Date(expiresAt) : undefined
        );

        // Invalidate permission cache
        const { invalidateUserPermissionCache } = await import(
          "../utils/rbacHelpers.js"
        );
        invalidateUserPermissionCache(userId);

        await logAction(
          db,
          auth.user!,
          "grant_permission",
          "user_permissions",
          userPermission.id,
          { userId, permission, reason }
        );

        return { success: true, data: userPermission };
      } catch (error) {
        logger.error("Grant permission IPC error:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to grant permission",
        };
      }
    }
  );

  ipcMain.handle(
    "userPermissions:revoke",
    async (event, sessionToken, userId, permission) => {
      if (!db) db = await getDatabase();

      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.USERS_MANAGE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      try {
        const userPermission = db.userPermissions.revokePermission(
          userId,
          permission
        );

        // Invalidate permission cache
        const { invalidateUserPermissionCache } = await import(
          "../utils/rbacHelpers.js"
        );
        invalidateUserPermissionCache(userId);

        await logAction(
          db,
          auth.user!,
          "revoke_permission",
          "user_permissions",
          userPermission.id,
          { userId, permission }
        );

        return { success: true, data: userPermission };
      } catch (error) {
        logger.error("Revoke permission IPC error:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to revoke permission",
        };
      }
    }
  );

  ipcMain.handle(
    "userPermissions:getUserPermissions",
    async (event, sessionToken, userId) => {
      if (!db) db = await getDatabase();

      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.USERS_MANAGE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      try {
        const directPermissions =
          db.userPermissions.getActivePermissionsByUser(userId);
        const { getUserPermissions } = await import("../utils/rbacHelpers.js");
        const allPermissions = await getUserPermissions(db, userId);

        return {
          success: true,
          data: {
            direct: directPermissions,
            all: allPermissions,
          },
        };
      } catch (error) {
        logger.error("Get user permissions IPC error:", error);
        return {
          success: false,
          message: "Failed to get user permissions",
        };
      }
    }
  );

  // Cleanup expired sessions every hour
  setInterval(async () => {
    try {
      if (!db) db = await getDatabase();
      db.sessions.cleanupExpiredSessions();
    } catch (error) {
      logger.error("Failed to cleanup expired sessions:", error);
    }
  }, 60 * 60 * 1000);
}
