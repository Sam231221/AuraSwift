/**
 * User Test Fixtures
 * 
 * Factory functions for creating test user data.
 */

// TODO: Replace with actual User type from your codebase
// import type { User } from '@/types/domain/user';
type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  isActive: boolean;
  phoneNumber: string | null;
  avatarUrl: string | null;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  [key: string]: any;
};

/**
 * Create a single mock user with optional overrides
 */
export function createMockUser(overrides?: Partial<User>): User {
  const id = overrides?.id || `user-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    email: overrides?.email || `test.user.${id}@example.com`,
    firstName: overrides?.firstName || 'Test',
    lastName: overrides?.lastName || 'User',
    username: overrides?.username || `testuser${id}`,
    role: overrides?.role || 'cashier',
    isActive: overrides?.isActive ?? true,
    phoneNumber: overrides?.phoneNumber || null,
    avatarUrl: overrides?.avatarUrl || null,
    businessId: overrides?.businessId || 'business-test-1',
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    lastLoginAt: overrides?.lastLoginAt || null,
    ...overrides,
  };
}

/**
 * Create multiple mock users
 */
export function createMockUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) => 
    createMockUser({
      id: `user-${i}`,
      email: `user${i}@example.com`,
      username: `user${i}`,
    })
  );
}

/**
 * Create a mock admin user
 */
export function createAdminUser(overrides?: Partial<User>): User {
  return createMockUser({
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    username: 'admin',
    ...overrides,
  });
}

/**
 * Create a mock manager user
 */
export function createManagerUser(overrides?: Partial<User>): User {
  return createMockUser({
    role: 'manager',
    firstName: 'Manager',
    lastName: 'User',
    email: 'manager@example.com',
    username: 'manager',
    ...overrides,
  });
}

/**
 * Create a mock cashier user
 */
export function createCashierUser(overrides?: Partial<User>): User {
  return createMockUser({
    role: 'cashier',
    firstName: 'Cashier',
    lastName: 'User',
    email: 'cashier@example.com',
    username: 'cashier',
    ...overrides,
  });
}

/**
 * Create a mock inactive user
 */
export function createInactiveUser(overrides?: Partial<User>): User {
  return createMockUser({
    isActive: false,
    firstName: 'Inactive',
    lastName: 'User',
    ...overrides,
  });
}

/**
 * User role constants
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  SUPERVISOR: 'supervisor',
} as const;

/**
 * Test user credentials (for E2E tests)
 */
export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!@#',
    role: 'admin',
  },
  manager: {
    email: 'manager@test.com',
    password: 'Manager123!@#',
    role: 'manager',
  },
  cashier: {
    email: 'cashier@test.com',
    password: 'Cashier123!@#',
    role: 'cashier',
  },
} as const;

