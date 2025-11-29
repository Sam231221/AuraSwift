/**
 * Stock Movement Types
 * 
 * Types for tracking stock movements and adjustments.
 * 
 * @module types/features/stock
 */

export type StockMovementType =
  | 'INBOUND'
  | 'OUTBOUND'
  | 'ADJUSTMENT'
  | 'TRANSFER'
  | 'WASTE';

export interface StockMovement {
  id: string;
  productId: string;
  batchId?: string;
  movementType: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  fromBatchId?: string;
  toBatchId?: string;
  userId: string;
  businessId: string;
  timestamp: string;
  createdAt: string;
}

export interface CreateStockMovementRequest {
  productId: string;
  batchId?: string;
  movementType: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  userId: string;
  businessId: string;
}

export interface StockMovementResponse {
  success: boolean;
  message?: string;
  movement?: StockMovement;
  movements?: StockMovement[];
  error?: string;
}
