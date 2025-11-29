export interface StaffUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: "cashier" | "manager";
  businessName: string;
  businessId: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
  address?: string;
}
