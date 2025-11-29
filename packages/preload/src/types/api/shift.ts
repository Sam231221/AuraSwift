/**
 * Shift API Types - Preload
 * 
 * Type definitions for shift and schedule management IPC APIs.
 * 
 * @module preload/types/api/shift
 */

export interface ScheduleAPIPreload {
  create: (scheduleData: {
    staffId: string;
    businessId: string;
    startTime: string;
    endTime: string;
    assignedRegister?: string;
    notes?: string;
  }) => Promise<any>;

  getByBusiness: (businessId: string) => Promise<any>;

  getByStaff: (staffId: string) => Promise<any>;

  update: (
    id: string,
    updates: {
      staffId?: string;
      startTime?: string;
      endTime?: string;
      assignedRegister?: string;
      notes?: string;
      status?: "upcoming" | "active" | "completed" | "missed";
    }
  ) => Promise<any>;

  delete: (id: string) => Promise<any>;

  updateStatus: (
    id: string,
    status: "upcoming" | "active" | "completed" | "missed"
  ) => Promise<any>;

  getCashierUsers: (businessId: string) => Promise<any>;
}

export interface ShiftAPIPreload {
  start: (shiftData: {
    scheduleId?: string;
    cashierId: string;
    businessId: string;
    startingCash: number;
    notes?: string;
  }) => Promise<any>;

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
  ) => Promise<any>;

  getActive: (cashierId: string) => Promise<any>;

  getTodaySchedule: (cashierId: string) => Promise<any>;

  getStats: (shiftId: string) => Promise<any>;

  getHourlyStats: (shiftId: string) => Promise<any>;

  getCashDrawerBalance: (shiftId: string) => Promise<any>;

  reconcile: (
    shiftId: string,
    reconciliationData: {
      actualCashDrawer: number;
      managerNotes: string;
      managerId: string;
    }
  ) => Promise<any>;

  getPendingReconciliation: (businessId: string) => Promise<any>;
}

