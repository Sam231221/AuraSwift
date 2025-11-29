/**
 * Batch Status Types
 * 
 * @module types/enums/batch-status
 */

export type BatchStatus = 'ACTIVE' | 'EXPIRED' | 'SOLD_OUT' | 'REMOVED';

export const BATCH_STATUSES: Record<BatchStatus, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  SOLD_OUT: 'Sold Out',
  REMOVED: 'Removed',
} as const;
