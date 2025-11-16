import { ipcRenderer } from "electron";

export const databaseAPI = {
  getInfo: () => ipcRenderer.invoke("database:getInfo"),
  backup: () => ipcRenderer.invoke("database:backup"),
  empty: () => ipcRenderer.invoke("database:empty"),
  import: () => ipcRenderer.invoke("database:import"),
};

export const printerAPI = {
  getStatus: () => ipcRenderer.invoke("printer:getStatus"),
  connect: (config: { type: string; interface: string }) =>
    ipcRenderer.invoke("printer:connect", config),
  disconnect: () => ipcRenderer.invoke("printer:disconnect"),
  printReceipt: (transactionData: any) =>
    ipcRenderer.invoke("printer:printReceipt", transactionData),
  cancelPrint: () => ipcRenderer.invoke("printer:cancelPrint"),
  getAvailableInterfaces: () =>
    ipcRenderer.invoke("printer:getAvailableInterfaces"),
};

export const officePrinterAPI = {
  // Printer Discovery
  list: () => ipcRenderer.invoke("office-printer:list"),
  getDefault: () => ipcRenderer.invoke("office-printer:get-default"),

  // Print Operations
  print: (config: {
    jobId: string;
    printerName: string;
    documentPath?: string;
    documentData?: Buffer;
    documentType: "pdf" | "image" | "text" | "raw";
    options?: any;
    metadata?: any;
    createdBy?: string;
    businessId?: string;
  }) => ipcRenderer.invoke("office-printer:print", config),

  // Job Management
  getJobStatus: (jobId: string) =>
    ipcRenderer.invoke("office-printer:job-status", jobId),
  cancel: (jobId: string) => ipcRenderer.invoke("office-printer:cancel", jobId),
  retry: (jobId: string) => ipcRenderer.invoke("office-printer:retry", jobId),
  getFailedJobs: () => ipcRenderer.invoke("office-printer:failed-jobs"),

  // Health & Monitoring
  getHealth: (printerName: string) =>
    ipcRenderer.invoke("office-printer:health", printerName),
  getMetrics: () => ipcRenderer.invoke("office-printer:metrics"),

  // Queue Management
  clearQueue: () => ipcRenderer.invoke("office-printer:clear-queue"),
};

export const paymentAPI = {
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
};

export const pdfReceiptAPI = {
  generatePDF: (receiptData: any) =>
    ipcRenderer.invoke("receipt:generate-pdf", receiptData),
};

export const appAPI = {
  restart: () => ipcRenderer.invoke("app:restart"),
};
