/**
 * Unit tests for ShiftRequirementResolver
 * Tests RBAC-based shift requirement detection
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShiftRequirementResolver } from "../../../../packages/main/src/utils/shiftRequirementResolver";
import type { DatabaseManagers } from "../../../../packages/main/src/database/index";
import type { User, Role } from "../../../../packages/main/src/database/schema";

describe("ShiftRequirementResolver", () => {
  let resolver: ShiftRequirementResolver;
  let mockDB: Partial<DatabaseManagers>;
  let mockUser: User;

  beforeEach(() => {
    resolver = new ShiftRequirementResolver();
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

    // Mock database managers
    mockDB = {
      userRoles: {
        getActiveRolesByUser: vi.fn(),
      },
      roles: {
        getRoleById: vi.fn(),
      },
    } as any;
  });

  describe("resolve", () => {
    it("should return admin mode when role has shiftRequired = false", async () => {
      const adminRole: Role = {
        id: "role-admin",
        name: "admin",
        displayName: "Administrator",
        businessId: "business-1",
        permissions: [],
        shiftRequired: false,
        isSystemRole: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      (mockDB.userRoles!.getActiveRolesByUser as any).mockReturnValue([
        { roleId: "role-admin", userId: "user-1" },
      ]);
      (mockDB.roles!.getRoleById as any).mockReturnValue(adminRole);

      const result = await resolver.resolve(
        mockUser,
        mockDB as DatabaseManagers
      );

      expect(result.requiresShift).toBe(false);
      expect(result.mode).toBe("admin");
      expect(result.reason).toContain("admin");
    });

    it("should return cashier mode when role has shiftRequired = true", async () => {
      const cashierRole: Role = {
        id: "role-cashier",
        name: "cashier",
        displayName: "Cashier",
        businessId: "business-1",
        permissions: [],
        shiftRequired: true,
        isSystemRole: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      (mockDB.userRoles!.getActiveRolesByUser as any).mockReturnValue([
        { roleId: "role-cashier", userId: "user-1" },
      ]);
      (mockDB.roles!.getRoleById as any).mockReturnValue(cashierRole);

      const result = await resolver.resolve(
        mockUser,
        mockDB as DatabaseManagers
      );

      expect(result.requiresShift).toBe(true);
      expect(result.mode).toBe("cashier");
      expect(result.reason).toContain("cashier");
    });

    it("should prioritize false over true when user has multiple roles", async () => {
      const adminRole: Role = {
        id: "role-admin",
        name: "admin",
        displayName: "Administrator",
        businessId: "business-1",
        permissions: [],
        shiftRequired: false,
        isSystemRole: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      const cashierRole: Role = {
        id: "role-cashier",
        name: "cashier",
        displayName: "Cashier",
        businessId: "business-1",
        permissions: [],
        shiftRequired: true,
        isSystemRole: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      // Return admin role first (should be checked first)
      (mockDB.userRoles!.getActiveRolesByUser as any).mockReturnValue([
        { roleId: "role-admin", userId: "user-1" },
        { roleId: "role-cashier", userId: "user-1" },
      ]);
      (mockDB.roles!.getRoleById as any).mockImplementation((id: string) => {
        if (id === "role-admin") return adminRole;
        if (id === "role-cashier") return cashierRole;
        return null;
      });

      const result = await resolver.resolve(
        mockUser,
        mockDB as DatabaseManagers
      );

      expect(result.requiresShift).toBe(false);
      expect(result.mode).toBe("admin");
    });

    it("should fallback to user.shiftRequired when no role configuration", async () => {
      const roleWithoutConfig: Role = {
        id: "role-1",
        name: "custom",
        displayName: "Custom Role",
        businessId: "business-1",
        permissions: [],
        shiftRequired: null, // No explicit configuration
        isSystemRole: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      (mockDB.userRoles!.getActiveRolesByUser as any).mockReturnValue([
        { roleId: "role-1", userId: "user-1" },
      ]);
      (mockDB.roles!.getRoleById as any).mockReturnValue(roleWithoutConfig);

      // User has shiftRequired = false
      const userWithShiftRequired = {
        ...mockUser,
        shiftRequired: false,
      };

      const result = await resolver.resolve(
        userWithShiftRequired,
        mockDB as DatabaseManagers
      );

      expect(result.requiresShift).toBe(false);
      expect(result.mode).toBe("admin");
      expect(result.reason).toContain("user shiftRequired field");
    });

    it("should default to cashier mode when no configuration found", async () => {
      const roleWithoutConfig: Role = {
        id: "role-1",
        name: "custom",
        displayName: "Custom Role",
        businessId: "business-1",
        permissions: [],
        shiftRequired: null,
        isSystemRole: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      (mockDB.userRoles!.getActiveRolesByUser as any).mockReturnValue([
        { roleId: "role-1", userId: "user-1" },
      ]);
      (mockDB.roles!.getRoleById as any).mockReturnValue(roleWithoutConfig);

      // User also has shiftRequired = null
      const result = await resolver.resolve(
        mockUser,
        mockDB as DatabaseManagers
      );

      expect(result.requiresShift).toBe(true);
      expect(result.mode).toBe("cashier");
      expect(result.reason).toContain("Default");
    });

    it("should handle empty roles array", async () => {
      (mockDB.userRoles!.getActiveRolesByUser as any).mockReturnValue([]);

      const result = await resolver.resolve(
        mockUser,
        mockDB as DatabaseManagers
      );

      // Should fallback to user field or default
      expect(result).toBeDefined();
      expect(result.mode).toBeDefined();
    });

    it("should handle errors gracefully and default to cashier mode", async () => {
      (mockDB.userRoles!.getActiveRolesByUser as any).mockImplementation(() => {
        throw new Error("Database error");
      });

      const result = await resolver.resolve(
        mockUser,
        mockDB as DatabaseManagers
      );

      expect(result.requiresShift).toBe(true);
      expect(result.mode).toBe("cashier");
      expect(result.reason).toContain("Error");
    });
  });

  describe("requiresShift", () => {
    it("should return boolean from resolve result", async () => {
      const cashierRole: Role = {
        id: "role-cashier",
        name: "cashier",
        displayName: "Cashier",
        businessId: "business-1",
        permissions: [],
        shiftRequired: true,
        isSystemRole: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Role;

      (mockDB.userRoles!.getActiveRolesByUser as any).mockReturnValue([
        { roleId: "role-cashier", userId: "user-1" },
      ]);
      (mockDB.roles!.getRoleById as any).mockReturnValue(cashierRole);

      const result = await resolver.requiresShift(
        mockUser,
        mockDB as DatabaseManagers
      );

      expect(result).toBe(true);
    });
  });
});
