/**
 * Unit tests for TransactionManager
 * Tests updated shift requirement detection and transaction creation with optional shiftId
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionManager } from "@app/main/database/managers/transactionManager";
import type { DrizzleDB } from "@app/main/database/drizzle";
import type { User } from "@app/main/database/schema";
import { shiftRequirementResolver } from "@app/main/utils/shiftRequirementResolver";

// Mock the shiftRequirementResolver
vi.mock("@app/main/utils/shiftRequirementResolver", () => ({
  shiftRequirementResolver: {
    resolve: vi.fn(),
  },
}));

describe("TransactionManager", () => {
  let manager: TransactionManager;
  let mockDB: Partial<DrizzleDB>;
  let mockUUID: any;
  let mockUser: User;

  beforeEach(() => {
    mockUUID = {
      v4: vi.fn(() => "transaction-id-1"),
    };

    mockDB = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    } as any;

    manager = new TransactionManager(mockDB as DrizzleDB, mockUUID);

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

    vi.clearAllMocks();
  });

  describe("isShiftRequired", () => {
    it("should return false for admin mode", async () => {
      const mockDBManagers = {} as any;

      (shiftRequirementResolver.resolve as any).mockResolvedValue({
        requiresShift: false,
        mode: "admin",
        reason: "Admin role",
      });

      const result = await manager.isShiftRequired(mockUser, mockDBManagers);

      expect(result).toBe(false);
      expect(shiftRequirementResolver.resolve).toHaveBeenCalledWith(
        mockUser,
        mockDBManagers
      );
    });

    it("should return true for cashier mode", async () => {
      const mockDBManagers = {} as any;

      (shiftRequirementResolver.resolve as any).mockResolvedValue({
        requiresShift: true,
        mode: "cashier",
        reason: "Cashier role",
      });

      const result = await manager.isShiftRequired(mockUser, mockDBManagers);

      expect(result).toBe(true);
      expect(shiftRequirementResolver.resolve).toHaveBeenCalledWith(
        mockUser,
        mockDBManagers
      );
    });

    it("should handle errors gracefully", async () => {
      const mockDBManagers = {} as any;

      (shiftRequirementResolver.resolve as any).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        manager.isShiftRequired(mockUser, mockDBManagers)
      ).rejects.toThrow();
    });
  });

  describe("isShiftRequiredSync", () => {
    it("should return true when user.shiftRequired is true", () => {
      const userWithShiftRequired = {
        ...mockUser,
        shiftRequired: true,
      };

      const result = manager.isShiftRequiredSync(userWithShiftRequired);

      expect(result).toBe(true);
    });

    it("should return false when user.shiftRequired is false", () => {
      const userWithoutShiftRequired = {
        ...mockUser,
        shiftRequired: false,
      };

      const result = manager.isShiftRequiredSync(userWithoutShiftRequired);

      expect(result).toBe(false);
    });

    it("should return true (conservative default) when user.shiftRequired is null", () => {
      const result = manager.isShiftRequiredSync(mockUser);

      expect(result).toBe(true);
    });
  });

  describe("createTransaction", () => {
    it("should create transaction with null shiftId for admin mode", async () => {
      const transactionData = {
        businessId: "business-1",
        shiftId: null,
        type: "sale" as const,
        subtotal: 100,
        tax: 10,
        total: 110,
        paymentMethod: "cash" as const,
        status: "completed" as const,
        receiptNumber: "TEST-001",
        timestamp: new Date().toISOString(),
      };

      // Mock getTransactionById to return the created transaction
      vi.spyOn(manager as any, "getTransactionById").mockResolvedValue({
        id: "transaction-id-1",
        ...transactionData,
        items: [],
      });

      const result = await manager.createTransaction(transactionData);

      expect(mockDB.insert).toHaveBeenCalled();
      expect(result.id).toBe("transaction-id-1");
      expect(result.shiftId).toBeNull();
    });

    it("should create transaction with shiftId for cashier mode", async () => {
      const transactionData = {
        businessId: "business-1",
        shiftId: "shift-1",
        type: "sale" as const,
        subtotal: 100,
        tax: 10,
        total: 110,
        paymentMethod: "cash" as const,
        status: "completed" as const,
        receiptNumber: "TEST-001",
        timestamp: new Date().toISOString(),
      };

      // Mock getTransactionById to return the created transaction
      vi.spyOn(manager as any, "getTransactionById").mockResolvedValue({
        id: "transaction-id-1",
        ...transactionData,
        items: [],
      });

      const result = await manager.createTransaction(transactionData);

      expect(mockDB.insert).toHaveBeenCalled();
      expect(result.id).toBe("transaction-id-1");
      expect(result.shiftId).toBe("shift-1");
    });

    it("should create transaction with undefined shiftId (treated as null)", async () => {
      const transactionData = {
        businessId: "business-1",
        shiftId: undefined,
        type: "sale" as const,
        subtotal: 100,
        tax: 10,
        total: 110,
        paymentMethod: "cash" as const,
        status: "completed" as const,
        receiptNumber: "TEST-001",
        timestamp: new Date().toISOString(),
      };

      // Mock getTransactionById to return the created transaction
      vi.spyOn(manager as any, "getTransactionById").mockResolvedValue({
        id: "transaction-id-1",
        ...transactionData,
        shiftId: null,
        items: [],
      });

      const result = await manager.createTransaction(transactionData);

      expect(mockDB.insert).toHaveBeenCalled();
      expect(result.shiftId).toBeNull();
    });
  });
});

