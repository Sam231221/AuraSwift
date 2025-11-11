import type {
  ClockEvent,
  TimeShift,
  Break,
  TimeCorrection,
  ShiftValidation,
} from "../../../../../types/database.d.js";
import type { DrizzleDB } from "../drizzle.js";
import {
  eq,
  and,
  desc,
  gte,
  lte,
  isNull,
  sql as drizzleSql,
} from "drizzle-orm";
import * as schema from "../schema.js";

export class TimeTrackingManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  // ============= Clock Events =============

  /**
   * Create a clock-in or clock-out event
   */
  async createClockEvent(data: {
    userId: string;
    terminalId: string;
    locationId?: string;
    type: "in" | "out";
    method?: "login" | "manual" | "auto" | "manager";
    geolocation?: string;
    ipAddress?: string;
    notes?: string;
  }): Promise<ClockEvent> {
    const eventId = this.uuid.v4();
    const now = new Date().toISOString();

    const clockEvent: ClockEvent = {
      id: eventId,
      userId: data.userId,
      terminalId: data.terminalId,
      locationId: data.locationId,
      type: data.type,
      timestamp: now,
      method: data.method || "manual",
      status: "confirmed",
      geolocation: data.geolocation,
      ipAddress: data.ipAddress,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.db.insert(schema.clockEvents).values(clockEvent).run();

    return clockEvent;
  }

  /**
   * Get clock event by ID
   */
  getClockEventById(eventId: string): ClockEvent | undefined {
    const [event] = this.db
      .select()
      .from(schema.clockEvents)
      .where(eq(schema.clockEvents.id, eventId))
      .limit(1)
      .all();

    return event as ClockEvent | undefined;
  }

  /**
   * Get all clock events for a user
   */
  getClockEventsByUser(userId: string, limit: number = 50): ClockEvent[] {
    return this.db
      .select()
      .from(schema.clockEvents)
      .where(eq(schema.clockEvents.userId, userId))
      .orderBy(desc(schema.clockEvents.timestamp))
      .limit(limit)
      .all() as ClockEvent[];
  }

  /**
   * Get active clock-in event (no corresponding clock-out in active shift)
   */
  getActiveClockIn(userId: string): ClockEvent | undefined {
    const results = this.db
      .select({
        clockEvent: schema.clockEvents,
      })
      .from(schema.clockEvents)
      .leftJoin(
        schema.timeShifts,
        eq(schema.timeShifts.clockInId, schema.clockEvents.id)
      )
      .where(
        and(
          eq(schema.clockEvents.userId, userId),
          eq(schema.clockEvents.type, "in"),
          drizzleSql`(${schema.timeShifts.clockOutId} IS NULL OR ${schema.timeShifts.status} = 'active')`
        )
      )
      .orderBy(desc(schema.clockEvents.timestamp))
      .limit(1)
      .all();

    return results[0]?.clockEvent as ClockEvent | undefined;
  }

  // ============= Time Shifts =============

  /**
   * Create a new shift
   */
  async createShift(data: {
    userId: string;
    businessId: string;
    clockInId: string;
    scheduleId?: string;
    notes?: string;
  }): Promise<TimeShift> {
    const shiftId = this.uuid.v4();
    const now = new Date().toISOString();

    this.db
      .insert(schema.timeShifts)
      .values({
        id: shiftId,
        userId: data.userId,
        businessId: data.businessId,
        clockInId: data.clockInId,
        clockOutId: null,
        scheduleId: data.scheduleId || null,
        status: "active",
        totalHours: null,
        regularHours: null,
        overtimeHours: null,
        breakDuration: null,
        notes: data.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return {
      id: shiftId,
      userId: data.userId,
      businessId: data.businessId,
      clockInId: data.clockInId,
      clockOutId: undefined,
      scheduleId: data.scheduleId,
      status: "active",
      totalHours: undefined,
      regularHours: undefined,
      overtimeHours: undefined,
      breakDuration: undefined,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Complete a shift by adding clock-out event
   */
  async completeShift(shiftId: string, clockOutId: string): Promise<TimeShift> {
    const shift = this.getShiftById(shiftId);
    if (!shift) {
      throw new Error("Shift not found");
    }

    const clockIn = this.getClockEventById(shift.clockInId);
    const clockOut = this.getClockEventById(clockOutId);

    if (!clockIn || !clockOut) {
      throw new Error("Clock events not found");
    }

    // Calculate total hours
    const startTime = new Date(clockIn.timestamp).getTime();
    const endTime = new Date(clockOut.timestamp).getTime();
    const totalMinutes = (endTime - startTime) / (1000 * 60);

    // Get total break duration
    const breaks = this.getBreaksByShift(shiftId);
    const breakMinutes = breaks.reduce((sum, b) => sum + (b.duration || 0), 0);

    // Calculate working hours (excluding breaks)
    const workingMinutes = totalMinutes - breakMinutes;
    const totalHours = workingMinutes / 60;

    // Calculate regular and overtime hours (assuming 8 hour standard)
    const regularHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(0, totalHours - 8);

    const now = new Date().toISOString();

    this.db
      .update(schema.timeShifts)
      .set({
        clockOutId,
        status: "completed",
        totalHours,
        regularHours,
        overtimeHours,
        breakDuration: breakMinutes,
        updatedAt: now,
      })
      .where(eq(schema.timeShifts.id, shiftId))
      .run();

    return this.getShiftById(shiftId)!;
  }

  /**
   * Get shift by ID
   */
  getShiftById(shiftId: string): TimeShift | undefined {
    const [shift] = this.db
      .select()
      .from(schema.timeShifts)
      .where(eq(schema.timeShifts.id, shiftId))
      .limit(1)
      .all();

    return shift as TimeShift | undefined;
  }

  /**
   * Get active shift for user
   */
  getActiveShift(userId: string): TimeShift | undefined {
    const [shift] = this.db
      .select()
      .from(schema.timeShifts)
      .where(
        and(
          eq(schema.timeShifts.userId, userId),
          eq(schema.timeShifts.status, "active")
        )
      )
      .orderBy(desc(schema.timeShifts.createdAt))
      .limit(1)
      .all();

    return shift as TimeShift | undefined;
  }

  /**
   * Get all shifts for a user
   */
  getShiftsByUser(userId: string, limit: number = 50): TimeShift[] {
    return this.db
      .select()
      .from(schema.timeShifts)
      .where(eq(schema.timeShifts.userId, userId))
      .orderBy(desc(schema.timeShifts.createdAt))
      .limit(limit)
      .all() as TimeShift[];
  }

  /**
   * Get shifts by business within date range
   */
  getShiftsByBusinessAndDateRange(
    businessId: string,
    startDate: string,
    endDate: string
  ): TimeShift[] {
    const results = this.db
      .select({
        shift: schema.timeShifts,
      })
      .from(schema.timeShifts)
      .innerJoin(
        schema.clockEvents,
        eq(schema.timeShifts.clockInId, schema.clockEvents.id)
      )
      .where(
        and(
          eq(schema.timeShifts.businessId, businessId),
          gte(schema.clockEvents.timestamp, startDate),
          lte(schema.clockEvents.timestamp, endDate)
        )
      )
      .orderBy(desc(schema.clockEvents.timestamp))
      .all();

    return results.map((r) => r.shift) as TimeShift[];
  }

  // ============= Breaks =============

  /**
   * Start a break
   */
  async startBreak(data: {
    shiftId: string;
    userId: string;
    type?: "meal" | "rest" | "other";
    isPaid?: boolean;
    notes?: string;
  }): Promise<Break> {
    const breakId = this.uuid.v4();
    const now = new Date().toISOString();

    // Check if there's already an active break
    const activeBreak = this.getActiveBreak(data.shiftId);
    if (activeBreak) {
      throw new Error("There is already an active break for this shift");
    }

    this.db
      .insert(schema.breaks)
      .values({
        id: breakId,
        shiftId: data.shiftId,
        userId: data.userId,
        type: data.type || "rest",
        startTime: now,
        endTime: null,
        duration: null,
        isPaid: data.isPaid || false,
        status: "active",
        notes: data.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return {
      id: breakId,
      shiftId: data.shiftId,
      userId: data.userId,
      type: data.type || "rest",
      startTime: now,
      endTime: undefined,
      duration: undefined,
      isPaid: data.isPaid || false,
      status: "active",
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * End a break
   */
  async endBreak(breakId: string): Promise<Break> {
    const breakRecord = this.getBreakById(breakId);
    if (!breakRecord) {
      throw new Error("Break not found");
    }

    if (breakRecord.status !== "active") {
      throw new Error("Break is not active");
    }

    const now = new Date().toISOString();
    const startTime = new Date(breakRecord.startTime).getTime();
    const endTime = new Date(now).getTime();
    const duration = Math.floor((endTime - startTime) / (1000 * 60)); // Duration in minutes

    this.db
      .update(schema.breaks)
      .set({
        endTime: now,
        duration,
        status: "completed",
        updatedAt: now,
      })
      .where(eq(schema.breaks.id, breakId))
      .run();

    return this.getBreakById(breakId)!;
  }

  /**
   * Get break by ID
   */
  getBreakById(breakId: string): Break | undefined {
    const [result] = this.db
      .select()
      .from(schema.breaks)
      .where(eq(schema.breaks.id, breakId))
      .limit(1)
      .all();

    if (!result) return undefined;

    return {
      ...result,
      isPaid: Boolean(result.isPaid),
    } as Break;
  }

  /**
   * Get active break for a shift
   */
  getActiveBreak(shiftId: string): Break | undefined {
    const [result] = this.db
      .select()
      .from(schema.breaks)
      .where(
        and(
          eq(schema.breaks.shiftId, shiftId),
          eq(schema.breaks.status, "active")
        )
      )
      .limit(1)
      .all();

    if (!result) return undefined;

    return {
      ...result,
      isPaid: Boolean(result.isPaid),
    } as Break;
  }

  /**
   * Get all breaks for a shift
   */
  getBreaksByShift(shiftId: string): Break[] {
    const results = this.db
      .select()
      .from(schema.breaks)
      .where(eq(schema.breaks.shiftId, shiftId))
      .orderBy(schema.breaks.startTime)
      .all();

    return results.map((result) => ({
      ...result,
      isPaid: Boolean(result.isPaid),
    })) as Break[];
  }

  /**
   * Get all breaks for a user
   */
  getBreaksByUser(userId: string, limit: number = 50): Break[] {
    const results = this.db
      .select()
      .from(schema.breaks)
      .where(eq(schema.breaks.userId, userId))
      .orderBy(desc(schema.breaks.startTime))
      .limit(limit)
      .all();

    return results.map((result) => ({
      ...result,
      isPaid: Boolean(result.isPaid),
    })) as Break[];
  }

  // ============= Time Corrections =============

  /**
   * Request a time correction
   */
  async requestTimeCorrection(data: {
    userId: string;
    clockEventId?: string;
    shiftId?: string;
    correctionType: "clock_time" | "break_time" | "manual_entry";
    originalTime?: string;
    correctedTime: string;
    reason: string;
    requestedBy: string;
  }): Promise<TimeCorrection> {
    const correctionId = this.uuid.v4();
    const now = new Date().toISOString();

    // Calculate time difference in minutes
    let timeDifference = 0;
    if (data.originalTime) {
      const original = new Date(data.originalTime).getTime();
      const corrected = new Date(data.correctedTime).getTime();
      timeDifference = Math.floor((corrected - original) / (1000 * 60));
    }

    this.db
      .insert(schema.timeCorrections)
      .values({
        id: correctionId,
        userId: data.userId,
        clockEventId: data.clockEventId || null,
        shiftId: data.shiftId || null,
        correctionType: data.correctionType,
        originalTime: data.originalTime || null,
        correctedTime: data.correctedTime,
        timeDifference,
        reason: data.reason,
        requestedBy: data.requestedBy,
        approvedBy: null,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return {
      id: correctionId,
      userId: data.userId,
      clockEventId: data.clockEventId,
      shiftId: data.shiftId,
      correctionType: data.correctionType,
      originalTime: data.originalTime,
      correctedTime: data.correctedTime,
      timeDifference,
      reason: data.reason,
      requestedBy: data.requestedBy,
      approvedBy: undefined,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Approve or reject a time correction
   */
  async processTimeCorrection(
    correctionId: string,
    approvedBy: string,
    approved: boolean
  ): Promise<TimeCorrection> {
    const correction = this.getTimeCorrectionById(correctionId);
    if (!correction) {
      throw new Error("Time correction not found");
    }

    if (correction.status !== "pending") {
      throw new Error("Time correction has already been processed");
    }

    const now = new Date().toISOString();
    const status = approved ? "approved" : "rejected";

    this.db
      .update(schema.timeCorrections)
      .set({
        status,
        approvedBy,
        updatedAt: now,
      })
      .where(eq(schema.timeCorrections.id, correctionId))
      .run();

    // If approved, apply the correction
    if (approved && correction.clockEventId) {
      this.db
        .update(schema.clockEvents)
        .set({
          timestamp: correction.correctedTime,
          updatedAt: now,
        })
        .where(eq(schema.clockEvents.id, correction.clockEventId))
        .run();
    }

    return this.getTimeCorrectionById(correctionId)!;
  }

  /**
   * Get time correction by ID
   */
  getTimeCorrectionById(correctionId: string): TimeCorrection | undefined {
    const [correction] = this.db
      .select()
      .from(schema.timeCorrections)
      .where(eq(schema.timeCorrections.id, correctionId))
      .limit(1)
      .all();

    return correction as TimeCorrection | undefined;
  }

  /**
   * Get pending time corrections for a business
   */
  getPendingTimeCorrections(businessId: string): TimeCorrection[] {
    const results = this.db
      .select({
        correction: schema.timeCorrections,
      })
      .from(schema.timeCorrections)
      .innerJoin(
        schema.users,
        eq(schema.timeCorrections.userId, schema.users.id)
      )
      .where(
        and(
          eq(schema.users.businessId, businessId),
          eq(schema.timeCorrections.status, "pending")
        )
      )
      .orderBy(desc(schema.timeCorrections.createdAt))
      .all();

    return results.map((r) => r.correction) as TimeCorrection[];
  }

  /**
   * Get time corrections by user
   */
  getTimeCorrectionsByUser(
    userId: string,
    limit: number = 50
  ): TimeCorrection[] {
    return this.db
      .select()
      .from(schema.timeCorrections)
      .where(eq(schema.timeCorrections.userId, userId))
      .orderBy(desc(schema.timeCorrections.createdAt))
      .limit(limit)
      .all() as TimeCorrection[];
  }

  // ============= Fraud Detection & Validation =============

  /**
   * Validate a clock event for potential fraud
   */
  async validateClockEvent(clockEvent: ClockEvent): Promise<ShiftValidation> {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Check for multiple clock-ins without clock-out
    const activeShift = this.getActiveShift(clockEvent.userId);
    if (clockEvent.type === "in" && activeShift) {
      violations.push("User already has an active shift without clock-out");
    }

    // Check for clock-out without clock-in
    if (clockEvent.type === "out" && !activeShift) {
      violations.push("No active shift found for clock-out");
    }

    // Check for rapid clock events (potential buddy punching)
    const thirtySecondsAgo = new Date(
      new Date(clockEvent.timestamp).getTime() - 30000
    ).toISOString();

    const recentEvents = this.db
      .select()
      .from(schema.clockEvents)
      .where(
        and(
          eq(schema.clockEvents.terminalId, clockEvent.terminalId),
          gte(schema.clockEvents.timestamp, thirtySecondsAgo),
          drizzleSql`${schema.clockEvents.userId} != ${clockEvent.userId}`
        )
      )
      .all();

    if (recentEvents.length > 0) {
      warnings.push(
        "Multiple users clocking in/out from same terminal within 30 seconds"
      );
    }

    // Check for unusual hours (e.g., late night clock-ins)
    const clockHour = new Date(clockEvent.timestamp).getHours();
    if (clockHour < 5 || clockHour > 23) {
      warnings.push(`Clock event at unusual hour: ${clockHour}:00`);
    }

    return {
      valid: violations.length === 0,
      violations,
      warnings,
      requiresReview: violations.length > 0 || warnings.length > 0,
    };
  }

  /**
   * Check for grace period and tardiness
   */
  calculateTardiness(
    scheduledTime: string,
    actualTime: string
  ): {
    status: "on_time" | "grace_period" | "late";
    minutes: number;
  } {
    const scheduled = new Date(scheduledTime).getTime();
    const actual = new Date(actualTime).getTime();
    const differenceMs = actual - scheduled;
    const minutes = Math.floor(differenceMs / (1000 * 60));

    const gracePeriodMinutes = 7;

    if (minutes <= 0) {
      return { status: "on_time", minutes: 0 };
    } else if (minutes <= gracePeriodMinutes) {
      return { status: "grace_period", minutes };
    } else {
      return { status: "late", minutes };
    }
  }

  /**
   * Force clock-out by manager
   */
  async forceClockOut(
    userId: string,
    managerId: string,
    reason: string
  ): Promise<{ clockEvent: ClockEvent; shift: TimeShift }> {
    const activeShift = this.getActiveShift(userId);
    if (!activeShift) {
      throw new Error("No active shift found for user");
    }

    // Create clock-out event with manager method
    const clockOutEvent = await this.createClockEvent({
      userId,
      terminalId: "manager_override",
      type: "out",
      method: "manager",
      notes: `Forced clock-out by manager. Reason: ${reason}`,
    });

    // Complete the shift
    const completedShift = await this.completeShift(
      activeShift.id,
      clockOutEvent.id
    );

    return {
      clockEvent: clockOutEvent,
      shift: completedShift,
    };
  }
}
