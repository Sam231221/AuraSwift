/**
 * Cash Drawer API Types
 * 
 * Types for cash drawer management operations.
 * 
 * @module types/api/cash-drawer
 */

import type { APIResponse } from './common';

export interface CashDrawerAPI {
  getExpectedCash: (shiftId: string) => Promise<APIResponse>;
  createCount: (countData: any) => Promise<APIResponse>;
  getCountsByShift: (shiftId: string) => Promise<APIResponse>;
}

