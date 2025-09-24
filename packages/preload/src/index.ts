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

export { sha256sum, versions };
