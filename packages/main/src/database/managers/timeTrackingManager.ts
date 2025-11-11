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
  private db: any;
  private drizzle: DrizzleDB;
  private uuid: any;

  constructor(db: any, drizzle: DrizzleDB, uuid: any) {
    this.db = db;
    this.drizzle = drizzle;
    this.uuid = uuid;
  }

  /**
   * Get Drizzle ORM instance
   */
  private getDrizzleInstance(): DrizzleDB {
    if (!this.drizzle) {
      throw new Error("Drizzle ORM has not been initialized");
    }
    return this.drizzle;
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

    this.db
      .prepare(
        `
        INSERT INTO clock_events (id, userId, terminalId, locationId, type, timestamp, method, status, geolocation, ipAddress, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        clockEvent.id,
        clockEvent.userId,
        clockEvent.terminalId,
        clockEvent.locationId,
        clockEvent.type,
        clockEvent.timestamp,
        clockEvent.method,
        clockEvent.status,
        clockEvent.geolocation,
        clockEvent.ipAddress,
        clockEvent.notes,
        clockEvent.createdAt,
        clockEvent.updatedAt
      );

    return clockEvent;
  }

  /**
   * Get clock event by ID
   */
  getClockEventById(eventId: string): ClockEvent | undefined {
    return this.db
      .prepare("SELECT * FROM clock_events WHERE id = ?")
      .get(eventId) as ClockEvent | undefined;
  }

  /**
   * Get all clock events for a user
   */
  getClockEventsByUser(userId: string, limit: number = 50): ClockEvent[] {
    return this.db
      .prepare(
        "SELECT * FROM clock_events WHERE userId = ? ORDER BY timestamp DESC LIMIT ?"
      )
      .all(userId, limit) as ClockEvent[];
  }

  /**
   * Get active clock-in event (no corresponding clock-out in active shift)
   */
  getActiveClockIn(userId: string): ClockEvent | undefined {
    return this.db
      .prepare(
        `
        SELECT ce.* FROM clock_events ce
        LEFT JOIN time_shifts ts ON ts.clockInId = ce.id
        WHERE ce.userId = ? 
          AND ce.type = 'in' 
          AND (ts.clockOutId IS NULL OR ts.status = 'active')
        ORDER BY ce.timestamp DESC
        LIMIT 1
      `
      )
      .get(userId) as ClockEvent | undefined;
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

    const shift: TimeShift = {
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

    this.db
      .prepare(
        `
        INSERT INTO time_shifts (id, userId, businessId, clockInId, clockOutId, scheduleId, status, totalHours, regularHours, overtimeHours, breakDuration, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        shift.id,
        shift.userId,
        shift.businessId,
        shift.clockInId,
        shift.clockOutId,
        shift.scheduleId,
        shift.status,
        shift.totalHours,
        shift.regularHours,
        shift.overtimeHours,
        shift.breakDuration,
        shift.notes,
        shift.createdAt,
        shift.updatedAt
      );

    return shift;
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
      .prepare(
        `
        UPDATE time_shifts 
        SET clockOutId = ?, 
            status = 'completed',
            totalHours = ?,
            regularHours = ?,
            overtimeHours = ?,
            breakDuration = ?,
            updatedAt = ?
        WHERE id = ?
      `
      )
      .run(
        clockOutId,
        totalHours,
        regularHours,
        overtimeHours,
        breakMinutes,
        now,
        shiftId
      );

    return this.getShiftById(shiftId)!;
  }

  /**
   * Get shift by ID
   */
  getShiftById(shiftId: string): TimeShift | undefined {
    return this.db
      .prepare("SELECT * FROM time_shifts WHERE id = ?")
      .get(shiftId) as TimeShift | undefined;
  }

  /**
   * Get active shift for user
   */
  getActiveShift(userId: string): TimeShift | undefined {
    return this.db
      .prepare(
        "SELECT * FROM time_shifts WHERE userId = ? AND status = 'active' ORDER BY createdAt DESC LIMIT 1"
      )
      .get(userId) as TimeShift | undefined;
  }

  /**
   * Get all shifts for a user
   */
  getShiftsByUser(userId: string, limit: number = 50): TimeShift[] {
    return this.db
      .prepare(
        "SELECT * FROM time_shifts WHERE userId = ? ORDER BY createdAt DESC LIMIT ?"
      )
      .all(userId, limit) as TimeShift[];
  }

  /**
   * Get shifts by business within date range
   */
  getShiftsByBusinessAndDateRange(
    businessId: string,
    startDate: string,
    endDate: string
  ): TimeShift[] {
    return this.db
      .prepare(
        `
        SELECT ts.* FROM time_shifts ts
        JOIN clock_events ce ON ts.clockInId = ce.id
        WHERE ts.businessId = ? 
          AND ce.timestamp >= ? 
          AND ce.timestamp <= ?
        ORDER BY ce.timestamp DESC
      `
      )
      .all(businessId, startDate, endDate) as TimeShift[];
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

    const breakRecord: Break = {
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

    this.db
      .prepare(
        `
        INSERT INTO breaks (id, shiftId, userId, type, startTime, endTime, duration, isPaid, status, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        breakRecord.id,
        breakRecord.shiftId,
        breakRecord.userId,
        breakRecord.type,
        breakRecord.startTime,
        breakRecord.endTime,
        breakRecord.duration,
        breakRecord.isPaid ? 1 : 0,
        breakRecord.status,
        breakRecord.notes,
        breakRecord.createdAt,
        breakRecord.updatedAt
      );

    return breakRecord;
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
      .prepare(
        `
        UPDATE breaks 
        SET endTime = ?, 
            duration = ?,
            status = 'completed',
            updatedAt = ?
        WHERE id = ?
      `
      )
      .run(now, duration, now, breakId);

    return this.getBreakById(breakId)!;
  }

  /**
   * Get break by ID
   */
  getBreakById(breakId: string): Break | undefined {
    const result = this.db
      .prepare("SELECT * FROM breaks WHERE id = ?")
      .get(breakId);

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
    const result = this.db
      .prepare(
        "SELECT * FROM breaks WHERE shiftId = ? AND status = 'active' LIMIT 1"
      )
      .get(shiftId);

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
      .prepare("SELECT * FROM breaks WHERE shiftId = ? ORDER BY startTime ASC")
      .all(shiftId);

    return results.map((result: any) => ({
      ...result,
      isPaid: Boolean(result.isPaid),
    })) as Break[];
  }

  /**
   * Get all breaks for a user
   */
  getBreaksByUser(userId: string, limit: number = 50): Break[] {
    const results = this.db
      .prepare(
        "SELECT * FROM breaks WHERE userId = ? ORDER BY startTime DESC LIMIT ?"
      )
      .all(userId, limit);

    return results.map((result: any) => ({
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

    const correction: TimeCorrection = {
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

    this.db
      .prepare(
        `
        INSERT INTO time_corrections (id, userId, clockEventId, shiftId, correctionType, originalTime, correctedTime, timeDifference, reason, requestedBy, approvedBy, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        correction.id,
        correction.userId,
        correction.clockEventId,
        correction.shiftId,
        correction.correctionType,
        correction.originalTime,
        correction.correctedTime,
        correction.timeDifference,
        correction.reason,
        correction.requestedBy,
        correction.approvedBy,
        correction.status,
        correction.createdAt,
        correction.updatedAt
      );

    return correction;
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
      .prepare(
        `
        UPDATE time_corrections 
        SET status = ?, approvedBy = ?, updatedAt = ?
        WHERE id = ?
      `
      )
      .run(status, approvedBy, now, correctionId);

    // If approved, apply the correction
    if (approved && correction.clockEventId) {
      this.db
        .prepare(
          `
          UPDATE clock_events 
          SET timestamp = ?, updatedAt = ?
          WHERE id = ?
        `
        )
        .run(correction.correctedTime, now, correction.clockEventId);
    }

    return this.getTimeCorrectionById(correctionId)!;
  }

  /**
   * Get time correction by ID
   */
  getTimeCorrectionById(correctionId: string): TimeCorrection | undefined {
    return this.db
      .prepare("SELECT * FROM time_corrections WHERE id = ?")
      .get(correctionId) as TimeCorrection | undefined;
  }

  /**
   * Get pending time corrections for a business
   */
  getPendingTimeCorrections(businessId: string): TimeCorrection[] {
    return this.db
      .prepare(
        `
        SELECT tc.* FROM time_corrections tc
        JOIN users u ON tc.userId = u.id
        WHERE u.businessId = ? AND tc.status = 'pending'
        ORDER BY tc.createdAt DESC
      `
      )
      .all(businessId) as TimeCorrection[];
  }

  /**
   * Get time corrections by user
   */
  getTimeCorrectionsByUser(
    userId: string,
    limit: number = 50
  ): TimeCorrection[] {
    return this.db
      .prepare(
        "SELECT * FROM time_corrections WHERE userId = ? ORDER BY createdAt DESC LIMIT ?"
      )
      .all(userId, limit) as TimeCorrection[];
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
    const recentEvents = this.db
      .prepare(
        `
        SELECT * FROM clock_events 
        WHERE terminalId = ? 
          AND timestamp > datetime(?, '-30 seconds')
          AND userId != ?
      `
      )
      .all(clockEvent.terminalId, clockEvent.timestamp, clockEvent.userId);

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
