/**
 * Auth API Service
 * Abstraction layer for authentication-related API calls
 */

import type { APIResponse } from "@/types/api/common";

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
  createUser: async (
    sessionToken: string,
    userData: CreateUserData
  ): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.createUser(sessionToken, userData);
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
   * @param sessionToken - Optional session token (if provided, requires authentication)
   * @param userId - User ID to fetch
   */
  getUserById: async (
    sessionTokenOrUserId: string,
    userId?: string
  ): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    // Support both patterns: (userId) for public access, (sessionToken, userId) for authenticated
    return window.authAPI.getUserById(sessionTokenOrUserId, userId);
  },

  /**
   * Update user
   */
  updateUser: async (
    sessionToken: string,
    userId: string,
    updates: Record<string, string | number | boolean>
  ): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.updateUser(sessionToken, userId, updates);
  },

  /**
   * Get all active users
   * @param sessionToken - Optional session token (if not provided, returns all users for login page)
   */
  getAllActiveUsers: async (sessionToken?: string): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.getAllActiveUsers(sessionToken);
  },

  /**
   * Get users by business ID
   */
  getUsersByBusiness: async (
    sessionToken: string,
    businessId: string
  ): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.getUsersByBusiness(sessionToken, businessId);
  },

  /**
   * Delete user
   */
  deleteUser: async (sessionToken: string, userId: string): Promise<APIResponse> => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.deleteUser(sessionToken, userId);
  },

  /**
   * Get business by ID
   */
  getBusinessById: async (sessionToken: string, businessId: string) => {
    if (!window.authAPI) {
      throw new Error("Auth API not available");
    }
    return window.authAPI.getBusinessById(sessionToken, businessId);
  },
};
