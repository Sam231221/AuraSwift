/**
 * Transaction Validator
 *
 * Validates transaction creation requirements including:
 * - Shift requirement based on user roles (via RBAC)
 * - Shift validation (if required)
 * - Shift ownership (for cashiers)
 * - Shift status (must be active)
 */

import type { DatabaseManagers } from "../database/index.js";
import type { User } from "../database/schema.js";
import { shiftRequirementResolver } from "./shiftRequirementResolver.js";
import { getLogger } from "./logger.js";

const logger = getLogger("transactionValidator");

export interface TransactionValidationResult {
  valid: boolean;
  requiresShift: boolean;
  shiftValid: boolean;
  errors: string[];
  code?: string;
}

export class TransactionValidator {
  /**
   * Validate transaction creation requirements
   *
   * @param user - User creating the transaction
   * @param shiftId - Shift ID (can be null for admin/owner)
   * @param db - Database managers
   * @returns Validation result
   */
  async validateTransaction(
    user: User,
    shiftId: string | null,
    db: DatabaseManagers
  ): Promise<TransactionValidationResult> {
    logger.info(
      `[validateTransaction] Validating transaction for user ${user.id} (${
        user.username
      }), shiftId: ${shiftId || "null"}`
    );

    const errors: string[] = [];

    try {
      // 1. Resolve shift requirement based on user's roles
      const shiftRequirement = await shiftRequirementResolver.resolve(user, db);
      logger.info(
        `[validateTransaction] Shift requirement resolved: requiresShift=${shiftRequirement.requiresShift}, mode=${shiftRequirement.mode}`
      );

      // 2. Validate based on requirement
      if (shiftRequirement.requiresShift) {
        // Shift is required - must have valid shift
        if (!shiftId) {
          logger.warn(
            `[validateTransaction] Shift required but shiftId is null for user ${user.id}`
          );
          return {
            valid: false,
            requiresShift: true,
            shiftValid: false,
            errors: ["Shift is required for your role to create transactions"],
            code: "SHIFT_REQUIRED",
          };
        }

        // Validate shift exists and is active
        const shiftValidation = await this.validateShiftForTransaction(
          shiftId,
          user.id,
          db
        );

        if (!shiftValidation.valid) {
          logger.warn(
            `[validateTransaction] Shift validation failed: ${shiftValidation.errors.join(
              ", "
            )}`
          );
          return {
            valid: false,
            requiresShift: true,
            shiftValid: false,
            errors: shiftValidation.errors,
            code: shiftValidation.code,
          };
        }

        logger.info(
          `[validateTransaction] ✅ Shift validation passed for shift ${shiftId}`
        );
        return {
          valid: true,
          requiresShift: true,
          shiftValid: true,
          errors: [],
        };
      } else {
        // Shift not required - shiftId can be null or provided (optional tracking)
        logger.info(
          `[validateTransaction] ✅ Shift not required for user ${user.id} (admin/owner mode)`
        );

        // If shiftId is provided, validate it (optional tracking)
        if (shiftId) {
          const shift = db.shifts.getShiftById(shiftId);
          if (shift && shift.status !== "active") {
            logger.warn(
              `[validateTransaction] Optional shift ${shiftId} is not active`
            );
            errors.push("Optional shift is not active");
            // Don't fail validation, just warn
          }
        }

        return {
          valid: true,
          requiresShift: false,
          shiftValid: shiftId ? shiftId !== null : true,
          errors,
        };
      }
    } catch (error) {
      logger.error(
        `[validateTransaction] Error validating transaction for user ${user.id}:`,
        error
      );
      return {
        valid: false,
        requiresShift: true, // Conservative default
        shiftValid: false,
        errors: [
          `Validation error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        code: "VALIDATION_ERROR",
      };
    }
  }

  /**
   * Validate shift for transaction creation
   *
   * @param shiftId - Shift ID
   * @param userId - User ID (for ownership validation)
   * @param db - Database managers
   * @returns Validation result
   */
  private async validateShiftForTransaction(
    shiftId: string,
    userId: string,
    db: DatabaseManagers
  ): Promise<{ valid: boolean; errors: string[]; code?: string }> {
    try {
      // 1. Check shift exists
      const shift = db.shifts.getShiftById(shiftId);
      if (!shift) {
        return {
          valid: false,
          errors: ["Shift not found"],
          code: "SHIFT_NOT_FOUND",
        };
      }

      // 2. Check shift is active
      if (shift.status !== "active") {
        return {
          valid: false,
          errors: [`Cannot create transaction on ${shift.status} shift`],
          code: "SHIFT_INACTIVE",
        };
      }

      // 3. Validate shift ownership (cashiers can only use their own shifts)
      // Note: Admin/owner can use any shift, but this is checked at the resolver level
      const shiftRequirement = await shiftRequirementResolver.requiresShift(
        { id: userId } as User,
        db
      );

      if (shiftRequirement) {
        // User requires shift, so validate ownership
        const isOwner = db.shifts.validateShiftOwnership(shiftId, userId);
        if (!isOwner) {
          return {
            valid: false,
            errors: ["You can only create transactions on your own shift"],
            code: "SHIFT_OWNERSHIP_VIOLATION",
          };
        }
      }

      return {
        valid: true,
        errors: [],
      };
    } catch (error) {
      logger.error(
        `[validateShiftForTransaction] Error validating shift ${shiftId}:`,
        error
      );
      return {
        valid: false,
        errors: [
          `Error validating shift: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        code: "SHIFT_VALIDATION_ERROR",
      };
    }
  }
}

// Export singleton instance for convenience
export const transactionValidator = new TransactionValidator();
