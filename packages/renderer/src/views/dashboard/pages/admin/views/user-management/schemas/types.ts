export interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "cashier" | "manager";
  businessId: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}
