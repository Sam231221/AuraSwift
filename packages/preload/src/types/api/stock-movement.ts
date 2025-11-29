/**
 * Stock Movement API Types - Preload
 * 
 * Type definitions for stock movement tracking IPC APIs.
 * 
 * @module preload/types/api/stock-movement
 */

export interface CreateStockMovementData {
  productId: string;
  batchId?: string;
  movementType: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TRANSFER" | "WASTE";
  quantity: number;
  reason?: string;
  reference?: string;
  fromBatchId?: string;
  toBatchId?: string;
  userId: string;
  businessId: string;
}

export interface GetMovementsFilters {
  productId?: string;
  batchId?: string;
  movementType?: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TRANSFER" | "WASTE";
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface StockMovementAPIPreload {
  create: (movementData: CreateStockMovementData) => Promise<any>;

  getByProduct: (productId: string) => Promise<any>;

  getByBatch: (batchId: string) => Promise<any>;

  getByBusiness: (businessId: string, filters?: GetMovementsFilters) => Promise<any>;
}

