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
});

export { sha256sum, versions };
