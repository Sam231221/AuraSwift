/**
 * Time Tracking API Types
 * 
 * Types for time tracking and clock in/out operations.
 * 
 * @module types/api/time-tracking
 */

import type { APIResponse } from './common';

export interface TimeTrackingAPI {
  clockIn: (data: {
    userId: string;
    terminalId: string;
    locationId?: string;
    businessId: string;
    ipAddress?: string;
  }) => Promise<APIResponse & { clockEvent?: any; shift?: any }>;

  clockOut: (data: {
    userId: string;
    terminalId: string;
    ipAddress?: string;
  }) => Promise<APIResponse & { clockEvent?: any; shift?: any }>;

  getActiveShift: (userId: string) => Promise<
    APIResponse & { shift?: any; breaks?: any[] }
  >;

  startBreak: (data: {
    shiftId: string;
    userId: string;
    type?: 'meal' | 'rest' | 'other';
    isPaid?: boolean;
  }) => Promise<APIResponse & { break?: any }>;

  endBreak: (breakId: string) => Promise<
    APIResponse & { break?: any }
  >;
}

