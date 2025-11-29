/**
 * Unit tests for TransactionValidator
 * Tests transaction validation including shift requirements and ownership
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionValidator } from "../../../../packages/main/src/utils/transactionValidator";
import type { DatabaseManagers } from "../../../../packages/main/src/database/index";
import type { User } from "../../../../packages/main/src/database/schema";
import { shiftRequirementResolver } from "../../../../packages/main/src/utils/shiftRequirementResolver";

// Mock the shiftRequirementResolver
vi.mock("@app/main/utils/shiftRequirementResolver", () => ({
  shiftRequirementResolver: {
    resolve: vi.fn(),
    requiresShift: vi.fn(),
  },
}));

describe("TransactionValidator", () => {
  let validator: TransactionValidator;
  let mockDB: Partial<DatabaseManagers>;
  let mockUser: User;

  beforeEach(() => {
    validator = new TransactionValidator();
    mockUser = {
      id: "user-1",
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      businessId: "business-1",
      shiftRequired: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    mockDB = {
      shifts: {
        getShiftById: vi.fn(),
        validateShiftOwnership: vi.fn(),
      },
    } as any;

    vi.clearAllMocks();
  });

  describe("validateTransaction", () => {
    it("should return valid for admin mode with null shiftId", async () => {
      (shiftRequirementResolver.resolve as any).mockResolvedValue({
        requiresShift: false,
        mode: "admin",
        reason: "Admin role",
      });

      const result = await validator.validateTransaction(
        mockUser,
        null,
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(true);
      expect(result.requiresShift).toBe(false);
      expect(result.shiftValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return invalid for cashier mode without shiftId", async () => {
      (shiftRequirementResolver.resolve as any).mockResolvedValue({
        requiresShift: true,
        mode: "cashier",
        reason: "Cashier role",
      });

      const result = await validator.validateTransaction(
        mockUser,
        null,
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(false);
      expect(result.requiresShift).toBe(true);
      expect(result.shiftValid).toBe(false);
      expect(result.errors).toContain(
        "Shift is required for your role to create transactions"
      );
      expect(result.code).toBe("SHIFT_REQUIRED");
    });

    it("should return valid for cashier mode with active shift", async () => {
      (shiftRequirementResolver.resolve as any).mockResolvedValue({
        requiresShift: true,
        mode: "cashier",
        reason: "Cashier role",
      });
      (shiftRequirementResolver.requiresShift as any).mockResolvedValue(true);

      const mockShift = {
        id: "shift-1",
        cashierId: "user-1",
        status: "active",
        businessId: "business-1",
      };

      (mockDB.shifts!.getShiftById as any).mockReturnValue(mockShift);
      (mockDB.shifts!.validateShiftOwnership as any).mockReturnValue(true);

      const result = await validator.validateTransaction(
        mockUser,
        "shift-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(true);
      expect(result.requiresShift).toBe(true);
      expect(result.shiftValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return invalid when shift is not found", async () => {
      (shiftRequirementResolver.resolve as any).mockResolvedValue({
        requiresShift: true,
        mode: "cashier",
        reason: "Cashier role",
      });
      (shiftRequirementResolver.requiresShift as any).mockResolvedValue(true);

      (mockDB.shifts!.getShiftById as any).mockReturnValue(null);

      const result = await validator.validateTransaction(
        mockUser,
        "shift-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(false);
      expect(result.shiftValid).toBe(false);
      expect(result.errors).toContain("Shift not found");
      expect(result.code).toBe("SHIFT_NOT_FOUND");
    });

    it("should return invalid when shift is not active", async () => {
      (shiftRequirementResolver.resolve as any).mockResolvedValue({
        requiresShift: true,
        mode: "cashier",
        reason: "Cashier role",
      });
      (shiftRequirementResolver.requiresShift as any).mockResolvedValue(true);

      const mockShift = {
        id: "shift-1",
        cashierId: "user-1",
        status: "ended",
        businessId: "business-1",
      };

      (mockDB.shifts!.getShiftById as any).mockReturnValue(mockShift);

      const result = await validator.validateTransaction(
        mockUser,
        "shift-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(false);
      expect(result.shiftValid).toBe(false);
      expect(result.errors[0]).toContain("ended");
      expect(result.code).toBe("SHIFT_INACTIVE");
    });

    it("should return invalid when shift ownership is violated", async () => {
      (shiftRequirementResolver.resolve as any).mockResolvedValue({
        requiresShift: true,
        mode: "cashier",
        reason: "Cashier role",
      });
      (shiftRequirementResolver.requiresShift as any).mockResolvedValue(true);

      const mockShift = {
        id: "shift-1",
        cashierId: "user-2", // Different user
        status: "active",
        businessId: "business-1",
      };

      (mockDB.shifts!.getShiftById as any).mockReturnValue(mockShift);
      (mockDB.shifts!.validateShiftOwnership as any).mockReturnValue(false);

      const result = await validator.validateTransaction(
        mockUser,
        "shift-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(false);
      expect(result.shiftValid).toBe(false);
      expect(result.errors).toContain(
        "You can only create transactions on your own shift"
      );
      expect(result.code).toBe("SHIFT_OWNERSHIP_VIOLATION");
    });

    it("should validate optional shift for admin mode", async () => {
      (shiftRequirementResolver.resolve as any).mockResolvedValue({
        requiresShift: false,
        mode: "admin",
        reason: "Admin role",
      });

      const mockShift = {
        id: "shift-1",
        cashierId: "user-1",
        status: "active",
        businessId: "business-1",
      };

      (mockDB.shifts!.getShiftById as any).mockReturnValue(mockShift);

      const result = await validator.validateTransaction(
        mockUser,
        "shift-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(true);
      expect(result.requiresShift).toBe(false);
    });

    it("should warn but not fail when optional shift is inactive for admin", async () => {
      (shiftRequirementResolver.resolve as any).mockResolvedValue({
        requiresShift: false,
        mode: "admin",
        reason: "Admin role",
      });

      const mockShift = {
        id: "shift-1",
        cashierId: "user-1",
        status: "ended",
        businessId: "business-1",
      };

      (mockDB.shifts!.getShiftById as any).mockReturnValue(mockShift);

      const result = await validator.validateTransaction(
        mockUser,
        "shift-1",
        mockDB as DatabaseManagers
      );

      // Should still be valid but with warning
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("not active");
    });

    it("should handle errors gracefully", async () => {
      (shiftRequirementResolver.resolve as any).mockImplementation(() => {
        throw new Error("Database error");
      });

      const result = await validator.validateTransaction(
        mockUser,
        null,
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Validation error");
      expect(result.code).toBe("VALIDATION_ERROR");
    });
  });
});
