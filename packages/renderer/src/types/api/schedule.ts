/**
 * Schedule API Types
 * 
 * Types for schedule management operations.
 * 
 * @module types/api/schedule
 */

import type { APIResponse } from './common';

export interface ScheduleAPI {
  create: (scheduleData: {
    businessId: string;
    staffId: string;
    startTime: string;
    endTime: string;
    assignedRegister?: string;
    notes?: string;
  }) => Promise<APIResponse>;

  update: (
    scheduleId: string,
    updates: {
      staffId?: string;
      startTime?: string;
      endTime?: string;
      assignedRegister?: string;
      notes?: string;
    }
  ) => Promise<APIResponse>;

  delete: (scheduleId: string) => Promise<APIResponse>;
  getByBusiness: (businessId: string) => Promise<APIResponse>;
  getCashierUsers: (businessId: string) => Promise<APIResponse>;
}

