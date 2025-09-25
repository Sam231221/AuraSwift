interface APIResponse {
  success: boolean;
  message: string;
  data?: unknown;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
    businessId: string;
    avatar?: string;
  };
  users?: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
    businessId: string;
    avatar?: string;
    createdAt: string;
    isActive: boolean;
  }>;
  business?: {
    id: string;
    name: string;
    avatar?: string;
  };
  errors?: string[];
}

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
      }) => Promise<APIResponse>;
      registerBusiness: (userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        businessName: string;
        avatar?: string;
        businessAvatar?: string;
      }) => Promise<APIResponse>;
      createUser: (userData: {
        businessId: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: "cashier" | "manager";
        avatar?: string;
        address?: string;
      }) => Promise<APIResponse>;
      login: (credentials: {
        email: string;
        password: string;
        rememberMe?: boolean;
      }) => Promise<APIResponse>;
      validateSession: (token: string) => Promise<APIResponse>;
      logout: (token: string) => Promise<APIResponse>;
      getUserById: (userId: string) => Promise<APIResponse>;
      updateUser: (
        userId: string,
        updates: Record<string, string | number | boolean>
      ) => Promise<APIResponse>;
      getUsersByBusiness: (businessId: string) => Promise<APIResponse>;
      deleteUser: (userId: string) => Promise<APIResponse>;
    };
    scheduleAPI: {
      create: (scheduleData: {
        businessId: string;
        staffId: string;
        startTime: string;
        endTime: string;
        assignedRegister?: string;
        notes?: string;
      }) => Promise<APIResponse>;
      update: (
        scheduleId: string,
        updates: {
          staffId?: string;
          startTime?: string;
          endTime?: string;
          assignedRegister?: string;
          notes?: string;
        }
      ) => Promise<APIResponse>;
      delete: (scheduleId: string) => Promise<APIResponse>;
      getByBusiness: (businessId: string) => Promise<APIResponse>;
      getCashierUsers: (businessId: string) => Promise<APIResponse>;
    };
    shiftAPI: {
      start: (shiftData: {
        scheduleId?: string;
        cashierId: string;
        businessId: string;
        startingCash: number;
        notes?: string;
      }) => Promise<APIResponse>;
      end: (
        shiftId: string,
        endData: {
          finalCashDrawer: number;
          expectedCashDrawer: number;
          totalSales: number;
          totalTransactions: number;
          totalRefunds: number;
          totalVoids: number;
          notes?: string;
        }
      ) => Promise<APIResponse>;
      getActive: (cashierId: string) => Promise<APIResponse>;
      getTodaySchedule: (cashierId: string) => Promise<APIResponse>;
      getStats: (shiftId: string) => Promise<APIResponse>;
    };
  }
}

export {};
