/**
 * Batch API Types - Preload
 * 
 * Type definitions for product batch management IPC APIs.
 * 
 * @module preload/types/api/batch
 */

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

export interface BatchAPIPreload {
  create: (batchData: CreateBatchData) => Promise<any>;

  getById: (batchId: string) => Promise<any>;

  getByProduct: (productId: string, options?: GetBatchesOptions) => Promise<any>;

  getByBusiness: (businessId: string, options?: GetBatchesOptions) => Promise<any>;

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
  ) => Promise<any>;

  getActiveBatches: (
    productId: string,
    rotationMethod?: "FIFO" | "FEFO" | "NONE"
  ) => Promise<any>;

  selectForSale: (
    productId: string,
    quantity: number,
    rotationMethod?: "FIFO" | "FEFO" | "NONE"
  ) => Promise<any>;

  updateQuantity: (
    batchId: string,
    quantity: number,
    movementType: "INBOUND" | "OUTBOUND" | "ADJUSTMENT",
    userId?: string,
    reason?: string
  ) => Promise<any>;

  updateStatus: (
    batchId: string,
    status: "ACTIVE" | "EXPIRED" | "SOLD_OUT" | "REMOVED"
  ) => Promise<any>;

  getExpiringSoon: (businessId: string, days: number) => Promise<any>;

  calculateProductStock: (productId: string) => Promise<any>;

  autoUpdateExpired: (businessId?: string) => Promise<any>;

  remove: (batchId: string) => Promise<any>;

  getByNumber: (batchNumber: string, productId: string, businessId: string) => Promise<any>;
}

