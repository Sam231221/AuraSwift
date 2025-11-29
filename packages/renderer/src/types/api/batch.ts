/**
 * Batch API Types
 * 
 * Types for product batch management operations.
 * 
 * @module types/api/batch
 */

import type { StockRotationMethod } from '../features/batches';

export interface BatchAPI {
  create: (batchData: Record<string, any>) => Promise<any>;
  
  getByBusiness: (
    businessId: string,
    options?: Record<string, any>
  ) => Promise<any>;
  
  getActiveBatches: (
    productId: string,
    rotationMethod?: StockRotationMethod
  ) => Promise<any>;
  
  getPaginated: (
    businessId: string,
    pagination: {
      page: number;
      pageSize: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    filters?: {
      productId?: string;
      status?: 'all' | 'ACTIVE' | 'EXPIRED' | 'SOLD_OUT' | 'REMOVED';
      expiryStatus?: 'all' | 'expired' | 'critical' | 'warning' | 'info';
    }
  ) => Promise<any>;
  
  getById: (id: string) => Promise<any>;
  update: (id: string, updates: Record<string, any>) => Promise<any>;
  
  updateQuantity: (
    batchId: string,
    quantity: number,
    movementType: string,
    userId: string,
    reason: string
  ) => Promise<any>;
  
  delete: (id: string) => Promise<any>;
  remove: (id: string) => Promise<any>;
}
