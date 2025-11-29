/**
 * Shift API Types
 * 
 * Types for shift management operations.
 * 
 * @module types/api/shift
 */

import type { APIResponse } from './common';

export interface ShiftAPI {
  start: (shiftData: {
    scheduleId?: string;
    cashierId: string;
    businessId: string;
    startingCash: number;
    deviceId?: string;
    notes?: string;
  }) => Promise<APIResponse>;

  end: (
    shiftId: string,
    endData: {
      finalCashDrawer: number;
      expectedCashDrawer: number;
      totalSales: number;
      totalTransactions: number;
      totalRefunds: number;
      totalVoids: number;
      notes?: string;
    }
  ) => Promise<APIResponse>;

  getActive: (cashierId: string) => Promise<APIResponse>;
  getTodaySchedule: (cashierId: string) => Promise<APIResponse>;
  getStats: (shiftId: string) => Promise<APIResponse>;
  getHourlyStats: (shiftId: string) => Promise<APIResponse>;
  getCashDrawerBalance: (shiftId: string) => Promise<APIResponse>;

  reconcile: (
    shiftId: string,
    reconciliationData: {
      actualCashDrawer: number;
      managerNotes: string;
      managerId: string;
    }
  ) => Promise<APIResponse>;

  getPendingReconciliation: (businessId: string) => Promise<APIResponse>;
}
