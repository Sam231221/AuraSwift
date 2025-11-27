/**
 * Authentication and Authorization Helpers
 * 
 * These utilities provide consistent session validation and permission checking
 * across all IPC handlers.
 * 
 * Usage:
 * ```typescript
 * ipcMain.handle("users:delete", async (event, sessionToken, targetUserId) => {
 *   const auth = await validateSessionAndPermission(
 *     db, 
 *     sessionToken, 
 *     PERMISSIONS.USERS_MANAGE
 *   );
 *   
 *   if (!auth.success) {
 *     return { success: false, message: auth.message };
 *   }
 *   
 *   // Proceed with operation using auth.user
 * });
 * ```
 */

import type { DatabaseManagers } from "../database/index.js";
import type { User } from "../database/schema.js";

// ============================================================================
// TYPES
// ============================================================================

export interface AuthValidationResult {
  success: boolean;
  message?: string;
  user?: User;
  code?: string;
}

export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Validate a session token and return the associated user
 * 
 * @param db - Database instance
 * @param sessionToken - Session token to validate
 * @returns Validation result with user if successful
 */
export async function validateSession(
  db: DatabaseManagers,
  sessionToken: string | null | undefined
): Promise<AuthValidationResult> {
  // Check if token provided
  if (!sessionToken) {
    return {
      success: false,
      message: "Authentication required: No session token provided",
      code: "NO_SESSION",
    };
  }

  // Get session from database
  const session = await db.sessions.getSessionByToken(sessionToken);
  
  if (!session) {
    return {
      success: false,
      message: "Invalid session: Session not found",
      code: "INVALID_SESSION",
    };
  }

  // Check if session has expired
  if (new Date(session.expiresAt) < new Date()) {
    return {
      success: false,
      message: "Session expired: Please log in again",
      code: "SESSION_EXPIRED",
    };
  }

  // Get user from session
  const user = await db.users.getUserById(session.userId);
  
  if (!user) {
    return {
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    };
  }

  // Check if user is active
  if (!user.isActive) {
    return {
      success: false,
      message: "User account is inactive",
      code: "USER_INACTIVE",
    };
  }

  return {
    success: true,
    user,
  };
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if a user has a specific permission
 * 
 * @param user - User object
 * @param requiredPermission - Permission to check (e.g., "manage:users")
 * @returns Whether user has the permission
 */
export function hasPermission(
  user: User,
  requiredPermission: string
): PermissionCheckResult {
  if (!user || !user.permissions) {
    return {
      granted: false,
      reason: "User has no permissions defined",
    };
  }

  // Check for exact match
  if (user.permissions.includes(requiredPermission as any)) {
    return { granted: true };
  }

  // Check for wildcard permission (admin has all)
  if (user.permissions.includes("*:*" as any)) {
    return { granted: true };
  }

  // Check for action wildcard (e.g., "manage:*" covers "manage:users")
  const [action, resource] = requiredPermission.split(":");
  if (user.permissions.includes(`${action}:*` as any)) {
    return { granted: true };
  }

  // Check for resource wildcard (e.g., "*:users" covers "manage:users")
  if (user.permissions.includes(`*:${resource}` as any)) {
    return { granted: true };
  }

  return {
    granted: false,
    reason: `User lacks required permission: ${requiredPermission}`,
  };
}

/**
 * Check if user has ANY of the specified permissions
 * 
 * @param user - User object
 * @param permissions - Array of permissions to check
 * @returns Whether user has at least one permission
 */
export function hasAnyPermission(
  user: User,
  permissions: string[]
): PermissionCheckResult {
  for (const permission of permissions) {
    const result = hasPermission(user, permission);
    if (result.granted) {
      return { granted: true };
    }
  }

  return {
    granted: false,
    reason: `User lacks any of required permissions: ${permissions.join(", ")}`,
  };
}

/**
 * Check if user has ALL of the specified permissions
 * 
 * @param user - User object
 * @param permissions - Array of permissions to check
 * @returns Whether user has all permissions
 */
export function hasAllPermissions(
  user: User,
  permissions: string[]
): PermissionCheckResult {
  for (const permission of permissions) {
    const result = hasPermission(user, permission);
    if (!result.granted) {
      return {
        granted: false,
        reason: `User lacks required permission: ${permission}`,
      };
    }
  }

  return { granted: true };
}

// ============================================================================
// COMBINED VALIDATION
// ============================================================================

/**
 * Validate session AND check permission in one call
 * Most common use case for IPC handlers
 * 
 * @param db - Database instance
 * @param sessionToken - Session token to validate
 * @param requiredPermission - Permission to check
 * @returns Validation result with user if successful
 */
export async function validateSessionAndPermission(
  db: DatabaseManagers,
  sessionToken: string | null | undefined,
  requiredPermission: string
): Promise<AuthValidationResult> {
  // First validate session
  const sessionValidation = await validateSession(db, sessionToken);
  
  if (!sessionValidation.success) {
    return sessionValidation;
  }

  const { user } = sessionValidation;

  // Then check permission
  const permissionCheck = hasPermission(user!, requiredPermission);
  
  if (!permissionCheck.granted) {
    // Log unauthorized attempt
    try {
      await db.audit.createAuditLog({
        userId: user!.id,
        action: "permission_denied",
        entityType: "user",
        entityId: user!.id,
        details: {
          permission: requiredPermission,
          reason: permissionCheck.reason,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Failed to log permission denial:", error);
    }

    return {
      success: false,
      message: "Unauthorized: Insufficient permissions",
      code: "PERMISSION_DENIED",
    };
  }

  return {
    success: true,
    user: user!,
  };
}

/**
 * Validate session AND check if user has ANY of the permissions
 * 
 * @param db - Database instance
 * @param sessionToken - Session token to validate
 * @param permissions - Array of permissions (user needs at least one)
 * @returns Validation result with user if successful
 */
export async function validateSessionAndAnyPermission(
  db: DatabaseManagers,
  sessionToken: string | null | undefined,
  permissions: string[]
): Promise<AuthValidationResult> {
  const sessionValidation = await validateSession(db, sessionToken);
  
  if (!sessionValidation.success) {
    return sessionValidation;
  }

  const { user } = sessionValidation;
  const permissionCheck = hasAnyPermission(user!, permissions);
  
  if (!permissionCheck.granted) {
    return {
      success: false,
      message: "Unauthorized: Insufficient permissions",
      code: "PERMISSION_DENIED",
    };
  }

  return {
    success: true,
    user: user!,
  };
}

// ============================================================================
// ROLE CHECKING (For backward compatibility)
// ============================================================================

/**
 * Check if user has a specific role
 * 
 * NOTE: Prefer permission-based checks over role-based checks!
 * Roles should determine permissions, but code should check permissions.
 * 
 * @param user - User object
 * @param role - Role to check
 * @returns Whether user has the role
 */
export function hasRole(user: User, role: string): boolean {
  return user.role === role;
}

/**
 * Check if user has any of the specified roles
 * 
 * @param user - User object
 * @param roles - Array of roles to check
 * @returns Whether user has any of the roles
 */
export function hasAnyRole(user: User, roles: string[]): boolean {
  return roles.includes(user.role);
}

// ============================================================================
// RESOURCE OWNERSHIP
// ============================================================================

/**
 * Check if user owns a resource or has permission to access it
 * 
 * @param user - User object
 * @param resourceOwnerId - ID of the resource owner
 * @param overridePermission - Permission that allows access regardless of ownership
 * @returns Whether user can access the resource
 */
export function canAccessResource(
  user: User,
  resourceOwnerId: string,
  overridePermission?: string
): boolean {
  // User owns the resource
  if (user.id === resourceOwnerId) {
    return true;
  }

  // User has override permission
  if (overridePermission && hasPermission(user, overridePermission).granted) {
    return true;
  }

  return false;
}

/**
 * Check if user can access resources within their business
 * 
 * @param user - User object
 * @param resourceBusinessId - Business ID of the resource
 * @returns Whether user can access the resource
 */
export function canAccessBusinessResource(
  user: User,
  resourceBusinessId: string
): boolean {
  return user.businessId === resourceBusinessId;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log a successful action
 * 
 * @param db - Database instance
 * @param user - User who performed the action
 * @param action - Action performed
 * @param resource - Resource type
 * @param resourceId - ID of the resource
 * @param details - Additional details
 */
export async function logAction(
  db: DatabaseManagers,
  user: User,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any
): Promise<void> {
  try {
    await db.audit.createAuditLog({
      userId: user.id,
      action,
      entityType: "user",
      entityId: resourceId || user.id,
      details: details || {},
    });
  } catch (error) {
    console.error("Failed to log action:", error);
  }
}

/**
 * Log a denied action attempt
 * 
 * @param db - Database instance
 * @param userId - User ID who attempted the action
 * @param action - Action attempted
 * @param resource - Resource type
 * @param reason - Reason for denial
 */
export async function logDeniedAction(
  db: DatabaseManagers,
  userId: string,
  action: string,
  resource: string,
  reason: string
): Promise<void> {
  try {
    await db.audit.createAuditLog({
      userId,
      action: `denied_${action}`,
      entityType: "user",
      entityId: userId,
      details: {
        resource,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to log denied action:", error);
  }
}

// ============================================================================
// EXAMPLES
// ============================================================================

/*

EXAMPLE 1: Basic permission check
----------------------------------
ipcMain.handle("users:delete", async (event, sessionToken, targetUserId) => {
  if (!db) db = await getDatabase();
  
  const auth = await validateSessionAndPermission(
    db,
    sessionToken,
    PERMISSIONS.USERS_MANAGE
  );
  
  if (!auth.success) {
    return { success: false, message: auth.message, code: auth.code };
  }
  
  // User is authenticated and authorized
  const result = await db.users.deleteUser(targetUserId);
  
  // Log the action
  await logAction(
    db,
    auth.user!,
    "delete",
    "users",
    targetUserId
  );
  
  return { success: true, data: result };
});


EXAMPLE 2: Multiple permissions (any)
--------------------------------------
ipcMain.handle("reports:view", async (event, sessionToken, reportType) => {
  if (!db) db = await getDatabase();
  
  // User needs either "read:reports" OR "view:analytics"
  const auth = await validateSessionAndAnyPermission(
    db,
    sessionToken,
    [PERMISSIONS.REPORTS_READ, PERMISSIONS.ANALYTICS_VIEW]
  );
  
  if (!auth.success) {
    return { success: false, message: auth.message };
  }
  
  return { success: true, data: await generateReport(reportType) };
});


EXAMPLE 3: Resource ownership check
------------------------------------
ipcMain.handle("shifts:end", async (event, sessionToken, shiftId, endData) => {
  if (!db) db = await getDatabase();
  
  const sessionValidation = await validateSession(db, sessionToken);
  if (!sessionValidation.success) {
    return { success: false, message: sessionValidation.message };
  }
  
  const { user } = sessionValidation;
  const shift = await db.shifts.getById(shiftId);
  
  if (!shift) {
    return { success: false, message: "Shift not found" };
  }
  
  // Cashier can only end their own shift
  // Manager can end any shift
  const canAccess = canAccessResource(
    user!,
    shift.cashierId,
    PERMISSIONS.SALES_WRITE // Managers have this with wider scope
  );
  
  if (!canAccess) {
    await logDeniedAction(
      db,
      user!.id,
      "end",
      "shifts",
      "User can only end their own shift"
    );
    return { success: false, message: "Cannot end another user's shift" };
  }
  
  const result = await db.shifts.endShift(shiftId, endData);
  await logAction(db, user!, "end", "shifts", shiftId);
  
  return { success: true, data: result };
});


EXAMPLE 4: Public endpoint (no auth required)
----------------------------------------------
ipcMain.handle("auth:login", async (event, credentials) => {
  if (!db) db = await getDatabase();
  
  // No authentication needed for login!
  return await db.users.login(credentials);
});


EXAMPLE 5: Role-based check (when necessary)
---------------------------------------------
ipcMain.handle("admin:systemSettings", async (event, sessionToken) => {
  if (!db) db = await getDatabase();
  
  const sessionValidation = await validateSession(db, sessionToken);
  if (!sessionValidation.success) {
    return { success: false, message: sessionValidation.message };
  }
  
  const { user } = sessionValidation;
  
  // Only actual admin role can access system settings
  if (!hasRole(user!, "admin")) {
    return { success: false, message: "Admin access required" };
  }
  
  return { success: true, data: await getSystemSettings() };
});

*/

