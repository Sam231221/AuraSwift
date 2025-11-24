import type { StaffUser } from "../schemas/types";

export const getStaffDisplayName = (staff: StaffUser): string => {
  return `${staff.firstName} ${staff.lastName}`;
};

export const formatUserRole = (role: "cashier" | "manager"): string => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};
