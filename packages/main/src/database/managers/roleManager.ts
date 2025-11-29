/**
 * Role Manager
 *
 * Manages roles - sets of permissions that can be assigned to users
 * Supports both system roles and custom business-specific roles
 */

import type { DrizzleDB } from "../drizzle.js";
import type { Role, NewRole } from "../schema.js";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../schema.js";

export class RoleManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Create a new role
   */
  async createRole(
    roleData: Omit<NewRole, "id" | "createdAt" | "updatedAt">
  ): Promise<Role> {
    const roleId = this.uuid.v4();
    const now = new Date();

    const [role] = this.db
      .insert(schema.roles)
      .values({
        id: roleId,
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        businessId: roleData.businessId,
        permissions: roleData.permissions,
        isSystemRole: roleData.isSystemRole ?? false,
        isActive: roleData.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .all();

    return role;
  }

  /**
   * Get role by ID
   */
  getRoleById(roleId: string): Role | null {
    const role = this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId))
      .get();

    return role || null;
  }

  /**
   * Get role by name and business
   */
  getRoleByName(name: string, businessId: string): Role | null {
    const role = this.db
      .select()
      .from(schema.roles)
      .where(
        and(
          eq(schema.roles.name, name),
          eq(schema.roles.businessId, businessId)
        )
      )
      .get();

    return role || null;
  }

  /**
   * Get all roles for a business
   */
  getRolesByBusiness(businessId: string, activeOnly = true): Role[] {
    const conditions = [eq(schema.roles.businessId, businessId)];

    if (activeOnly) {
      conditions.push(eq(schema.roles.isActive, true));
    }

    return this.db
      .select()
      .from(schema.roles)
      .where(and(...conditions))
      .orderBy(desc(schema.roles.isSystemRole), schema.roles.name)
      .all();
  }

  /**
   * Get all system roles for a business
   */
  getSystemRoles(businessId: string): Role[] {
    return this.db
      .select()
      .from(schema.roles)
      .where(
        and(
          eq(schema.roles.businessId, businessId),
          eq(schema.roles.isSystemRole, true),
          eq(schema.roles.isActive, true)
        )
      )
      .all();
  }

  /**
   * Get all custom (non-system) roles for a business
   */
  getCustomRoles(businessId: string): Role[] {
    return this.db
      .select()
      .from(schema.roles)
      .where(
        and(
          eq(schema.roles.businessId, businessId),
          eq(schema.roles.isSystemRole, false),
          eq(schema.roles.isActive, true)
        )
      )
      .all();
  }

  /**
   * Update a role
   */
  updateRole(
    roleId: string,
    updates: Partial<Omit<Role, "id" | "createdAt" | "businessId">>
  ): Role {
    const [updatedRole] = this.db
      .update(schema.roles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.roles.id, roleId))
      .returning()
      .all();

    if (!updatedRole) {
      throw new Error("Role not found");
    }

    return updatedRole;
  }

  /**
   * Update role permissions
   */
  updateRolePermissions(roleId: string, permissions: string[]): Role {
    return this.updateRole(roleId, { permissions: permissions as any });
  }

  /**
   * Deactivate a role (soft delete)
   */
  deactivateRole(roleId: string): Role {
    return this.updateRole(roleId, { isActive: false });
  }

  /**
   * Reactivate a role
   */
  reactivateRole(roleId: string): Role {
    return this.updateRole(roleId, { isActive: true });
  }

  /**
   * Delete a role (hard delete)
   * WARNING: This will cascade delete all user_roles entries
   * Only use for custom roles that are no longer needed
   */
  deleteRole(roleId: string): void {
    const role = this.getRoleById(roleId);

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystemRole) {
      throw new Error("Cannot delete system roles");
    }

    this.db.delete(schema.roles).where(eq(schema.roles.id, roleId)).run();
  }

  /**
   * Check if role name exists in business
   */
  roleNameExists(
    name: string,
    businessId: string,
    excludeRoleId?: string
  ): boolean {
    const conditions = [
      eq(schema.roles.name, name),
      eq(schema.roles.businessId, businessId),
    ];

    if (excludeRoleId) {
      conditions.push(eq(schema.roles.id, excludeRoleId));
    }

    const role = this.db
      .select()
      .from(schema.roles)
      .where(and(...conditions))
      .get();

    return !!role;
  }

  /**
   * Get role usage count (number of users with this role)
   */
  getRoleUsageCount(roleId: string): number {
    const result = this.db
      .select({ count: schema.userRoles.id })
      .from(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.roleId, roleId),
          eq(schema.userRoles.isActive, true)
        )
      )
      .all();

    return result.length;
  }
}
