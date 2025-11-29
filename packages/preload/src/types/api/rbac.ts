/**
 * RBAC API Types - Preload
 * 
 * Type definitions for Role-Based Access Control IPC APIs.
 * 
 * @module preload/types/api/rbac
 */

export interface RBACRolesAPIPreload {
  list: (sessionToken: string, businessId: string) => Promise<any>;
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
  ) => Promise<any>;
  update: (
    sessionToken: string,
    roleId: string,
    updates: {
      displayName?: string;
      description?: string;
      permissions?: string[];
      isActive?: boolean;
    }
  ) => Promise<any>;
  delete: (sessionToken: string, roleId: string) => Promise<any>;
  getById: (sessionToken: string, roleId: string) => Promise<any>;
  getUsersByRole: (sessionToken: string, roleId: string) => Promise<any>;
}

export interface RBACUserRolesAPIPreload {
  assign: (sessionToken: string, userId: string, roleId: string) => Promise<any>;
  revoke: (sessionToken: string, userId: string, roleId: string) => Promise<any>;
  getUserRoles: (sessionToken: string, userId: string) => Promise<any>;
  setPrimaryRole: (sessionToken: string, userId: string, roleId: string) => Promise<any>;
}

export interface RBACAPIPreload {
  roles: RBACRolesAPIPreload;
  userRoles: RBACUserRolesAPIPreload;
}

