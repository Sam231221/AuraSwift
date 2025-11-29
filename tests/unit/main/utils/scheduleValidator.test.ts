/**
 * Unit tests for ScheduleValidator
 * Tests schedule validation logic including time windows and grace periods
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScheduleValidator } from "../../../../packages/main/src/utils/scheduleValidator";
import type { DatabaseManagers } from "../../../../packages/main/src/database/index";
import type { Schedule } from "../../../../packages/main/src/database/schema";

describe("ScheduleValidator", () => {
  let validator: ScheduleValidator;
  let mockDB: Partial<DatabaseManagers>;

  beforeEach(() => {
    validator = new ScheduleValidator();
    mockDB = {
      schedules: {
        getSchedulesByStaffId: vi.fn(),
      },
      shifts: {
        getActiveShift: vi.fn(),
      },
    } as any;
  });

  describe("validateClockIn", () => {
    it("should return valid when schedule exists and time is within window", async () => {
      const now = new Date();
      const scheduleStart = new Date(now);
      scheduleStart.setHours(9, 0, 0, 0); // 9:00 AM
      const scheduleEnd = new Date(now);
      scheduleEnd.setHours(17, 0, 0, 0); // 5:00 PM

      const schedule: Schedule = {
        id: "schedule-1",
        staffId: "user-1",
        businessId: "business-1",
        startTime: scheduleStart.toISOString(),
        endTime: scheduleEnd.toISOString(),
        status: "upcoming",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Schedule;

      // Set current time to 10:00 AM (within schedule)
      vi.useFakeTimers();
      vi.setSystemTime(new Date(now.setHours(10, 0, 0, 0)));

      (mockDB.schedules!.getSchedulesByStaffId as any).mockReturnValue([
        schedule,
      ]);
      (mockDB.shifts!.getActiveShift as any).mockReturnValue(null);

      const result = await validator.validateClockIn(
        "user-1",
        "business-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(true);
      expect(result.canClockIn).toBe(true);
      expect(result.requiresApproval).toBe(false);
      expect(result.warnings).toHaveLength(0);
      expect(result.schedule).toBeDefined();

      vi.useRealTimers();
    });

    it("should return invalid when no schedule exists", async () => {
      (mockDB.schedules!.getSchedulesByStaffId as any).mockReturnValue([]);
      (mockDB.shifts!.getActiveShift as any).mockReturnValue(null);

      const result = await validator.validateClockIn(
        "user-1",
        "business-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(false);
      expect(result.canClockIn).toBe(false);
      expect(result.requiresApproval).toBe(false);
      expect(result.warnings).toContain("No schedule found for today");
      expect(result.reason).toContain("No schedule exists");
    });

    it("should return invalid when user already has active shift", async () => {
      const schedule: Schedule = {
        id: "schedule-1",
        staffId: "user-1",
        businessId: "business-1",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: "upcoming",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Schedule;

      (mockDB.schedules!.getSchedulesByStaffId as any).mockReturnValue([
        schedule,
      ]);
      (mockDB.shifts!.getActiveShift as any).mockReturnValue({
        id: "shift-1",
        userId: "user-1",
        status: "active",
      });

      const result = await validator.validateClockIn(
        "user-1",
        "business-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(false);
      expect(result.canClockIn).toBe(false);
      expect(result.warnings).toContain("Already clocked in");
    });

    it("should return requiresApproval when clock-in is before schedule (outside grace period)", async () => {
      const now = new Date();
      const scheduleStart = new Date(now);
      scheduleStart.setHours(9, 0, 0, 0); // 9:00 AM
      const scheduleEnd = new Date(now);
      scheduleEnd.setHours(17, 0, 0, 0); // 5:00 PM

      const schedule: Schedule = {
        id: "schedule-1",
        staffId: "user-1",
        businessId: "business-1",
        startTime: scheduleStart.toISOString(),
        endTime: scheduleEnd.toISOString(),
        status: "upcoming",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Schedule;

      // Set current time to 8:30 AM (30 minutes before, outside 15min grace period)
      vi.useFakeTimers();
      vi.setSystemTime(new Date(now.setHours(8, 30, 0, 0)));

      (mockDB.schedules!.getSchedulesByStaffId as any).mockReturnValue([
        schedule,
      ]);
      (mockDB.shifts!.getActiveShift as any).mockReturnValue(null);

      const result = await validator.validateClockIn(
        "user-1",
        "business-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(false);
      expect(result.canClockIn).toBe(false);
      expect(result.requiresApproval).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("before scheduled time");

      vi.useRealTimers();
    });

    it("should return valid when clock-in is within grace period before schedule", async () => {
      const now = new Date();
      const scheduleStart = new Date(now);
      scheduleStart.setHours(9, 0, 0, 0); // 9:00 AM
      const scheduleEnd = new Date(now);
      scheduleEnd.setHours(17, 0, 0, 0); // 5:00 PM

      const schedule: Schedule = {
        id: "schedule-1",
        staffId: "user-1",
        businessId: "business-1",
        startTime: scheduleStart.toISOString(),
        endTime: scheduleEnd.toISOString(),
        status: "upcoming",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Schedule;

      // Set current time to 8:50 AM (10 minutes before, within 15min grace period)
      vi.useFakeTimers();
      vi.setSystemTime(new Date(now.setHours(8, 50, 0, 0)));

      (mockDB.schedules!.getSchedulesByStaffId as any).mockReturnValue([
        schedule,
      ]);
      (mockDB.shifts!.getActiveShift as any).mockReturnValue(null);

      const result = await validator.validateClockIn(
        "user-1",
        "business-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(true);
      expect(result.canClockIn).toBe(true);
      expect(result.requiresApproval).toBe(false);

      vi.useRealTimers();
    });

    it("should return requiresApproval when clock-in is after schedule (outside grace period)", async () => {
      const now = new Date();
      const scheduleStart = new Date(now);
      scheduleStart.setHours(9, 0, 0, 0); // 9:00 AM
      const scheduleEnd = new Date(now);
      scheduleEnd.setHours(17, 0, 0, 0); // 5:00 PM

      const schedule: Schedule = {
        id: "schedule-1",
        staffId: "user-1",
        businessId: "business-1",
        startTime: scheduleStart.toISOString(),
        endTime: scheduleEnd.toISOString(),
        status: "upcoming",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Schedule;

      // Set current time to 5:30 PM (30 minutes after, outside 15min grace period)
      vi.useFakeTimers();
      vi.setSystemTime(new Date(now.setHours(17, 30, 0, 0)));

      (mockDB.schedules!.getSchedulesByStaffId as any).mockReturnValue([
        schedule,
      ]);
      (mockDB.shifts!.getActiveShift as any).mockReturnValue(null);

      const result = await validator.validateClockIn(
        "user-1",
        "business-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(false);
      expect(result.canClockIn).toBe(false);
      expect(result.requiresApproval).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("after scheduled time");

      vi.useRealTimers();
    });

    it("should handle errors gracefully", async () => {
      (mockDB.schedules!.getSchedulesByStaffId as any).mockImplementation(
        () => {
          throw new Error("Database error");
        }
      );

      const result = await validator.validateClockIn(
        "user-1",
        "business-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(false);
      expect(result.canClockIn).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("Error");
    });

    it("should select most recent schedule when multiple schedules exist", async () => {
      const now = new Date();
      const schedule1: Schedule = {
        id: "schedule-1",
        staffId: "user-1",
        businessId: "business-1",
        startTime: new Date(now.setHours(9, 0, 0, 0)).toISOString(),
        endTime: new Date(now.setHours(12, 0, 0, 0)).toISOString(),
        status: "upcoming",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Schedule;

      const schedule2: Schedule = {
        id: "schedule-2",
        staffId: "user-1",
        businessId: "business-1",
        startTime: new Date(now.setHours(13, 0, 0, 0)).toISOString(),
        endTime: new Date(now.setHours(17, 0, 0, 0)).toISOString(),
        status: "upcoming",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Schedule;

      // Set current time to 2:00 PM (within second schedule)
      vi.useFakeTimers();
      vi.setSystemTime(new Date(now.setHours(14, 0, 0, 0)));

      (mockDB.schedules!.getSchedulesByStaffId as any).mockReturnValue([
        schedule1,
        schedule2,
      ]);
      (mockDB.shifts!.getActiveShift as any).mockReturnValue(null);

      const result = await validator.validateClockIn(
        "user-1",
        "business-1",
        mockDB as DatabaseManagers
      );

      expect(result.valid).toBe(true);
      expect(result.schedule?.id).toBe("schedule-2"); // Should select the later schedule

      vi.useRealTimers();
    });
  });
});
