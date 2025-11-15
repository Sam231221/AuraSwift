/**
 * Auth API Service
 * Abstraction layer for authentication-related API calls
 */

import type { APIResponse } from "@/shared/types/global";

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: "cashier" | "manager" | "admin";
}

export interface RegisterBusinessData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  avatar?: string;
  businessAvatar?: string;
}

export interface CreateUserData {
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
}

export interface LoginCredentials {
  username: string;
  pin: string;
  rememberMe?: boolean;
}

/**
 * Auth API Service
 */
export const authAPI = {
  /**
   * Register a new user
   */
  register: async (userData: RegisterData): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.register(userData);
  },

  /**
   * Register a new business
   */
  registerBusiness: async (
    userData: RegisterBusinessData
  ): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.registerBusiness(userData);
  },

  /**
   * Create a new user (admin/manager only)
   */
  createUser: async (userData: CreateUserData): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.createUser(userData);
  },

  /**
   * Login with username and pin
   */
  login: async (credentials: LoginCredentials): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.login(credentials);
  },

  /**
   * Validate session token
   */
  validateSession: async (token: string): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.validateSession(token);
  },

  /**
   * Logout user
   */
  logout: async (token: string): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.logout(token);
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.getUserById(userId);
  },

  /**
   * Update user
   */
  updateUser: async (
    userId: string,
    updates: Record<string, string | number | boolean>
  ): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.updateUser(userId, updates);
  },

  /**
   * Get all active users
   */
  getAllActiveUsers: async (): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.getAllActiveUsers();
  },

  /**
   * Get users by business ID
   */
  getUsersByBusiness: async (businessId: string): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.getUsersByBusiness(businessId);
  },

  /**
   * Delete user
   */
  deleteUser: async (userId: string): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.deleteUser(userId);
  },

  /**
   * Get business by ID
   */
  getBusinessById: async (businessId: string) => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.getBusinessById(businessId);
  },
};
