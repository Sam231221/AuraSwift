/**
 * Staff Feature Navigation Routes
 *
 * Centralized route definitions for the staff feature.
 * These routes are used for navigation throughout the feature.
 */

export const STAFF_ROUTES = {
  /** Manage cashiers view */
  MANAGE_CASHIERS: "staff:manage-cashiers",

  /** Staff schedules view */
  SCHEDULES: "staff:schedules",
} as const;

export type StaffRoute =
  (typeof STAFF_ROUTES)[keyof typeof STAFF_ROUTES];

