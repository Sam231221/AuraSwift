import { ipcMain, safeStorage } from "electron";
import { type DatabaseManagers, getDatabase } from "../database/index.js";
import { getLogger } from "../utils/logger.js";
import type { User } from "../database/schema.js";
import {
  validateSession,
  validateSessionAndPermission,
  validateBusinessAccess,
  logAction,
} from "../utils/authHelpers.js";
import { invalidateUserPermissionCache } from "../utils/rbacHelpers.js";
import { PERMISSIONS } from "@app/shared/constants/permissions.js";

const logger = getLogger("authHandlers");

// Check if encryption is available (done once at module load)
const isEncryptionAvailable = safeStorage.isEncryptionAvailable();

if (!isEncryptionAvailable) {
  logger.warn(
    "⚠️  Safe storage encryption not available on this platform! " +
      "Tokens will be stored in plaintext. Consider using a different encryption method."
  );
}

// Keys that should be encrypted
const ENCRYPTED_KEYS = ["token", "user", "refreshToken"];

// Get database instance
let db: DatabaseManagers | null = null;
getDatabase().then((database) => {
  db = database;
});

/**
 * Helper to check if a user is NOT an admin/owner (requires shift tracking)
 */
async function isNonAdminUser(
  db: DatabaseManagers,
  user: User
): Promise<boolean> {
  const userRolesWithDetails = db.userRoles.getRolesWithDetailsForUser(user.id);
  const hasAdminRole = userRolesWithDetails.some(
    (ur) => ur.role?.name === "admin" || ur.role?.name === "owner"
  );
  return !hasAdminRole;
}
export function registerAuthHandlers() {
  ipcMain.handle("auth:set", async (event, key: string, value: string) => {
    try {
      if (!db) db = await getDatabase();

      // Determine if this key should be encrypted
      const shouldEncrypt = ENCRYPTED_KEYS.includes(key);

      let storedValue = value;
      let isEncrypted = false;

      // Encrypt sensitive data if encryption is available
      if (shouldEncrypt && isEncryptionAvailable) {
        try {
          const buffer = safeStorage.encryptString(value);
          // Store as base64 to save in text field
          storedValue = buffer.toString("base64");
          isEncrypted = true;

          // Mark as encrypted for later decryption
          db.settings.setSetting(`${key}_encrypted`, "true");
        } catch (encryptError) {
          logger.error(
            `Failed to encrypt ${key}, storing in plaintext:`,
            encryptError
          );
          // Fallback to plaintext if encryption fails
          isEncrypted = false;
        }
      }

      // Store the value (encrypted or plaintext)
      db.settings.setSetting(key, storedValue);

      if (shouldEncrypt && !isEncrypted) {
        logger.warn(
          `⚠️  Storing ${key} in plaintext (encryption unavailable or failed)`
        );
      }

      return true;
    } catch (error) {
      logger.error("Error setting auth data:", error);
      return false;
    }
  });

  ipcMain.handle("auth:get", async (event, key: string) => {
    try {
      if (!db) db = await getDatabase();

      const value = db.settings.getSetting(key);

      if (!value) return null;

      // Check if this was encrypted
      const isEncrypted = db.settings.getSetting(`${key}_encrypted`) === "true";

      // Decrypt if needed
      if (isEncrypted && isEncryptionAvailable) {
        try {
          const buffer = Buffer.from(value, "base64");
          const decrypted = safeStorage.decryptString(buffer);
          return decrypted;
        } catch (decryptError) {
          logger.error(`Failed to decrypt ${key}:`, decryptError);
          // If decryption fails, return null (data is corrupted)
          return null;
        }
      }

      // Return plaintext value
      return value;
    } catch (error) {
      logger.error("Error getting auth data:", error);
      return null;
    }
  });

  ipcMain.handle("auth:delete", async (event, key: string) => {
    try {
      if (!db) db = await getDatabase();

      // Delete both the value and encryption marker
      db.settings.deleteSetting(key);
      db.settings.deleteSetting(`${key}_encrypted`);

      return true;
    } catch (error) {
      logger.error("Error deleting auth data:", error);
      return false;
    }
  });

  // Authentication API handlers
  ipcMain.handle("auth:register", async (event, userData) => {
    try {
      if (!db) db = await getDatabase();
      return await db.users.register(userData);
    } catch (error) {
      logger.error("Registration IPC error:", error);
      return {
        success: false,
        message: "Registration failed due to server error",
      };
    }
  });

  // Register business owner (automatically sets role to admin)
  ipcMain.handle("auth:registerBusiness", async (event, userData) => {
    try {
      if (!db) db = await getDatabase();
      // Business owners are automatically admin users
      const registrationData = {
        ...userData,
        role: "admin" as const,
      };

      return await db.users.register(registrationData);
    } catch (error) {
      logger.error("Business registration IPC error:", error);
      return {
        success: false,
        message: "Business registration failed due to server error",
      };
    }
  });

  ipcMain.handle("auth:login", async (event, credentials) => {
    try {
      if (!db) db = await getDatabase();

      // Perform login
      const loginResponse = await db.users.login(credentials);

      // 🔥 RBAC: Invalidate permission cache on login (clear any stale permissions)
      if (loginResponse.success && loginResponse.user) {
        invalidateUserPermissionCache(loginResponse.user.id);
        logger.info(
          `[Login] Cleared permission cache for user ${loginResponse.user.id}`
        );

        // Log successful login
        await logAction(
          db,
          loginResponse.user,
          "login",
          "session",
          loginResponse.token || "unknown",
          {
            method: credentials.username ? "pin" : "password",
            rememberMe: credentials.rememberMe || false,
          }
        );
      }

      return loginResponse;
    } catch (error) {
      logger.error("Login IPC error:", error);
      return {
        success: false,
        message: "Login failed due to server error",
      };
    }
  });

  ipcMain.handle("auth:validateSession", async (event, token) => {
    try {
      if (!db) db = await getDatabase();

      // Validate token format first
      if (!token || typeof token !== "string" || token.trim().length === 0) {
        logger.warn("[validateSession] Invalid token format provided");
        return {
          success: false,
          message: "Invalid session token",
          code: "INVALID_TOKEN_FORMAT",
        };
      }

      // Use RBAC-aware session validation
      const validation = await validateSession(db, token);

      if (!validation.success) {
        logger.debug(
          `[validateSession] Validation failed: ${validation.code} - ${validation.message}`
        );
        return {
          success: false,
          message: validation.message,
          code: validation.code,
        };
      }

      // Return user without sensitive fields
      const {
        passwordHash: _,
        pinHash: __,
        salt: ___,
        ...userWithoutSecrets
      } = validation.user!;

      logger.debug(
        `[validateSession] Session validated successfully for user ${
          validation.user!.id
        }`
      );
      return {
        success: true,
        message: "Session valid",
        user: userWithoutSecrets as User,
      };
    } catch (error) {
      logger.error("Session validation IPC error:", error);
      return {
        success: false,
        message: "Session validation failed",
        code: "VALIDATION_ERROR",
      };
    }
  });

  ipcMain.handle("auth:logout", async (event, token, options) => {
    try {
      if (!db) db = await getDatabase();

      // Get user from session before logout to check for active POS shifts
      const userSession = db.sessions.getSessionByToken(token);
      if (userSession) {
        const user = db.users.getUserById(userSession.userId);

        // Check for active POS shifts before allowing clock-out
        // Use shiftRequired field (null = auto-detect, true = required, false = not required)
        const requiresShift =
          user &&
          (user.shiftRequired === true ||
            (user.shiftRequired === null && (await isNonAdminUser(db, user))));
        if (requiresShift) {
          const activeTimeShift = db.timeTracking.getActiveShift(user.id);

          if (activeTimeShift) {
            // Check if there are active POS shifts for this TimeShift
            const activePosShifts = db.shifts.getActiveShiftsByTimeShift(
              activeTimeShift.id
            );

            if (activePosShifts.length > 0 && options?.autoClockOut !== false) {
              // User has active POS shifts - auto-end them before clock-out
              logger.info(
                `Auto-ending ${activePosShifts.length} active POS shift(s) before clock-out for user ${user.id}`
              );

              const failedShifts: string[] = [];

              for (const posShift of activePosShifts) {
                try {
                  // Estimate final cash (starting cash + sales)
                  const estimatedCash =
                    (posShift.starting_cash || 0) + (posShift.total_sales || 0);

                  db.shifts.endShift(posShift.id, {
                    endTime: new Date().toISOString(),
                    finalCashDrawer: estimatedCash,
                    expectedCashDrawer: estimatedCash,
                    totalSales: posShift.total_sales || 0,
                    totalTransactions: posShift.total_transactions || 0,
                    totalRefunds: posShift.total_refunds || 0,
                    totalVoids: posShift.total_voids || 0,
                    notes: posShift.notes
                      ? `${posShift.notes}; Auto-ended on logout`
                      : "Auto-ended on logout",
                  });

                  logger.info(`Auto-ended POS shift ${posShift.id} on logout`);
                } catch (error) {
                  failedShifts.push(posShift.id);
                  logger.error(
                    `Failed to auto-end POS shift ${posShift.id} on logout:`,
                    error
                  );
                }
              }

              // After ending all POS shifts, check if TimeShift should be clocked out
              // Only clock out if all shifts were successfully ended
              if (failedShifts.length === 0) {
                const remainingActiveShifts =
                  db.shifts.getActiveShiftsByTimeShift(activeTimeShift.id);
                if (remainingActiveShifts.length === 0) {
                  // All shifts ended successfully, clock out TimeShift
                  try {
                    const activeBreak = db.timeTracking.getActiveBreak(
                      activeTimeShift.id
                    );
                    if (activeBreak) {
                      await db.timeTracking.endBreak(activeBreak.id);
                    }

                    const clockOutEvent =
                      await db.timeTracking.createClockEvent({
                        userId: user.id,
                        terminalId: options?.terminalId || "unknown",
                        type: "out",
                        method: "auto",
                        ipAddress: options?.ipAddress,
                        notes: "Auto clock-out: All POS shifts ended on logout",
                      });

                    await db.timeTracking.completeShift(
                      activeTimeShift.id,
                      clockOutEvent.id
                    );
                    logger.info(
                      `Auto clocked out TimeShift ${activeTimeShift.id} after ending all POS shifts on logout`
                    );
                  } catch (error) {
                    logger.error(
                      "Failed to clock out TimeShift after ending POS shifts:",
                      error
                    );
                  }
                }
              } else {
                logger.warn(
                  `Cannot clock out TimeShift ${activeTimeShift.id}: ${
                    failedShifts.length
                  } POS shift(s) failed to end: ${failedShifts.join(", ")}`
                );
              }
            }
          }
        }
      }

      // Get user ID before logout for cache invalidation
      const logoutSession = db.sessions.getSessionByToken(token);
      const userId = logoutSession?.userId;

      // Perform logout
      const logoutResponse = await db.users.logout(token, options);

      // 🔥 RBAC: Invalidate permission cache on logout (security)
      if (userId) {
        invalidateUserPermissionCache(userId);
        logger.info(`[Logout] Cleared permission cache for user ${userId}`);
      }

      return logoutResponse;
    } catch (error) {
      logger.error("Logout IPC error:", error);
      return {
        success: false,
        message: "Logout failed",
      };
    }
  });

  ipcMain.handle(
    "auth:getUserById",
    async (event, sessionTokenOrUserId: string, userId?: string) => {
      try {
        if (!db) db = await getDatabase();

        // 🔥 Handle both authenticated and public access patterns
        // Pattern 1: (sessionToken, userId) - authenticated access
        // Pattern 2: (userId) - public access (for login page clock-in)
        let sessionToken: string | undefined;
        let targetUserId: string;

        if (userId) {
          // Pattern 1: Authenticated access
          sessionToken = sessionTokenOrUserId;
          targetUserId = userId;

          // Validate session and permission
          const auth = await validateSessionAndPermission(
            db,
            sessionToken,
            PERMISSIONS.USERS_MANAGE
          );

          if (!auth.success) {
            return { success: false, message: auth.message, code: auth.code };
          }

          // Get user
          const user = db.users.getUserById(targetUserId);
          if (!user) {
            return { success: false, message: "User not found" };
          }

          // Validate business access (users can only access users from their business)
          const businessCheck = validateBusinessAccess(
            auth.user!,
            user.businessId
          );
          if (!businessCheck.success) {
            return {
              success: false,
              message: businessCheck.message,
              code: businessCheck.code,
            };
          }

          // Remove sensitive fields
          const {
            passwordHash: _,
            pinHash: __,
            salt: ___,
            ...userWithoutSecrets
          } = user;

          return {
            success: true,
            user: userWithoutSecrets as User,
          };
        } else {
          // Pattern 2: Public access (for login page - user accessing their own data for clock-in)
          targetUserId = sessionTokenOrUserId;

          // Get user (public access - no authentication required)
          const user = db.users.getUserById(targetUserId);
          if (!user) {
            return { success: false, message: "User not found" };
          }

          // Remove sensitive fields
          const {
            passwordHash: _,
            pinHash: __,
            salt: ___,
            email: ____, // Don't expose email on login page
            ...userWithoutSecrets
          } = user;

          return {
            success: true,
            user: userWithoutSecrets as User,
          };
        }
      } catch (error) {
        logger.error("Get user IPC error:", error);
        return {
          success: false,
          message: "Failed to get user",
        };
      }
    }
  );

  ipcMain.handle(
    "auth:updateUser",
    async (event, sessionToken, userId, updates) => {
      try {
        if (!db) db = await getDatabase();

        // Validate session and permission
        const auth = await validateSessionAndPermission(
          db,
          sessionToken,
          PERMISSIONS.USERS_MANAGE
        );

        if (!auth.success) {
          return { success: false, message: auth.message, code: auth.code };
        }

        // Get target user
        const targetUser = db.users.getUserById(userId);
        if (!targetUser) {
          return { success: false, message: "User not found" };
        }

        // Validate business access
        const businessCheck = validateBusinessAccess(
          auth.user!,
          targetUser.businessId
        );
        if (!businessCheck.success) {
          return {
            success: false,
            message: businessCheck.message,
            code: businessCheck.code,
          };
        }

        // Update user
        const result = await db.users.updateUserWithResponse(userId, updates);

        // Invalidate permission cache if roles/permissions changed
        if (updates.roleId || updates.primaryRoleId) {
          invalidateUserPermissionCache(userId);
          logger.info(
            `[UpdateUser] Invalidated permission cache for user ${userId} (role changed)`
          );
        }

        // Audit log
        await logAction(db, auth.user!, "update", "users", userId, {
          updates: Object.keys(updates),
        });

        return result;
      } catch (error) {
        logger.error("Update user IPC error:", error);
        return {
          success: false,
          message: "Update failed",
        };
      }
    }
  );

  ipcMain.handle("auth:deleteUser", async (event, sessionToken, userId) => {
    try {
      if (!db) db = await getDatabase();

      // Validate session and permission
      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.USERS_MANAGE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      // Prevent self-deletion
      if (auth.user!.id === userId) {
        return {
          success: false,
          message: "Cannot delete your own account",
          code: "SELF_DELETE_DENIED",
        };
      }

      // Get target user
      const targetUser = db.users.getUserById(userId);
      if (!targetUser) {
        return { success: false, message: "User not found" };
      }

      // Validate business access
      const businessCheck = validateBusinessAccess(
        auth.user!,
        targetUser.businessId
      );
      if (!businessCheck.success) {
        return {
          success: false,
          message: businessCheck.message,
          code: businessCheck.code,
        };
      }

      // Delete user
      const result = await db.users.deleteUserWithResponse(userId);

      // Invalidate permission cache
      invalidateUserPermissionCache(userId);

      // Audit log
      await logAction(db, auth.user!, "delete", "users", userId);

      return result;
    } catch (error) {
      logger.error("Delete user IPC error:", error);
      return {
        success: false,
        message: "Delete failed",
      };
    }
  });

  ipcMain.handle(
    "auth:getUsersByBusiness",
    async (event, sessionToken, businessId) => {
      try {
        if (!db) db = await getDatabase();

        // Validate session and permission
        const auth = await validateSessionAndPermission(
          db,
          sessionToken,
          PERMISSIONS.USERS_MANAGE
        );

        if (!auth.success) {
          return { success: false, message: auth.message, code: auth.code };
        }

        // Validate business access (users can only view users from their business)
        const businessCheck = validateBusinessAccess(auth.user!, businessId);
        if (!businessCheck.success) {
          return {
            success: false,
            message: businessCheck.message,
            code: businessCheck.code,
          };
        }

        return db.users.getUsersByBusinessWithResponse(businessId);
      } catch (error) {
        logger.error("Get users by business IPC error:", error);
        return {
          success: false,
          message: "Failed to get users",
        };
      }
    }
  );

  ipcMain.handle("auth:createUser", async (event, sessionToken, userData) => {
    try {
      if (!db) db = await getDatabase();

      // Validate session and permission
      const auth = await validateSessionAndPermission(
        db,
        sessionToken,
        PERMISSIONS.USERS_MANAGE
      );

      if (!auth.success) {
        return { success: false, message: auth.message, code: auth.code };
      }

      // Validate business access (users can only create users in their business)
      const businessCheck = validateBusinessAccess(
        auth.user!,
        userData.businessId
      );
      if (!businessCheck.success) {
        return {
          success: false,
          message: businessCheck.message,
          code: businessCheck.code,
        };
      }

      // Create user
      const result = await db.users.createUserForBusiness(userData);

      // Audit log
      if (result.success && result.user) {
        await logAction(db, auth.user!, "create", "users", result.user.id, {
          username: result.user.username,
          roleId: result.user.primaryRoleId,
        });
      }

      return result;
    } catch (error) {
      logger.error("Create user IPC error:", error);
      return {
        success: false,
        message: "Failed to create user",
      };
    }
  });

  ipcMain.handle(
    "auth:getAllActiveUsers",
    async (event, sessionToken?: string) => {
      try {
        if (!db) db = await getDatabase();

        // 🔥 SPECIAL CASE: Login page needs user list before authentication
        // If sessionToken is provided, validate and filter by business
        // If no sessionToken, return all active users (for login page)
        if (sessionToken) {
          // Validate session and permission (for authenticated requests)
          const auth = await validateSessionAndPermission(
            db,
            sessionToken,
            PERMISSIONS.USERS_MANAGE
          );

          if (!auth.success) {
            return { success: false, message: auth.message, code: auth.code };
          }

          // Get users from same business only (business isolation)
          const users = db.users
            .getAllActiveUsers()
            .filter((user: User) => user.businessId === auth.user!.businessId);

          // Remove sensitive fields
          const sanitizedUsers = users.map((user: User) => {
            const {
              passwordHash: _,
              pinHash: __,
              salt: ___,
              ...userWithoutSecrets
            } = user;
            return userWithoutSecrets;
          });

          return {
            success: true,
            users: sanitizedUsers,
          };
        } else {
          // Public access: Return all active users (for login page)
          // Only return safe fields (no sensitive data)
          const users = db.users.getAllActiveUsers();

          // Remove sensitive fields
          const sanitizedUsers = users.map((user: User) => {
            const {
              passwordHash: _,
              pinHash: __,
              salt: ___,
              email: ____, // Don't expose email on login page
              ...userWithoutSecrets
            } = user;
            return userWithoutSecrets;
          });

          return {
            success: true,
            users: sanitizedUsers,
          };
        }
      } catch (error) {
        logger.error("Get all active users IPC error:", error);
        return {
          success: false,
          message: "Failed to get active users",
        };
      }
    }
  );

  // Business Management IPC handlers
  ipcMain.handle(
    "auth:getBusinessById",
    async (event, sessionToken, businessId) => {
      try {
        if (!db) db = await getDatabase();

        // Validate session
        const sessionValidation = await validateSession(db, sessionToken);
        if (!sessionValidation.success) {
          return {
            success: false,
            message: sessionValidation.message,
            code: sessionValidation.code,
          };
        }

        // Get business
        const business = db.businesses.getBusinessById(businessId);
        if (!business) {
          return {
            success: false,
            message: "Business not found",
          };
        }

        // Validate business access (users can only view their own business)
        const businessCheck = validateBusinessAccess(
          sessionValidation.user!,
          businessId
        );
        if (!businessCheck.success) {
          return {
            success: false,
            message: businessCheck.message,
            code: businessCheck.code,
          };
        }

        return {
          success: true,
          business: business,
        };
      } catch (error) {
        logger.error("Get business IPC error:", error);
        return {
          success: false,
          message: "Failed to get business details",
        };
      }
    }
  );
}
