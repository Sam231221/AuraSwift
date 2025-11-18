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

  getById: (batchId: string) =>
    ipcRenderer.invoke("batches:getById", batchId),

  getByProduct: (productId: string, options?: GetBatchesOptions) =>
    ipcRenderer.invoke("batches:getByProduct", productId, options),

  getByBusiness: (businessId: string, options?: GetBatchesOptions) =>
    ipcRenderer.invoke("batches:getByBusiness", businessId, options),

  getActiveBatches: (productId: string, rotationMethod?: "FIFO" | "FEFO" | "NONE") =>
    ipcRenderer.invoke("batches:getActiveBatches", productId, rotationMethod),

  selectForSale: (
    productId: string,
    quantity: number,
    rotationMethod?: "FIFO" | "FEFO" | "NONE"
  ) =>
    ipcRenderer.invoke("batches:selectForSale", productId, quantity, rotationMethod),

  updateQuantity: (
    batchId: string,
    quantity: number,
    movementType: "INBOUND" | "OUTBOUND" | "ADJUSTMENT"
  ) =>
    ipcRenderer.invoke("batches:updateQuantity", batchId, quantity, movementType),

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
    ipcRenderer.invoke("batches:getByNumber", batchNumber, productId, businessId),
};

