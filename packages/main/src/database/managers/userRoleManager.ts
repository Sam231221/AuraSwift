/**
 * User Role Manager
 *
 * Manages the assignment and revocation of roles to/from users
 * Handles the many-to-many relationship between users and roles
 */

import type { DrizzleDB } from "../drizzle.js";
import type { UserRole, NewUserRole, Role } from "../schema.js";
import { eq, and, desc, sql, or } from "drizzle-orm";
import * as schema from "../schema.js";

import { getLogger } from '../../utils/logger.js';
const logger = getLogger('userRoleManager');

export class UserRoleManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Assign a role to a user
   */
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy?: string,
    expiresAt?: Date
  ): Promise<UserRole> {
    // Check if assignment already exists
    const existing = this.getUserRole(userId, roleId);

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        return this.reactivateUserRole(existing.id);
      }
      throw new Error("User already has this role");
    }

    const userRoleId = this.uuid.v4();
    const now = new Date();

    const [userRole] = this.db
      .insert(schema.userRoles)
      .values({
        id: userRoleId,
        userId,
        roleId,
        assignedBy: assignedBy || null,
        assignedAt: now,
        expiresAt: expiresAt || null,
        isActive: true,
      })
      .returning()
      .all();

    return userRole;
  }

  /**
   * Revoke a role from a user (soft delete)
   */
  revokeRole(userId: string, roleId: string): UserRole {
    const userRole = this.getUserRole(userId, roleId);

    if (!userRole) {
      throw new Error("User does not have this role");
    }

    const [updated] = this.db
      .update(schema.userRoles)
      .set({ isActive: false })
      .where(eq(schema.userRoles.id, userRole.id))
      .returning()
      .all();

    return updated;
  }

  /**
   * Remove a role from a user (hard delete)
   */
  removeRole(userId: string, roleId: string): void {
    const userRole = this.getUserRole(userId, roleId);

    if (!userRole) {
      throw new Error("User does not have this role");
    }

    this.db
      .delete(schema.userRoles)
      .where(eq(schema.userRoles.id, userRole.id))
      .run();
  }

  /**
   * Reactivate a revoked role assignment
   */
  reactivateUserRole(userRoleId: string): UserRole {
    const [updated] = this.db
      .update(schema.userRoles)
      .set({ isActive: true })
      .where(eq(schema.userRoles.id, userRoleId))
      .returning()
      .all();

    if (!updated) {
      throw new Error("User role assignment not found");
    }

    return updated;
  }

  /**
   * Get a specific user role assignment
   */
  getUserRole(userId: string, roleId: string): UserRole | null {
    const userRole = this.db
      .select()
      .from(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.userId, userId),
          eq(schema.userRoles.roleId, roleId)
        )
      )
      .get();

    return userRole || null;
  }

  /**
   * Get all roles for a user (active only by default)
   */
  getActiveRolesByUser(userId: string, includeExpired = false): UserRole[] {
    logger.info(
      "[getActiveRolesByUser] Fetching roles for userId:",
      userId,
      "includeExpired:",
      includeExpired
    );

    const conditions = [
      eq(schema.userRoles.userId, userId),
      eq(schema.userRoles.isActive, true),
    ];

    if (!includeExpired) {
      conditions.push(
        or(
          eq(schema.userRoles.expiresAt, null),
          sql`${schema.userRoles.expiresAt} > ${new Date().getTime()}`
        )!
      );
    }

    const results = this.db
      .select()
      .from(schema.userRoles)
      .where(and(...conditions))
      .orderBy(desc(schema.userRoles.assignedAt))
      .all();

    logger.info("[getActiveRolesByUser] Found", results.length, "roles");
    logger.info(
      "[getActiveRolesByUser] Results:",
      JSON.stringify(results, null, 2)
    );

    return results;
  }

  /**
   * Get all roles for a user with role details
   */
  getRolesWithDetailsForUser(userId: string): Array<UserRole & { role: Role }> {
    const userRoles = this.getActiveRolesByUser(userId);

    return userRoles
      .map((userRole) => {
        const role = this.db
          .select()
          .from(schema.roles)
          .where(eq(schema.roles.id, userRole.roleId))
          .get();

        if (!role) return null;

        return {
          ...userRole,
          role,
        };
      })
      .filter((r): r is UserRole & { role: Role } => r !== null);
  }

  /**
   * Get all users with a specific role
   */
  getUsersByRole(roleId: string, activeOnly = true): UserRole[] {
    const conditions = [eq(schema.userRoles.roleId, roleId)];

    if (activeOnly) {
      conditions.push(eq(schema.userRoles.isActive, true));
    }

    return this.db
      .select()
      .from(schema.userRoles)
      .where(and(...conditions))
      .all();
  }

  /**
   * Check if user has a specific role
   */
  userHasRole(userId: string, roleId: string): boolean {
    const userRole = this.db
      .select()
      .from(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.userId, userId),
          eq(schema.userRoles.roleId, roleId),
          eq(schema.userRoles.isActive, true)
        )
      )
      .get();

    if (!userRole) return false;

    // Check expiration
    if (userRole.expiresAt && new Date(userRole.expiresAt) < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Check if user has any of the specified roles
   */
  userHasAnyRole(userId: string, roleIds: string[]): boolean {
    return roleIds.some((roleId) => this.userHasRole(userId, roleId));
  }

  /**
   * Check if user has all of the specified roles
   */
  userHasAllRoles(userId: string, roleIds: string[]): boolean {
    return roleIds.every((roleId) => this.userHasRole(userId, roleId));
  }

  /**
   * Replace all user roles with new set (atomic operation)
   */
  replaceUserRoles(
    userId: string,
    roleIds: string[],
    assignedBy?: string
  ): UserRole[] {
    // Get existing roles
    const existingRoles = this.getActiveRolesByUser(userId, true);

    // Deactivate all existing
    for (const existingRole of existingRoles) {
      this.db
        .update(schema.userRoles)
        .set({ isActive: false })
        .where(eq(schema.userRoles.id, existingRole.id))
        .run();
    }

    // Assign new roles
    const newRoles: UserRole[] = [];
    for (const roleId of roleIds) {
      const newRole = this.assignRole(userId, roleId, assignedBy);
      newRoles.push(newRole);
    }

    return newRoles;
  }

  /**
   * Set temporary role (with expiration)
   */
  assignTemporaryRole(
    userId: string,
    roleId: string,
    expiresAt: Date,
    assignedBy?: string
  ): UserRole {
    return this.assignRole(userId, roleId, assignedBy, expiresAt);
  }

  /**
   * Clean up expired role assignments
   */
  cleanupExpiredRoles(): number {
    const now = new Date().getTime();

    const result = this.db
      .update(schema.userRoles)
      .set({ isActive: false })
      .where(
        and(
          eq(schema.userRoles.isActive, true),
          sql`${schema.userRoles.expiresAt} IS NOT NULL`,
          sql`${schema.userRoles.expiresAt} < ${now}`
        )
      )
      .returning()
      .all();

    return result.length;
  }

  /**
   * Get role assignment count for a user
   */
  getUserRoleCount(userId: string): number {
    const roles = this.getActiveRolesByUser(userId);
    return roles.length;
  }
}
