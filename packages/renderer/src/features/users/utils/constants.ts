export const USER_ROLES = ["cashier", "manager"] as const;

export const FILTER_ROLES = ["all", "cashier", "manager"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type FilterRole = (typeof FILTER_ROLES)[number];
