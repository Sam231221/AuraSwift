import type { User, Business } from "./user";

export interface APIResponse {
  success: boolean;
  message: string;
  data?: unknown;
  token?: string;
  user?: User;
  users?: User[];
  business?: Business;
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
      createUser: (
        sessionToken: string,
        userData: {
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
      ) => Promise<APIResponse>;
      login: (credentials: {
        username: string;
        pin: string;
        rememberMe?: boolean;
        terminalId?: string;
        ipAddress?: string;
        locationId?: string;
        autoClockIn?: boolean;
      }) => Promise<
        APIResponse & {
          clockEvent?: any;
          shift?: any;
          requiresClockIn?: boolean;
        }
      >;
      validateSession: (token: string) => Promise<APIResponse>;
      logout: (
        token: string,
        options?: {
          terminalId?: string;
          ipAddress?: string;
          autoClockOut?: boolean;
        }
      ) => Promise<
        APIResponse & {
          isClockedIn?: boolean;
          activeShift?: any;
        }
      >;
      getUserById: (
        sessionTokenOrUserId: string,
        userId?: string
      ) => Promise<APIResponse>;
      updateUser: (
        sessionToken: string,
        userId: string,
        updates: Record<string, string | number | boolean>
      ) => Promise<APIResponse>;
      getAllActiveUsers: (sessionToken?: string) => Promise<APIResponse>;
      getUsersByBusiness: (
        sessionToken: string,
        businessId: string
      ) => Promise<APIResponse>;
      deleteUser: (sessionToken: string, userId: string) => Promise<APIResponse>;
      getBusinessById: (
        sessionToken: string,
        businessId: string
      ) => Promise<{
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
        deviceId?: string;
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
        // Either productId OR categoryId must be provided (mutually exclusive)
        productId?: string;
        categoryId?: string;
        itemName?: string; // For category items or when product is deleted
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
        paymentMethod: "cash" | "card" | "mobile" | "voucher" | "split";
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
        paymentMethod: "cash" | "card" | "mobile" | "voucher" | "split";
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
    timeTrackingAPI: {
      clockIn: (data: {
        userId: string;
        terminalId: string;
        locationId?: string;
        businessId: string;
        ipAddress?: string;
      }) => Promise<
        APIResponse & {
          clockEvent?: any;
          shift?: any;
        }
      >;
      clockOut: (data: {
        userId: string;
        terminalId: string;
        ipAddress?: string;
      }) => Promise<
        APIResponse & {
          clockEvent?: any;
          shift?: any;
        }
      >;
      getActiveShift: (userId: string) => Promise<
        APIResponse & {
          shift?: any;
          breaks?: any[];
        }
      >;
      startBreak: (data: {
        shiftId: string;
        userId: string;
        type?: "meal" | "rest" | "other";
        isPaid?: boolean;
      }) => Promise<
        APIResponse & {
          break?: any;
        }
      >;
      endBreak: (breakId: string) => Promise<
        APIResponse & {
          break?: any;
        }
      >;
    };
    ageVerificationAPI: {
      create: (verificationData: {
        transactionId?: string;
        transactionItemId?: string;
        productId: string;
        verificationMethod: "manual" | "scan" | "override";
        customerBirthdate?: Date | string;
        calculatedAge?: number;
        idScanData?: any;
        verifiedBy: string;
        managerOverrideId?: string;
        overrideReason?: string;
        businessId: string;
      }) => Promise<APIResponse>;
      getByTransaction: (transactionId: string) => Promise<APIResponse>;
      getByTransactionItem: (transactionItemId: string) => Promise<APIResponse>;
      getByBusiness: (
        businessId: string,
        options?: {
          startDate?: Date;
          endDate?: Date;
          verificationMethod?: "manual" | "scan" | "override";
        }
      ) => Promise<APIResponse>;
      getByProduct: (productId: string) => Promise<APIResponse>;
      getByStaff: (
        staffId: string,
        options?: {
          startDate?: Date;
          endDate?: Date;
        }
      ) => Promise<APIResponse>;
    };
    importAPI: {
      selectFile: (
        fileType?: "department" | "product"
      ) => Promise<{ success: boolean; filePath?: string; message?: string }>;
      parseFile: (filePath: string) => Promise<any>;
      validate: (data: any[], businessId: string) => Promise<any>;
      executeImport: (
        departmentData: any[],
        productData: any[],
        businessId: string,
        options: any
      ) => Promise<any>;
      importDepartments: (
        departmentData: any[],
        businessId: string,
        options?: any
      ) => Promise<any>;
      importProducts: (
        productData: any[],
        businessId: string,
        options?: any
      ) => Promise<any>;
      onProgress: (callback: (progress: any) => void) => () => void;
    };
    productAPI: {
      create: (productData: Record<string, any>) => Promise<any>;
      getByBusiness: (businessId: string) => Promise<any>;
      getPaginated: (
        businessId: string,
        pagination: {
          page: number;
          pageSize: number;
          sortBy?: string;
          sortOrder?: "asc" | "desc";
        },
        filters?: {
          categoryId?: string;
          searchTerm?: string;
          stockStatus?: "all" | "in_stock" | "low" | "out_of_stock";
          isActive?: boolean;
        }
      ) => Promise<any>;
      getById: (id: string) => Promise<any>;
      update: (id: string, updates: Record<string, any>) => Promise<any>;
      delete: (id: string) => Promise<any>;
      adjustStock: (adjustmentData: Record<string, any>) => Promise<any>;
      getStockAdjustments: (productId: string) => Promise<any>;
      syncStock: (businessId: string) => Promise<any>;
    };
    batchesAPI: {
      create: (batchData: Record<string, any>) => Promise<any>;
      getByBusiness: (
        businessId: string,
        options?: Record<string, any>
      ) => Promise<any>;
      getActiveBatches: (
        productId: string,
        rotationMethod?: "FIFO" | "FEFO" | "NONE"
      ) => Promise<any>;
      getPaginated: (
        businessId: string,
        pagination: {
          page: number;
          pageSize: number;
          sortBy?: string;
          sortOrder?: "asc" | "desc";
        },
        filters?: {
          productId?: string;
          status?: "all" | "ACTIVE" | "EXPIRED" | "SOLD_OUT" | "REMOVED";
          expiryStatus?: "all" | "expired" | "critical" | "warning" | "info";
        }
      ) => Promise<any>;
      getById: (id: string) => Promise<any>;
      update: (id: string, updates: Record<string, any>) => Promise<any>;
      updateQuantity: (
        batchId: string,
        quantity: number,
        movementType: string,
        userId: string,
        reason: string
      ) => Promise<any>;
      delete: (id: string) => Promise<any>;
      remove: (id: string) => Promise<any>;
    };
    categoryAPI: {
      create: (categoryData: Record<string, any>) => Promise<any>;
      getByBusiness: (businessId: string) => Promise<any>;
      getVatCategories: (businessId: string) => Promise<any>;
      update: (id: string, updates: Record<string, any>) => Promise<any>;
      delete: (id: string) => Promise<any>;
      reorder: (businessId: string, categoryIds: string[]) => Promise<any>;
    };
    supplierAPI: {
      getByBusiness: (businessId: string) => Promise<any>;
    };
    expirySettingsAPI: {
      get: (businessId: string) => Promise<any>;
    };
    stockMovementAPI: {
      create: (movementData: {
        productId: string;
        batchId?: string;
        movementType:
          | "INBOUND"
          | "OUTBOUND"
          | "ADJUSTMENT"
          | "TRANSFER"
          | "WASTE";
        quantity: number;
        reason?: string;
        reference?: string;
        userId: string;
        businessId: string;
      }) => Promise<any>;
      getByProduct: (productId: string) => Promise<any>;
      getByBatch: (batchId: string) => Promise<any>;
      getByBusiness: (businessId: string) => Promise<any>;
    };
    rbacAPI: {
      roles: {
        list: (
          sessionToken: string,
          businessId: string
        ) => Promise<APIResponse>;
        create: (
          sessionToken: string,
          roleData: {
            name: string;
            displayName: string;
            description?: string;
            permissions: string[];
            businessId: string;
            isSystemRole: boolean;
            isActive: boolean;
          }
        ) => Promise<APIResponse>;
        update: (
          sessionToken: string,
          roleId: string,
          updates: {
            displayName?: string;
            description?: string;
            permissions?: string[];
            isActive?: boolean;
          }
        ) => Promise<APIResponse>;
        delete: (sessionToken: string, roleId: string) => Promise<APIResponse>;
        getById: (sessionToken: string, roleId: string) => Promise<APIResponse>;
      };
      userRoles: {
        assign: (
          sessionToken: string,
          userId: string,
          roleId: string
        ) => Promise<APIResponse>;
        revoke: (
          sessionToken: string,
          userId: string,
          roleId: string
        ) => Promise<APIResponse>;
        getUserRoles: (
          sessionToken: string,
          userId: string
        ) => Promise<APIResponse>;
        setPrimaryRole: (
          sessionToken: string,
          userId: string,
          roleId: string
        ) => Promise<APIResponse>;
      };
      userPermissions: {
        grant: (
          sessionToken: string,
          userId: string,
          permission: string,
          reason?: string,
          expiresAt?: number
        ) => Promise<APIResponse>;
        revoke: (
          sessionToken: string,
          userId: string,
          permission: string
        ) => Promise<APIResponse>;
        getUserPermissions: (
          sessionToken: string,
          userId: string
        ) => Promise<APIResponse>;
      };
    };
  }
}

export {};
