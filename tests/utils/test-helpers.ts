/**
 * Shared test utilities and helpers
 */

import { vi } from "vitest";
import type { DrizzleDB } from "@app/main/database/drizzle";

/**
 * Create a mock database instance for testing
 */
export function createMockDB(): Partial<DrizzleDB> {
  return {
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
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  };
}

/**
 * Create a mock UUID generator
 */
export function createMockUUID() {
  let counter = 0;
  return {
    v4: () => `mock-uuid-${++counter}`,
  };
}

/**
 * Create a mock Electron IPC handler
 */
export function createMockIpcHandler() {
  return {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn(),
    removeListener: vi.fn(),
  };
}

/**
 * Wait for async operations
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create test transaction data
 */
export function createTestTransaction(overrides = {}) {
  return {
    businessId: "test-business-id",
    shiftId: "test-shift-id",
    type: "sale" as const,
    subtotal: 100,
    tax: 10,
    total: 110,
    paymentMethod: "cash" as const,
    status: "completed" as const,
    receiptNumber: "TEST-001",
    timestamp: new Date(),
    ...overrides,
  };
}

/**
 * Create test product data
 */
export function createTestProduct(overrides = {}) {
  return {
    id: "test-product-id",
    name: "Test Product",
    price: 10.99,
    stock: 100,
    businessId: "test-business-id",
    categoryId: "test-category-id",
    ...overrides,
  };
}

/**
 * Create test user data
 */
export function createTestUser(overrides = {}) {
  return {
    id: "test-user-id",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "cashier" as const,
    businessId: "test-business-id",
    ...overrides,
  };
}
