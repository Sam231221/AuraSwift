/**
 * Role and Permission Types for RBAC System
 * 
 * @module types/domain/role
 */

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: Permission[];
  isSystemRole?: boolean;
  isActive?: boolean;
}
