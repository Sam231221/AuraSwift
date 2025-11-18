import { ipcRenderer } from "electron";

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

export const stockMovementsAPI = {
  create: (movementData: CreateStockMovementData) =>
    ipcRenderer.invoke("stockMovements:create", movementData),

  getByProduct: (productId: string) =>
    ipcRenderer.invoke("stockMovements:getByProduct", productId),

  getByBatch: (batchId: string) =>
    ipcRenderer.invoke("stockMovements:getByBatch", batchId),

  getByBusiness: (businessId: string, filters?: GetMovementsFilters) =>
    ipcRenderer.invoke("stockMovements:getByBusiness", businessId, filters),
};

