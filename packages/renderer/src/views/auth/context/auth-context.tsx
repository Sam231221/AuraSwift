import { createContext, useState, useEffect, type ReactNode } from "react";
import type { User, AuthContextType } from "../types/auth.types";

import { getLogger } from "@/shared/utils/logger";
const logger = getLogger("auth-context");

/* eslint-disable react-refresh/only-export-components */
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const login = async (
    username: string,
    pin: string,
    rememberMe: boolean = false
  ): Promise<{ success: boolean; message: string; errors?: string[] }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get terminal ID (use a default or generate one)
      const terminalId = `TERMINAL-${navigator.userAgent.slice(0, 10)}`;
      const ipAddress = "127.0.0.1"; // Could be enhanced to get actual IP

      const response = await window.authAPI.login({
        username,
        pin,
        rememberMe,
        terminalId,
        ipAddress,
        autoClockIn: true, // Auto clock-in for cashiers/managers
      });

      if (response.success && response.user && response.token) {
        setUser(response.user);
        // Persist user and token for session restoration
        await window.authStore.set("user", JSON.stringify(response.user));
        await window.authStore.set("token", response.token);

        // Store clock-in info if available
        if (response.clockEvent) {
          await window.authStore.set(
            "clockEvent",
            JSON.stringify(response.clockEvent)
          );
        }
        if (response.shift) {
          await window.authStore.set(
            "activeShift",
            JSON.stringify(response.shift)
          );
        }

        // Show message if clock-in is required
        if (response.requiresClockIn) {
          return {
            success: true,
            message: "Login successful. Please clock in to track your time.",
          };
        }

        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return {
          success: false,
          message: response.message,
          errors: response.errors,
        };
      }
    } catch (error) {
      logger.error("Login error:", error);
      const errorMessage = "Login failed due to network error";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
  }): Promise<{ success: boolean; message: string; errors?: string[] }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await window.authAPI.register(userData);

      if (response.success && response.user && response.token) {
        setUser(response.user);
        // Persist user and token for session restoration
        await window.authStore.set("user", JSON.stringify(response.user));
        await window.authStore.set("token", response.token);
        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return {
          success: false,
          message: response.message,
          errors: response.errors,
        };
      }
    } catch (error) {
      logger.error("Registration error:", error);
      const errorMessage = "Registration failed due to network error";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const registerBusiness = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    avatar?: string;
    businessAvatar?: string;
  }): Promise<{ success: boolean; message: string; errors?: string[] }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await window.authAPI.registerBusiness(userData);

      if (response.success && response.user && response.token) {
        setUser(response.user);
        // Persist user and token for session restoration
        await window.authStore.set("user", JSON.stringify(response.user));
        await window.authStore.set("token", response.token);
        // Also store business info if needed
        if (response.business) {
          await window.authStore.set(
            "business",
            JSON.stringify(response.business)
          );
        }
        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return {
          success: false,
          message: response.message,
          errors: response.errors,
        };
      }
    } catch (error) {
      logger.error("Business registration error:", error);
      const errorMessage = "Business registration failed due to network error";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (userData: {
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
  }): Promise<{ success: boolean; message: string; errors?: string[] }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get session token for authentication
      const sessionToken = await window.authStore.get("token");
      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const response = await window.authAPI.createUser(sessionToken, userData);

      if (response.success) {
        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return {
          success: false,
          message: response.message,
          errors: response.errors,
        };
      }
    } catch (error) {
      logger.error("User creation error:", error);
      const errorMessage = "User creation failed due to network error";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (options?: {
    clockOut?: boolean;
  }): Promise<{ needsClockOutWarning?: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await window.authStore.get("token");
      if (token) {
        const terminalId = `TERMINAL-${navigator.userAgent.slice(0, 10)}`;
        const ipAddress = "127.0.0.1";

        const response = await window.authAPI.logout(token, {
          terminalId,
          ipAddress,
          autoClockOut: options?.clockOut ?? false, // Only clock out if explicitly requested
        });

        // Check if user is still clocked in
        if (response.isClockedIn && !options?.clockOut) {
          return { needsClockOutWarning: true };
        }
      }
    } catch (error) {
      logger.error("Logout error:", error);
    } finally {
      setUser(null);
      await window.authStore.delete("user");
      await window.authStore.delete("token");
      await window.authStore.delete("clockEvent");
      await window.authStore.delete("activeShift");
      setIsLoading(false);
    }

    return { needsClockOutWarning: false };
  };

  // Validate session on app start (but not immediately after login)
  useEffect(() => {
    const validateSession = async () => {
      setIsInitializing(true);
      try {
        const token = await window.authStore.get("token");
        const storedUser = await window.authStore.get("user");

        if (token && storedUser) {
          // Basic token format validation
          if (typeof token !== "string" || token.length < 10) {
            logger.warn("Invalid token format, clearing session");
            await window.authStore.delete("user");
            await window.authStore.delete("token");
            setIsInitializing(false);
            return;
          }

          const response = await window.authAPI.validateSession(token);

          if (response.success && response.user) {
            setUser(response.user);
            // Update stored user data
            await window.authStore.set("user", JSON.stringify(response.user));
          } else {
            // Session is invalid, clear stored data
            // Don't show error toast on initial validation - only if user was already logged in
            // This prevents false errors right after login
            const errorCode = (response as { code?: string }).code;
            logger.warn(
              "Session validation failed:",
              response.message || errorCode
            );
            await window.authStore.delete("user");
            await window.authStore.delete("token");
            // Only clear user state if it was set (not on initial mount)
            // We intentionally don't include 'user' in deps - this only runs on mount
            const currentUser = user;
            if (currentUser) {
              setUser(null);
            }
          }
        }
      } catch (error) {
        logger.error("Session validation error:", error);
        // Clear stored data on error
        await window.authStore.delete("user");
        await window.authStore.delete("token");
        if (user) {
          setUser(null);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    // Small delay to avoid race condition with login
    const timeoutId = setTimeout(() => {
      validateSession();
    }, 100);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, not when user changes

  const clockIn = async (
    userId: string,
    businessId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const terminalId = `TERMINAL-${navigator.userAgent.slice(0, 10)}`;
      const ipAddress = "127.0.0.1";

      const response = await window.timeTrackingAPI.clockIn({
        userId,
        terminalId,
        businessId,
        ipAddress,
      });

      if (response.success) {
        if (response.shift) {
          await window.authStore.set(
            "activeShift",
            JSON.stringify(response.shift)
          );
        }
        return { success: true, message: "Clocked in successfully" };
      }

      return {
        success: false,
        message: response.message || "Failed to clock in",
      };
    } catch (error) {
      logger.error("Clock-in error:", error);
      return { success: false, message: "Failed to clock in" };
    }
  };

  const clockOut = async (
    userId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const terminalId = `TERMINAL-${navigator.userAgent.slice(0, 10)}`;
      const ipAddress = "127.0.0.1";

      const response = await window.timeTrackingAPI.clockOut({
        userId,
        terminalId,
        ipAddress,
      });

      if (response.success) {
        await window.authStore.delete("activeShift");
        await window.authStore.delete("clockEvent");
        return { success: true, message: "Clocked out successfully" };
      }

      return {
        success: false,
        message: response.message || "Failed to clock out",
      };
    } catch (error) {
      logger.error("Clock-out error:", error);
      return { success: false, message: "Failed to clock out" };
    }
  };

  const getActiveShift = async (userId: string): Promise<unknown> => {
    try {
      const response = await window.timeTrackingAPI.getActiveShift(userId);
      return response.shift || null;
    } catch (error) {
      logger.error("Get active shift error:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        registerBusiness,
        createUser,
        logout,
        clockIn,
        clockOut,
        getActiveShift,
        isLoading,
        error,
        isInitializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
