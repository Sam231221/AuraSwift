/**
 * RBAC API Types
 * 
 * Types for Role-Based Access Control operations.
 * 
 * @module types/api/rbac
 */

import type { APIResponse } from './common';

export interface RBACRolesAPI {
  list: (sessionToken: string, businessId: string) => Promise<APIResponse>;
  
  create: (
    sessionToken: string,
    roleData: {
      name: string;
      displayName: string;
      description?: string;
      permissions: string[];
      businessId: string;
      isSystemRole: boolean;
      isActive: boolean;
    }
  ) => Promise<APIResponse>;
  
  update: (
    sessionToken: string,
    roleId: string,
    updates: {
      displayName?: string;
      description?: string;
      permissions?: string[];
      isActive?: boolean;
    }
  ) => Promise<APIResponse>;
  
  delete: (sessionToken: string, roleId: string) => Promise<APIResponse>;
  getById: (sessionToken: string, roleId: string) => Promise<APIResponse>;
}

export interface RBACUserRolesAPI {
  assign: (
    sessionToken: string,
    userId: string,
    roleId: string
  ) => Promise<APIResponse>;
  
  revoke: (
    sessionToken: string,
    userId: string,
    roleId: string
  ) => Promise<APIResponse>;
  
  getUserRoles: (
    sessionToken: string,
    userId: string
  ) => Promise<APIResponse>;
  
  setPrimaryRole: (
    sessionToken: string,
    userId: string,
    roleId: string
  ) => Promise<APIResponse>;
}

export interface RBACAPI {
  roles: RBACRolesAPI;
  userRoles: RBACUserRolesAPI;
}
