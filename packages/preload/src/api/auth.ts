import { ipcRenderer } from "electron";

export const authAPI = {
  register: (userData: {
    email?: string;
    firstName: string;
    lastName: string;
    businessName: string;
    role: "cashier" | "manager" | "admin";
    username: string;
    pin: string;
  }) => ipcRenderer.invoke("auth:register", userData),

  registerBusiness: (userData: {
    email?: string;
    firstName: string;
    lastName: string;
    businessName: string;
    username: string;
    pin: string;
    avatar?: string;
    businessAvatar?: string;
  }) => ipcRenderer.invoke("auth:registerBusiness", userData),

  createUser: (
    sessionToken: string,
    userData: {
      businessId: string;
      username: string;
      pin: string;
      email?: string;
      firstName: string;
      lastName: string;
      role: "cashier" | "manager";
      avatar?: string;
    }
  ) => ipcRenderer.invoke("auth:createUser", sessionToken, userData),

  login: (credentials: {
    username: string;
    pin: string;
    rememberMe?: boolean;
    terminalId?: string;
    ipAddress?: string;
  }) => ipcRenderer.invoke("auth:login", credentials),

  validateSession: (token: string) =>
    ipcRenderer.invoke("auth:validateSession", token),

  logout: (
    token: string,
    options?: {
      terminalId?: string;
      ipAddress?: string;
    }
  ) => ipcRenderer.invoke("auth:logout", token, options),

  getUserById: (sessionTokenOrUserId: string, userId?: string) =>
    ipcRenderer.invoke("auth:getUserById", sessionTokenOrUserId, userId),

  updateUser: (sessionToken: string, userId: string, updates: any) =>
    ipcRenderer.invoke("auth:updateUser", sessionToken, userId, updates),

  getAllActiveUsers: (sessionToken?: string) =>
    ipcRenderer.invoke("auth:getAllActiveUsers", sessionToken),

  getUsersByBusiness: (sessionToken: string, businessId: string) =>
    ipcRenderer.invoke("auth:getUsersByBusiness", sessionToken, businessId),

  deleteUser: (sessionToken: string, userId: string) =>
    ipcRenderer.invoke("auth:deleteUser", sessionToken, userId),

  getBusinessById: (sessionToken: string, businessId: string) =>
    ipcRenderer.invoke("auth:getBusinessById", sessionToken, businessId),
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
