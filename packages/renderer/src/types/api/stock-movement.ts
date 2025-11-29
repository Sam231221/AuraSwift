/**
 * Stock Movement API Types
 * 
 * Types for stock movement tracking operations.
 * 
 * @module types/api/stock-movement
 */

import type { APIResponse } from './common';

export interface StockMovementAPI {
  create: (movementData: {
    productId: string;
    batchId?: string;
    movementType:
      | 'INBOUND'
      | 'OUTBOUND'
      | 'ADJUSTMENT'
      | 'TRANSFER'
      | 'WASTE';
    quantity: number;
    reason?: string;
    reference?: string;
    userId: string;
    businessId: string;
  }) => Promise<APIResponse>;

  getByProduct: (productId: string) => Promise<APIResponse>;
  getByBatch: (batchId: string) => Promise<APIResponse>;
  getByBusiness: (businessId: string) => Promise<APIResponse>;
}

