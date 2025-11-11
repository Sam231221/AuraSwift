export interface User {
  id: string;
  username: string;
  pin: string;
  email?: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: "cashier" | "manager" | "admin";
  businessId: string;
  permissions: Permission[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Business {
  id: string;
  name: string;
  avatar?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  action: string;
  resource: string;
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
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isInitializing: boolean;
}
