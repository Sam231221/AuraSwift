import { contextBridge, ipcRenderer } from "electron";
import { sha256sum } from "./nodeCrypto.js";
import { versions } from "./versions.js";

// Auth store for session management
contextBridge.exposeInMainWorld("authStore", {
  set: (key: string, value: string) =>
    ipcRenderer.invoke("auth:set", key, value),
  get: (key: string) => ipcRenderer.invoke("auth:get", key),
  delete: (key: string) => ipcRenderer.invoke("auth:delete", key),
});

// Authentication API
contextBridge.exposeInMainWorld("authAPI", {
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
  }) => ipcRenderer.invoke("auth:register", userData),

  registerBusiness: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    avatar?: string;
    businessAvatar?: string;
  }) => ipcRenderer.invoke("auth:registerBusiness", userData),

  createUser: (userData: {
    businessId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "cashier" | "manager";
    avatar?: string;
  }) => ipcRenderer.invoke("auth:createUser", userData),

  login: (credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => ipcRenderer.invoke("auth:login", credentials),

  validateSession: (token: string) =>
    ipcRenderer.invoke("auth:validateSession", token),

  logout: (token: string) => ipcRenderer.invoke("auth:logout", token),

  getUserById: (userId: string) =>
    ipcRenderer.invoke("auth:getUserById", userId),

  updateUser: (userId: string, updates: any) =>
    ipcRenderer.invoke("auth:updateUser", userId, updates),

  getUsersByBusiness: (businessId: string) =>
    ipcRenderer.invoke("auth:getUsersByBusiness", businessId),

  deleteUser: (userId: string) => ipcRenderer.invoke("auth:deleteUser", userId),
});

// Product Management API
contextBridge.exposeInMainWorld("productAPI", {
  create: (productData: {
    name: string;
    description: string;
    price: number;
    costPrice: number;
    taxRate: number;
    sku: string;
    plu?: string;
    image?: string;
    category: string;
    stockLevel: number;
    minStockLevel: number;
    businessId: string;
    modifiers?: any[];
    // Weight-based product fields
    requiresWeight?: boolean;
    unit?: "lb" | "kg" | "oz" | "g" | "each";
    pricePerUnit?: number;
  }) => ipcRenderer.invoke("products:create", productData),

  getByBusiness: (businessId: string) =>
    ipcRenderer.invoke("products:getByBusiness", businessId),

  getById: (id: string) => ipcRenderer.invoke("products:getById", id),

  update: (id: string, updates: any) =>
    ipcRenderer.invoke("products:update", id, updates),

  delete: (id: string) => ipcRenderer.invoke("products:delete", id),

  createModifier: (modifierData: {
    name: string;
    type: "single" | "multiple";
    required: boolean;
    businessId: string;
    options: { name: string; price: number }[];
  }) => ipcRenderer.invoke("modifiers:create", modifierData),

  adjustStock: (adjustmentData: {
    productId: string;
    type: "add" | "remove" | "sale" | "waste" | "adjustment";
    quantity: number;
    reason: string;
    userId: string;
    businessId: string;
  }) => ipcRenderer.invoke("stock:adjust", adjustmentData),

  getStockAdjustments: (productId: string) =>
    ipcRenderer.invoke("stock:getAdjustments", productId),
});

// Category Management API
contextBridge.exposeInMainWorld("categoryAPI", {
  create: (categoryData: {
    name: string;
    description?: string;
    businessId: string;
    sortOrder?: number;
  }) => ipcRenderer.invoke("categories:create", categoryData),

  getByBusiness: (businessId: string) =>
    ipcRenderer.invoke("categories:getByBusiness", businessId),

  getById: (id: string) => ipcRenderer.invoke("categories:getById", id),

  update: (id: string, updates: any) =>
    ipcRenderer.invoke("categories:update", id, updates),

  delete: (id: string) => ipcRenderer.invoke("categories:delete", id),

  reorder: (businessId: string, categoryIds: string[]) =>
    ipcRenderer.invoke("categories:reorder", businessId, categoryIds),
});

// Schedule Management API
contextBridge.exposeInMainWorld("scheduleAPI", {
  create: (scheduleData: {
    staffId: string;
    businessId: string;
    startTime: string;
    endTime: string;
    assignedRegister?: string;
    notes?: string;
  }) => ipcRenderer.invoke("schedules:create", scheduleData),

  getByBusiness: (businessId: string) =>
    ipcRenderer.invoke("schedules:getByBusiness", businessId),

  getByStaff: (staffId: string) =>
    ipcRenderer.invoke("schedules:getByStaff", staffId),

  update: (
    id: string,
    updates: {
      staffId?: string;
      startTime?: string;
      endTime?: string;
      assignedRegister?: string;
      notes?: string;
      status?: "upcoming" | "active" | "completed" | "missed";
    }
  ) => ipcRenderer.invoke("schedules:update", id, updates),

  delete: (id: string) => ipcRenderer.invoke("schedules:delete", id),

  updateStatus: (
    id: string,
    status: "upcoming" | "active" | "completed" | "missed"
  ) => ipcRenderer.invoke("schedules:updateStatus", id, status),

  getCashierUsers: (businessId: string) =>
    ipcRenderer.invoke("schedules:getCashierUsers", businessId),
});

