import { contextBridge, ipcRenderer } from "electron";
import { sha256sum } from "./nodeCrypto.js";
import { versions } from "./versions.js";

import { authAPI, authStore } from "./api/auth.js";
import { productAPI } from "./api/products.js";
import { categoryAPI } from "./api/categories.js";
import { scheduleAPI, shiftAPI } from "./api/shifts.js";
import {
  transactionAPI,
  refundAPI,
  voidAPI,
  cashDrawerAPI,
} from "./api/transactions.js";
import {
  databaseAPI,
  printerAPI,
  officePrinterAPI,
  paymentAPI,
  pdfReceiptAPI,
  appAPI,
} from "./api/system.js";

// Expose APIs to renderer process
contextBridge.exposeInMainWorld("authStore", authStore);
contextBridge.exposeInMainWorld("authAPI", authAPI);
contextBridge.exposeInMainWorld("productAPI", productAPI);
contextBridge.exposeInMainWorld("categoryAPI", categoryAPI);
contextBridge.exposeInMainWorld("scheduleAPI", scheduleAPI);
contextBridge.exposeInMainWorld("shiftAPI", shiftAPI);
contextBridge.exposeInMainWorld("transactionAPI", transactionAPI);
contextBridge.exposeInMainWorld("refundAPI", refundAPI);
contextBridge.exposeInMainWorld("voidAPI", voidAPI);
contextBridge.exposeInMainWorld("cashDrawerAPI", cashDrawerAPI);
contextBridge.exposeInMainWorld("databaseAPI", databaseAPI);
contextBridge.exposeInMainWorld("printerAPI", printerAPI);
contextBridge.exposeInMainWorld("officePrinterAPI", officePrinterAPI);
contextBridge.exposeInMainWorld("paymentAPI", paymentAPI);
contextBridge.exposeInMainWorld("pdfReceiptAPI", pdfReceiptAPI);
contextBridge.exposeInMainWorld("appAPI", appAPI);

// Generic IPC send function for testing and general IPC communication
export const send = (channel: string, ...args: any[]) =>
  ipcRenderer.invoke(channel, ...args);

export { sha256sum, versions };
