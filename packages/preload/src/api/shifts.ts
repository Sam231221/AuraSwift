import { ipcRenderer } from "electron";

export const scheduleAPI = {
  create: (scheduleData: {
    staffId: string;
    businessId: string;
    startTime: string;
    endTime: string;
    assignedRegister?: string;
    notes?: string;
  }) => ipcRenderer.invoke("schedules:create", scheduleData),

  getByBusiness: (businessId: string) =>
    ipcRenderer.invoke("schedules:getByBusiness", businessId),

  getByStaff: (staffId: string) =>
    ipcRenderer.invoke("schedules:getByStaff", staffId),

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
  ) => ipcRenderer.invoke("schedules:update", id, updates),

  delete: (id: string) => ipcRenderer.invoke("schedules:delete", id),

  updateStatus: (
    id: string,
    status: "upcoming" | "active" | "completed" | "missed"
  ) => ipcRenderer.invoke("schedules:updateStatus", id, status),

  getCashierUsers: (businessId: string) =>
    ipcRenderer.invoke("schedules:getCashierUsers", businessId),

  validateClockIn: (userId: string, businessId: string) =>
    ipcRenderer.invoke("schedules:validateClockIn", userId, businessId),
};

export const shiftAPI = {
  start: (shiftData: {
    scheduleId?: string;
    cashierId: string;
    businessId: string;
    startingCash: number;
    notes?: string;
  }) => ipcRenderer.invoke("shift:start", shiftData),

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
  ) => ipcRenderer.invoke("shift:end", shiftId, endData),

  getActive: (cashierId: string) =>
    ipcRenderer.invoke("shift:getActive", cashierId),

  getTodaySchedule: (cashierId: string) =>
    ipcRenderer.invoke("shift:getTodaySchedule", cashierId),

  getStats: (shiftId: string) => ipcRenderer.invoke("shift:getStats", shiftId),

  getHourlyStats: (shiftId: string) =>
    ipcRenderer.invoke("shift:getHourlyStats", shiftId),

  getCashDrawerBalance: (shiftId: string) =>
    ipcRenderer.invoke("shift:getCashDrawerBalance", shiftId),

  reconcile: (
    shiftId: string,
    reconciliationData: {
      actualCashDrawer: number;
      managerNotes: string;
      managerId: string;
    }
  ) => ipcRenderer.invoke("shift:reconcile", shiftId, reconciliationData),

  getPendingReconciliation: (businessId: string) =>
    ipcRenderer.invoke("shift:getPendingReconciliation", businessId),
};
