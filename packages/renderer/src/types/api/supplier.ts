/**
 * Supplier API Types
 * 
 * Types for supplier management operations.
 * 
 * @module types/api/supplier
 */

import type { APIResponse } from './common';

export interface SupplierAPI {
  getByBusiness: (businessId: string) => Promise<APIResponse>;
}

