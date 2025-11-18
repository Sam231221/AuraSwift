export interface APIResponse {
  success: boolean;
  message: string;
  data?: unknown;
  token?: string;
  user?: {
    id: string;
    username: string;
    pin: string;
    email?: string;
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
    username: string;
    pin: string;
    email?: string;
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
    firstName: string;
    lastName: string;
    businessName: string;
    avatar?: string;
    ownerId?: string;
    address?: string;
    phone?: string;
    vatNumber?: string;
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
        username: string;
        pin: string;
        email?: string;
        password?: string;
        firstName: string;
        lastName: string;
        role: "cashier" | "manager";
        avatar?: string;
        address?: string;
      }) => Promise<APIResponse>;
      login: (credentials: {
        username: string;
        pin: string;
        rememberMe?: boolean;
      }) => Promise<APIResponse>;
      validateSession: (token: string) => Promise<APIResponse>;
      logout: (token: string) => Promise<APIResponse>;
      getUserById: (userId: string) => Promise<APIResponse>;
      updateUser: (
        userId: string,
        updates: Record<string, string | number | boolean>
      ) => Promise<APIResponse>;
      getAllActiveUsers: () => Promise<APIResponse>;
      getUsersByBusiness: (businessId: string) => Promise<APIResponse>;
      deleteUser: (userId: string) => Promise<APIResponse>;
      getBusinessById: (businessId: string) => Promise<{
        success: boolean;
        business?: {
          id: string;
          firstName: string;
          lastName: string;
          businessName: string;
          ownerId: string;
          address?: string;
          phone?: string;
          vatNumber?: string;
          createdAt: string;
          updatedAt: string;
        };
        message?: string;
      }>;
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
    cartAPI: {
      // Cart Session Operations
      createSession: (sessionData: {
        cashierId: string;
        shiftId: string;
        businessId: string;
        stationId?: string;
      }) => Promise<APIResponse>;
      getSession: (sessionId: string) => Promise<APIResponse>;
      getSessionWithItems: (sessionId: string) => Promise<APIResponse>;
      getActiveSession: (cashierId: string) => Promise<APIResponse>;
      updateSession: (
        sessionId: string,
        updates: {
          status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
          totalAmount?: number;
          taxAmount?: number;
          customerAgeVerified?: boolean;
          verificationMethod?: "NONE" | "MANUAL" | "SCAN" | "OVERRIDE";
          verifiedBy?: string;
          completedAt?: Date | string;
        }
      ) => Promise<APIResponse>;
      completeSession: (sessionId: string) => Promise<APIResponse>;
      cancelSession: (sessionId: string) => Promise<APIResponse>;
      
      // Cart Item Operations
      addItem: (itemData: {
        cartSessionId: string;
        productId: string;
        itemType: "UNIT" | "WEIGHT";
        quantity?: number;
        weight?: number;
        unitOfMeasure?: string;
        unitPrice: number;
        totalPrice: number;
        taxAmount: number;
        batchId?: string;
        batchNumber?: string;
        expiryDate?: Date | string;
        ageRestrictionLevel?: "NONE" | "AGE_16" | "AGE_18" | "AGE_21";
        ageVerified?: boolean;
        scaleReadingWeight?: number;
        scaleReadingStable?: boolean;
      }) => Promise<APIResponse>;
      updateItem: (
        itemId: string,
        updates: {
          quantity?: number;
          weight?: number;
          unitPrice?: number;
          totalPrice?: number;
          taxAmount?: number;
          batchId?: string;
          batchNumber?: string;
          expiryDate?: Date | string;
          scaleReadingWeight?: number;
          scaleReadingStable?: boolean;
        }
      ) => Promise<APIResponse>;
      removeItem: (itemId: string) => Promise<APIResponse>;
      getItems: (sessionId: string) => Promise<APIResponse>;
      getItem: (itemId: string) => Promise<APIResponse>;
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
          itemType: "UNIT" | "WEIGHT";
          quantity?: number;
          weight?: number;
          unitOfMeasure?: string;
          unitPrice: number;
          totalPrice: number;
          taxAmount: number;
          batchId?: string;
          batchNumber?: string;
          expiryDate?: Date | string;
          ageRestrictionLevel?: "NONE" | "AGE_16" | "AGE_18" | "AGE_21";
          ageVerified?: boolean;
          cartItemId?: string;
        }>;
        status: "completed" | "voided" | "pending";
        customerId?: string;
        receiptNumber: string;
        timestamp: string;
        cartSessionId?: string;
      }) => Promise<APIResponse>;
      getByShift: (shiftId: string) => Promise<APIResponse>;
      createFromCart: (data: {
        cartSessionId: string;
        shiftId: string;
        businessId: string;
        paymentMethod: "cash" | "card" | "mixed";
        cashAmount?: number;
        cardAmount?: number;
        receiptNumber: string;
      }) => Promise<APIResponse>;
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
      createRefundTransaction: (refundData: {
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
      backup: () => Promise<APIResponse>;
      empty: () => Promise<APIResponse>;
      import: () => Promise<APIResponse>;
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

    pdfReceiptAPI: {
      generatePDF: (receiptData: Record<string, unknown>) => Promise<{
        success: boolean;
        data?: string;
        error?: string;
      }>;
    };

    appAPI: {
      restart: () => Promise<{ success: boolean; message?: string }>;
    };

    scaleAPI: {
      discover: () => Promise<{
        success: boolean;
        devices: Array<{
          id: string;
          type: "HID" | "SERIAL" | "TCP_IP";
          path?: string;
          vendorId?: number;
          productId?: number;
          manufacturer?: string;
          product?: string;
          serialNumber?: string;
          baudRate?: number;
          address?: string;
          port?: number;
        }>;
        error?: string;
      }>;
      connect: (config: {
        device: {
          id: string;
          type: "HID" | "SERIAL" | "TCP_IP";
          path?: string;
          vendorId?: number;
          productId?: number;
          manufacturer?: string;
          product?: string;
          serialNumber?: string;
          baudRate?: number;
          address?: string;
          port?: number;
        };
        tareWeight?: number;
        minWeight?: number;
        maxWeight?: number;
        stabilityThreshold?: number;
        stabilityReadings?: number;
        unit?: "g" | "kg" | "lb" | "oz";
        simulated?: boolean;
      }) => Promise<{ success: boolean; error?: string }>;
      disconnect: () => Promise<{ success: boolean; error?: string }>;
      getStatus: () => Promise<{
        connected: boolean;
        deviceType: string;
        connectionType: "HID" | "SERIAL" | "TCP_IP" | "none";
        deviceId?: string;
        lastReading?: {
          weight: number;
          stable: boolean;
          unit: "g" | "kg" | "lb" | "oz";
          timestamp: string;
          rawReadings?: number[];
        };
        error?: string;
        isReading: boolean;
      }>;
      tare: () => Promise<{ success: boolean; error?: string }>;
      startReading: () => void;
      stopReading: () => void;
      onReading: (
        callback: (reading: {
          weight: number;
          stable: boolean;
          unit: "g" | "kg" | "lb" | "oz";
          timestamp: string;
          rawReadings?: number[];
        }) => void
      ) => () => void;
    };
  }
}

export {};