// Shift management API
contextBridge.exposeInMainWorld("shiftAPI", {
  start: (shiftData: {
    scheduleId?: string;
    cashierId: string;
    businessId: string;
    startingCash: number;
    notes?: string;
  }) => ipcRenderer.invoke("shift:start", shiftData),

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
  ) => ipcRenderer.invoke("shift:end", shiftId, endData),

  getActive: (cashierId: string) =>
    ipcRenderer.invoke("shift:getActive", cashierId),

  getTodaySchedule: (cashierId: string) =>
    ipcRenderer.invoke("shift:getTodaySchedule", cashierId),

  getStats: (shiftId: string) => ipcRenderer.invoke("shift:getStats", shiftId),

  getHourlyStats: (shiftId: string) =>
    ipcRenderer.invoke("shift:getHourlyStats", shiftId),

  getCashDrawerBalance: (shiftId: string) =>
    ipcRenderer.invoke("shift:getCashDrawerBalance", shiftId),

  reconcile: (
    shiftId: string,
    reconciliationData: {
      actualCashDrawer: number;
      managerNotes: string;
      managerId: string;
    }
  ) => ipcRenderer.invoke("shift:reconcile", shiftId, reconciliationData),

  getPendingReconciliation: (businessId: string) =>
    ipcRenderer.invoke("shift:getPendingReconciliation", businessId),
});

// Transaction Management API
contextBridge.exposeInMainWorld("transactionAPI", {
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
  }) => ipcRenderer.invoke("transactions:create", transactionData),

  getByShift: (shiftId: string) =>
    ipcRenderer.invoke("transactions:getByShift", shiftId),
});

// Refund Management API
contextBridge.exposeInMainWorld("refundAPI", {
  getTransactionById: (transactionId: string) =>
    ipcRenderer.invoke("refunds:getTransactionById", transactionId),

  getTransactionByReceipt: (receiptNumber: string) =>
    ipcRenderer.invoke("refunds:getTransactionByReceipt", receiptNumber),

  getRecentTransactions: (businessId: string, limit?: number) =>
    ipcRenderer.invoke("refunds:getRecentTransactions", businessId, limit),

  getShiftTransactions: (shiftId: string, limit?: number) =>
    ipcRenderer.invoke("refunds:getShiftTransactions", shiftId, limit),

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
  ) =>
    ipcRenderer.invoke(
      "refunds:validateEligibility",
      transactionId,
      refundItems
    ),

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
  }) => ipcRenderer.invoke("refunds:create", refundData),
});

// Void Management API
contextBridge.exposeInMainWorld("voidAPI", {
  validateEligibility: (transactionId: string) =>
    ipcRenderer.invoke("voids:validateEligibility", transactionId),

  voidTransaction: (voidData: {
    transactionId: string;
    cashierId: string;
    reason: string;
    managerApprovalId?: string;
  }) => ipcRenderer.invoke("voids:create", voidData),

  getTransactionById: (transactionId: string) =>
    ipcRenderer.invoke("voids:getTransactionById", transactionId),

  getTransactionByReceipt: (receiptNumber: string) =>
    ipcRenderer.invoke("voids:getTransactionByReceipt", receiptNumber),
});

// Cash Drawer Count API
contextBridge.exposeInMainWorld("cashDrawerAPI", {
  getExpectedCash: (shiftId: string) =>
    ipcRenderer.invoke("cashDrawer:getExpectedCash", shiftId),

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
  }) => ipcRenderer.invoke("cashDrawer:createCount", countData),

  getCountsByShift: (shiftId: string) =>
    ipcRenderer.invoke("cashDrawer:getCountsByShift", shiftId),
});

// Database Information API (for debugging)
contextBridge.exposeInMainWorld("databaseAPI", {
  getInfo: () => ipcRenderer.invoke("database:getInfo"),
});

// Thermal Printer API
contextBridge.exposeInMainWorld("printerAPI", {
  getStatus: () => ipcRenderer.invoke("printer:getStatus"),
  connect: (config: { type: string; interface: string }) =>
    ipcRenderer.invoke("printer:connect", config),
  disconnect: () => ipcRenderer.invoke("printer:disconnect"),
  printReceipt: (transactionData: any) =>
    ipcRenderer.invoke("printer:printReceipt", transactionData),
  cancelPrint: () => ipcRenderer.invoke("printer:cancelPrint"),
  getAvailableInterfaces: () =>
    ipcRenderer.invoke("printer:getAvailableInterfaces"),
});

// Payment API for BBPOS WisePad 3 card reader integration
contextBridge.exposeInMainWorld("paymentAPI", {
  // Card Reader Operations
  initializeReader: (config: {
    type: "bbpos_wisepad3" | "simulated";
    connectionType: "usb" | "bluetooth";
    deviceId?: string;
    simulated?: boolean;
  }) => ipcRenderer.invoke("payment:initialize-reader", config),

  discoverReaders: () => ipcRenderer.invoke("payment:discover-readers"),
  getReaderStatus: () => ipcRenderer.invoke("payment:reader-status"),
  testReader: () => ipcRenderer.invoke("payment:test-reader"),
  disconnectReader: () => ipcRenderer.invoke("payment:disconnect-reader"),

  // Payment Processing
  createPaymentIntent: (data: {
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, string>;
  }) => ipcRenderer.invoke("payment:create-intent", data),

  processCardPayment: (paymentIntentId: string) =>
    ipcRenderer.invoke("payment:process-card", paymentIntentId),

  cancelPayment: () => ipcRenderer.invoke("payment:cancel"),

  // Connection Token (for Stripe Terminal)
  getConnectionToken: () => ipcRenderer.invoke("payment:connection-token"),
});

export { sha256sum, versions };
