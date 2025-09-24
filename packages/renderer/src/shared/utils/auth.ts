import type { User } from "@/features/auth/types/auth.types";

export function hasPermission(
  user: User,
  action: string,
  resource: string
): boolean {
  return user.permissions.some(
    (p) =>
      (p.action === "*" || p.action === action) &&
      (p.resource === "*" || p.resource === resource)
  );
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case "cashier":
      return "Cashier";
    case "manager":
      return "Manager";
    case "admin":
      return "Administrator";
    default:
      return "User";
  }
}

export function getRoleDescription(role: string): string {
  switch (role) {
    case "cashier":
      return "Process sales and view basic reports";
    case "manager":
      return "Full sales management and inventory control";
    case "admin":
      return "Complete system access and user management";
    default:
      return "Standard user access";
  }
}

export function getUserDisplayName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}
