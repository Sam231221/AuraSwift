/**
 * Void API Types
 * 
 * Types for void transaction operations.
 * 
 * @module types/api/void
 */

import type { APIResponse } from './common';

export interface VoidAPI {
  validateEligibility: (transactionId: string) => Promise<APIResponse>;
  voidTransaction: (voidData: {
    transactionId: string;
    cashierId: string;
    reason: string;
    managerApprovalId?: string;
  }) => Promise<APIResponse>;
  getTransactionById: (transactionId: string) => Promise<APIResponse>;
  getTransactionByReceipt: (receiptNumber: string) => Promise<APIResponse>;
}

