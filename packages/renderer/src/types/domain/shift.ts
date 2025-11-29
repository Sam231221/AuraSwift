/**
 * Shift and Schedule Domain Types
 * 
 * @module types/domain/shift
 */

export type ShiftStatus = 'active' | 'ended';
export type ScheduleStatus = 'upcoming' | 'active' | 'completed' | 'missed';

/**
 * Shift - Actual work session with clock-in/out times
 */
export interface Shift {
  id: string;
  scheduleId?: string; // Links to the planned schedule
  cashierId: string;
  businessId: string;
  startTime: string; // ACTUAL clock-in time (when cashier really started)
  endTime?: string; // ACTUAL clock-out time (when cashier really ended)
  status: ShiftStatus;
  startingCash: number;
  finalCashDrawer?: number;
  expectedCashDrawer?: number;
  cashVariance?: number;
  totalSales?: number;
  totalTransactions?: number;
  totalRefunds?: number;
  totalVoids?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Schedule - Planned shift times set by manager
 */
export interface Schedule {
  id: string;
  staffId: string;
  businessId: string;
  startTime: string; // PLANNED start time (what manager scheduled)
  endTime: string; // PLANNED end time (what manager scheduled - can be updated live)
  status: ScheduleStatus;
  assignedRegister?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string; // Changes when manager modifies scheduled times
}
