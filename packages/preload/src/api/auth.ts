import { ipcRenderer } from "electron";

export const authAPI = {
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
    username: string;
    pin: string;
    email?: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: "cashier" | "manager";
    avatar?: string;
  }) => ipcRenderer.invoke("auth:createUser", userData),

  login: (credentials: {
    username: string;
    pin: string;
    rememberMe?: boolean;
    terminalId?: string;
    ipAddress?: string;
    locationId?: string;
    autoClockIn?: boolean;
  }) => ipcRenderer.invoke("auth:login", credentials),

  validateSession: (token: string) =>
    ipcRenderer.invoke("auth:validateSession", token),

  logout: (
    token: string,
    options?: {
      terminalId?: string;
      ipAddress?: string;
      autoClockOut?: boolean;
    }
  ) => ipcRenderer.invoke("auth:logout", token, options),

  getUserById: (userId: string) =>
    ipcRenderer.invoke("auth:getUserById", userId),

  updateUser: (userId: string, updates: any) =>
    ipcRenderer.invoke("auth:updateUser", userId, updates),

  getAllActiveUsers: () => ipcRenderer.invoke("auth:getAllActiveUsers"),

  getUsersByBusiness: (businessId: string) =>
    ipcRenderer.invoke("auth:getUsersByBusiness", businessId),

  deleteUser: (userId: string) => ipcRenderer.invoke("auth:deleteUser", userId),

  getBusinessById: (businessId: string) =>
    ipcRenderer.invoke("auth:getBusinessById", businessId),
};

export const authStore = {
  set: (key: string, value: string) =>
    ipcRenderer.invoke("auth:set", key, value),
  get: (key: string) => ipcRenderer.invoke("auth:get", key),
  delete: (key: string) => ipcRenderer.invoke("auth:delete", key),
};

// Time Tracking API
export const timeTrackingAPI = {
  clockIn: (data: {
    userId: string;
    terminalId: string;
    locationId?: string;
    businessId: string;
    ipAddress?: string;
  }) => ipcRenderer.invoke("timeTracking:clockIn", data),

  clockOut: (data: {
    userId: string;
    terminalId: string;
    ipAddress?: string;
  }) => ipcRenderer.invoke("timeTracking:clockOut", data),

  getActiveShift: (userId: string) =>
    ipcRenderer.invoke("timeTracking:getActiveShift", userId),

  startBreak: (data: {
    shiftId: string;
    userId: string;
    type?: "meal" | "rest" | "other";
    isPaid?: boolean;
  }) => ipcRenderer.invoke("timeTracking:startBreak", data),

  endBreak: (breakId: string) =>
    ipcRenderer.invoke("timeTracking:endBreak", breakId),
};
