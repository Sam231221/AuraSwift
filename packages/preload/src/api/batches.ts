import { ipcRenderer } from "electron";

export interface CreateBatchData {
  productId: string;
  batchNumber?: string;
  manufacturingDate?: Date | string;
  expiryDate: Date | string;
  initialQuantity: number;
  currentQuantity?: number;
  supplierId?: string;
  purchaseOrderNumber?: string;
  costPrice?: number;
  businessId: string;
}

export interface BatchSelectionResult {
  batchId: string;
  quantity: number;
  batchNumber: string;
  expiryDate: Date;
}

export interface GetBatchesOptions {
  status?: "ACTIVE" | "EXPIRED" | "SOLD_OUT" | "REMOVED";
  includeExpired?: boolean;
  productId?: string;
  expiringWithinDays?: number;
}

export const batchesAPI = {
  create: (batchData: CreateBatchData) =>
    ipcRenderer.invoke("batches:create", batchData),

  getById: (batchId: string) => ipcRenderer.invoke("batches:getById", batchId),

  getByProduct: (productId: string, options?: GetBatchesOptions) =>
    ipcRenderer.invoke("batches:getByProduct", productId, options),

  getByBusiness: (businessId: string, options?: GetBatchesOptions) =>
    ipcRenderer.invoke("batches:getByBusiness", businessId, options),

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
      status?: "ACTIVE" | "EXPIRED" | "SOLD_OUT" | "REMOVED";
      expiryStatus?: "all" | "expired" | "critical" | "warning" | "info";
      expiringWithinDays?: number;
    }
  ) =>
    ipcRenderer.invoke("batches:getPaginated", businessId, pagination, filters),

  getStats: (
    businessId: string,
    expirySettings?: {
      criticalAlertDays: number;
      warningAlertDays: number;
      infoAlertDays: number;
    }
  ) => ipcRenderer.invoke("batches:getStats", businessId, expirySettings),

  getActiveBatches: (
    productId: string,
    rotationMethod?: "FIFO" | "FEFO" | "NONE"
  ) =>
    ipcRenderer.invoke("batches:getActiveBatches", productId, rotationMethod),

  selectForSale: (
    productId: string,
    quantity: number,
    rotationMethod?: "FIFO" | "FEFO" | "NONE"
  ) =>
    ipcRenderer.invoke(
      "batches:selectForSale",
      productId,
      quantity,
      rotationMethod
    ),

  updateQuantity: (
    batchId: string,
    quantity: number,
    movementType: "INBOUND" | "OUTBOUND" | "ADJUSTMENT",
    userId?: string,
    reason?: string
  ) =>
    ipcRenderer.invoke(
      "batches:updateQuantity",
      batchId,
      quantity,
      movementType,
      userId,
      reason
    ),

  updateStatus: (
    batchId: string,
    status: "ACTIVE" | "EXPIRED" | "SOLD_OUT" | "REMOVED"
  ) => ipcRenderer.invoke("batches:updateStatus", batchId, status),

  getExpiringSoon: (businessId: string, days: number) =>
    ipcRenderer.invoke("batches:getExpiringSoon", businessId, days),

  calculateProductStock: (productId: string) =>
    ipcRenderer.invoke("batches:calculateProductStock", productId),

  autoUpdateExpired: (businessId?: string) =>
    ipcRenderer.invoke("batches:autoUpdateExpired", businessId),

  remove: (batchId: string) => ipcRenderer.invoke("batches:remove", batchId),

  getByNumber: (batchNumber: string, productId: string, businessId: string) =>
    ipcRenderer.invoke(
      "batches:getByNumber",
      batchNumber,
      productId,
      businessId
    ),

  // Optimized dashboard batches - only returns expired + expiring soon batches with limit
  getForDashboard: (
    businessId: string,
    options?: {
      expiringWithinDays?: number; // Default 30 days
      limit?: number; // Default 100
      includeExpired?: boolean; // Default true
    }
  ) => ipcRenderer.invoke("batches:getForDashboard", businessId, options),
};
