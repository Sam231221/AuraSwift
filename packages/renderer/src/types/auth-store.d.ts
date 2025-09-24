declare global {
  interface Window {
    authStore: {
      set: (key: string, value: string) => Promise<void>;
      get: (key: string) => Promise<string | null>;
      delete: (key: string) => Promise<void>;
    };
    authAPI: {
      register: (userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        businessName: string;
        role: "cashier" | "manager" | "admin";
      }) => Promise<{ success: boolean; message: string }>;
      login: (credentials: {
        email: string;
        password: string;
        rememberMe?: boolean;
      }) => Promise<{ token: string; user: { id: string; name: string } }>;
      validateSession: (token: string) => Promise<boolean>;
      logout: (token: string) => Promise<void>;
      getUserById: (
        userId: string
      ) => Promise<{ id: string; name: string; email: string }>;
      updateUser: (
        userId: string,
        updates: { name?: string; email?: string }
      ) => Promise<{ success: boolean; message: string }>;
    };
  }
}

export {};
