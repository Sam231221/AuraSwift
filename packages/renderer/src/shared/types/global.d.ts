interface APIResponse {
  success: boolean;
  message: string;
  data?: unknown;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
    businessId: string;
    permissions: Array<{
      id: string;
      name: string;
      description: string;
      module: string;
      action: string;
      resource: string;
    }>;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
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
      getHourlyStats: (shiftId: string) => Promise<APIResponse>;
      getCashDrawerBalance: (shiftId: string) => Promise<APIResponse>;
      reconcile: (
        shiftId: string,
        reconciliationData: {
          actualCashDrawer: number;
          managerNotes: string;
          managerId: string;
        }
      ) => Promise<APIResponse>;
      getPendingReconciliation: (businessId: string) => Promise<APIResponse>;
    };
    transactionAPI: {
      create: (transactionData: {
        shiftId: string;
        businessId: string;
        type: "sale" | "refund" | "void";
        subtotal: number;
        tax: number;
        total: number;
        paymentMethod: "cash" | "card" | "mixed";
        cashAmount?: number;
        cardAmount?: number;
        items: Array<{
          productId: string;
          productName: string;
          quantity: number;
          unitPrice: number;
          totalPrice: number;
        }>;
        status: "completed" | "voided" | "pending";
        customerId?: string;
        receiptNumber: string;
        timestamp: string;
      }) => Promise<APIResponse>;
      getByShift: (shiftId: string) => Promise<APIResponse>;
    };
    refundAPI: {
      getTransactionById: (transactionId: string) => Promise<APIResponse>;
      getTransactionByReceipt: (receiptNumber: string) => Promise<APIResponse>;
      getRecentTransactions: (
        businessId: string,
        limit?: number
      ) => Promise<APIResponse>;
      getShiftTransactions: (
        shiftId: string,
        limit?: number
      ) => Promise<APIResponse>;
      validateEligibility: (
        transactionId: string,
        refundItems: Array<{
          originalItemId: string;
          productId: string;
          productName: string;
          originalQuantity: number;
          refundQuantity: number;
          unitPrice: number;
          refundAmount: number;
          reason: string;
          restockable: boolean;
        }>
      ) => Promise<APIResponse>;
      createRefund: (refundData: {
        originalTransactionId: string;
        shiftId: string;
        businessId: string;
        refundItems: Array<{
          originalItemId: string;
          productId: string;
          productName: string;
          originalQuantity: number;
          refundQuantity: number;
          unitPrice: number;
          refundAmount: number;
          reason: string;
          restockable: boolean;
        }>;
        refundReason: string;
        refundMethod: "original" | "store_credit" | "cash" | "card";
        managerApprovalId?: string;
        cashierId: string;
      }) => Promise<APIResponse>;
    };
    voidAPI: {
      validateEligibility: (transactionId: string) => Promise<APIResponse>;
      voidTransaction: (voidData: {
        transactionId: string;
        cashierId: string;
        reason: string;
        managerApprovalId?: string;
      }) => Promise<APIResponse>;
      getTransactionById: (transactionId: string) => Promise<APIResponse>;
      getTransactionByReceipt: (receiptNumber: string) => Promise<APIResponse>;
    };
    cashDrawerAPI: {
      getExpectedCash: (shiftId: string) => Promise<APIResponse>;
      createCount: (countData: {
        shiftId: string;
        countType: "opening" | "mid-shift" | "closing" | "spot-check";
        expectedAmount: number;
        countedAmount: number;
        variance: number;
        notes?: string;
        countedBy: string;
        denominations?: Array<{
          value: number;
          count: number;
          total: number;
          label: string;
          type: "note" | "coin";
        }>;
        managerApprovalId?: string;
      }) => Promise<APIResponse>;
      getCountsByShift: (shiftId: string) => Promise<APIResponse>;
    };
    databaseAPI: {
      getInfo: () => Promise<APIResponse>;
    };
    printerAPI: {
      getStatus: () => Promise<{
        connected: boolean;
        interface: string;
        type: string;
        error?: string;
      }>;
      connect: (config: { type: string; interface: string }) => Promise<{
        success: boolean;
        error?: string;
      }>;
      disconnect: () => Promise<void>;
      printReceipt: (transactionData: {
        id: string;
        items: Array<{
          name: string;
          quantity: number;
          price: number;
          total: number;
        }>;
        total: number;
        timestamp: Date;
        cashierName: string;
        businessName: string;
      }) => Promise<{
        success: boolean;
        error?: string;
      }>;
      cancelPrint: () => Promise<void>;
      getAvailableInterfaces: () => Promise<
        Array<{
          type: "usb" | "bluetooth";
          name: string;
          address: string;
        }>
      >;
    };

    paymentAPI: {
      // Card Reader Operations
      initializeReader: (config: {
        type: "bbpos_wisepad3" | "simulated";
        connectionType: "usb" | "bluetooth";
        deviceId?: string;
        simulated?: boolean;
      }) => Promise<{ success: boolean; error?: string }>;

      discoverReaders: () => Promise<{
        success: boolean;
        readers: Array<{
          type: string;
          id: string;
          name: string;
          connectionType: "usb" | "bluetooth";
        }>;
      }>;

      getReaderStatus: () => Promise<{
        connected: boolean;
        deviceType: string;
        connectionType: "usb" | "bluetooth" | "none";
        batteryLevel?: number;
        firmwareVersion?: string;
        lastActivity?: string;
        error?: string;
      }>;

      testReader: () => Promise<{ success: boolean; error?: string }>;
      disconnectReader: () => Promise<{ success: boolean }>;

      // Payment Processing
      createPaymentIntent: (data: {
        amount: number;
        currency: string;
        description?: string;
        metadata?: Record<string, string>;
      }) => Promise<{
        success: boolean;
        clientSecret?: string;
        error?: string;
      }>;

      processCardPayment: (paymentIntentId: string) => Promise<{
        success: boolean;
        paymentIntent?: {
          id: string;
          amount: number;
          currency: string;
          status: string;
        };
        error?: string;
        errorCode?: string;
      }>;

      cancelPayment: () => Promise<{ success: boolean; error?: string }>;
      getConnectionToken: () => Promise<{
        success: boolean;
        secret?: string;
        error?: string;
      }>;
    };
  }
}

export {};
