/**
 * Age Verification API Types
 * 
 * Types for age verification operations.
 * 
 * @module types/api/age-verification
 */

import type { APIResponse } from './common';

export interface AgeVerificationAPI {
  create: (verificationData: any) => Promise<APIResponse>;
  getByTransaction: (transactionId: string) => Promise<APIResponse>;
  getByTransactionItem: (transactionItemId: string) => Promise<APIResponse>;
  getByBusiness: (
    businessId: string,
    options?: any
  ) => Promise<APIResponse>;
  getByProduct: (productId: string) => Promise<APIResponse>;
  getByStaff: (
    staffId: string,
    options?: any
  ) => Promise<APIResponse>;
}

