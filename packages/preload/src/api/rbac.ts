/**
 * RBAC API - Preload API for Role-Based Access Control
 */

import { ipcRenderer } from "electron";

export const rbacAPI = {
  // ============================================================================
  // Role Management
  // ============================================================================

  roles: {
    list: (sessionToken: string, businessId: string) =>
      ipcRenderer.invoke("roles:list", sessionToken, businessId),

    create: (
      sessionToken: string,
      roleData: {
        name: string;
        displayName: string;
        description?: string;
        businessId: string;
        permissions: string[];
        isSystemRole?: boolean;
        isActive?: boolean;
      }
    ) => ipcRenderer.invoke("roles:create", sessionToken, roleData),

    update: (
      sessionToken: string,
      roleId: string,
      updates: {
        displayName?: string;
        description?: string;
        permissions?: string[];
        isActive?: boolean;
      }
    ) => ipcRenderer.invoke("roles:update", sessionToken, roleId, updates),

    delete: (sessionToken: string, roleId: string) =>
      ipcRenderer.invoke("roles:delete", sessionToken, roleId),

    getById: (sessionToken: string, roleId: string) =>
      ipcRenderer.invoke("roles:getById", sessionToken, roleId),
  },

  // ============================================================================
  // User Role Assignment
  // ============================================================================

  userRoles: {
    assign: (sessionToken: string, userId: string, roleId: string) =>
      ipcRenderer.invoke("userRoles:assign", sessionToken, userId, roleId),

    revoke: (sessionToken: string, userId: string, roleId: string) =>
      ipcRenderer.invoke("userRoles:revoke", sessionToken, userId, roleId),

    getUserRoles: (sessionToken: string, userId: string) =>
      ipcRenderer.invoke("userRoles:getUserRoles", sessionToken, userId),

    setPrimaryRole: (sessionToken: string, userId: string, roleId: string) =>
      ipcRenderer.invoke(
        "userRoles:setPrimaryRole",
        sessionToken,
        userId,
        roleId
      ),
  },

  // ============================================================================
  // Direct Permission Grants
  // ============================================================================

  userPermissions: {
    grant: (
      sessionToken: string,
      userId: string,
      permission: string,
      reason?: string,
      expiresAt?: number
    ) =>
      ipcRenderer.invoke(
        "userPermissions:grant",
        sessionToken,
        userId,
        permission,
        reason,
        expiresAt
      ),

    revoke: (sessionToken: string, userId: string, permission: string) =>
      ipcRenderer.invoke(
        "userPermissions:revoke",
        sessionToken,
        userId,
        permission
      ),

    getUserPermissions: (sessionToken: string, userId: string) =>
      ipcRenderer.invoke(
        "userPermissions:getUserPermissions",
        sessionToken,
        userId
      ),
  },
};
