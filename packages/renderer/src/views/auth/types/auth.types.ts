export interface User {
  id: string;
  username: string;
  pin?: string;
  email?: string;
  firstName: string;
  lastName: string;
  businessName: string;
  businessId: string;
  // Note: role and permissions are managed via RBAC tables (userRoles, roles)
  // The role field is populated from the backend for UI display purposes only
  role?: "admin" | "manager" | "cashier";
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface UserForLogin {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: "admin" | "manager" | "cashier"; // For UI display only
  color: string;
}

export interface Business {
  id: string;
  firstName: string;
  lastName: string;
  businessName: string;
  avatar?: string;
  ownerId: string;
  address?: string;
  phone?: string;
  vatNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (
    username: string,
    pin: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; message: string; errors?: string[] }>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
  }) => Promise<{ success: boolean; message: string; errors?: string[] }>;
  registerBusiness: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    avatar?: string;
    businessAvatar?: string;
  }) => Promise<{ success: boolean; message: string; errors?: string[] }>;
  createUser: (userData: {
    businessId: string;
    username: string;
    pin: string;
    email?: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: "cashier" | "manager";
    avatar?: string;
    address?: string;
  }) => Promise<{ success: boolean; message: string; errors?: string[] }>;
  logout: (options?: { clockOut?: boolean }) => Promise<{
    needsClockOutWarning?: boolean;
  }>;
  clockIn: (
    userId: string,
    businessId: string
  ) => Promise<{
    success: boolean;
    message?: string;
  }>;
  clockOut: (userId: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  getActiveShift: (userId: string) => Promise<any>;
  isLoading: boolean;
  error: string | null;
  isInitializing: boolean;
}
