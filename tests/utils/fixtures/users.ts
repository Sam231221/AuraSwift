/**
 * User test fixtures
 */

export const testUsers = {
  cashier: {
    id: "user-cashier-1",
    email: "cashier@test.com",
    firstName: "John",
    lastName: "Cashier",
    role: "cashier" as const,
    businessId: "business-1",
    passwordHash: "hashed-password",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  manager: {
    id: "user-manager-1",
    email: "manager@test.com",
    firstName: "Jane",
    lastName: "Manager",
    role: "manager" as const,
    businessId: "business-1",
    passwordHash: "hashed-password",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  admin: {
    id: "user-admin-1",
    email: "admin@test.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin" as const,
    businessId: "business-1",
    passwordHash: "hashed-password",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};
