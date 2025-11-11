import { createContext, useState, useEffect, type ReactNode } from "react";
import type { User, AuthContextType } from "../types/auth.types";

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
      const response = await window.authAPI.login({
        username,
        pin,
        rememberMe,
      });

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
      console.error("Login error:", error);
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
      console.error("Registration error:", error);
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
      console.error("Business registration error:", error);
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
      const response = await window.authAPI.createUser(userData);

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
      console.error("User creation error:", error);
      const errorMessage = "User creation failed due to network error";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await window.authStore.get("token");
      if (token) {
        await window.authAPI.logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      await window.authStore.delete("user");
      await window.authStore.delete("token");
      setIsLoading(false);
    }
  };

  // Validate session on app start
  useEffect(() => {
    const validateSession = async () => {
      setIsInitializing(true);
      try {
        const token = await window.authStore.get("token");
        const storedUser = await window.authStore.get("user");

        if (token && storedUser) {
          const response = await window.authAPI.validateSession(token);

          if (response.success && response.user) {
            setUser(response.user);
            // Update stored user data
            await window.authStore.set("user", JSON.stringify(response.user));
          } else {
            // Session is invalid, clear stored data
            await window.authStore.delete("user");
            await window.authStore.delete("token");
          }
        }
      } catch (error) {
        console.error("Session validation error:", error);
        // Clear stored data on error
        await window.authStore.delete("user");
        await window.authStore.delete("token");
      } finally {
        setIsInitializing(false);
      }
    };

    validateSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        registerBusiness,
        createUser,
        logout,
        isLoading,
        error,
        isInitializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
