import type { AttendanceReport } from "../../../../../types/database.d.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, gte, lte, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class TimeTrackingReportManager {
  private db: DrizzleDB;

  constructor(drizzle: DrizzleDB) {
    this.db = drizzle;
  }

  /**
   * Generate comprehensive attendance report for a user
   */
  generateUserAttendanceReport(
    userId: string,
    startDate: string,
    endDate: string
  ): AttendanceReport {
    // Get user info
    const [user] = this.db
      .select({
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)
      .all();

    // Get all shifts in date range
    const shifts = this.db
      .select({
        shift: schema.timeShifts,
        clockInTime: schema.clockEvents.timestamp,
        clockOutTime: drizzleSql<string>`ce_out.timestamp`,
      })
      .from(schema.timeShifts)
      .innerJoin(
        schema.clockEvents,
        eq(schema.timeShifts.clockInId, schema.clockEvents.id)
      )
      .leftJoin(
        drizzleSql`clock_events ce_out`,
        drizzleSql`${schema.timeShifts.clockOutId} = ce_out.id`
      )
      .where(
        and(
          eq(schema.timeShifts.userId, userId),
          gte(schema.clockEvents.timestamp, startDate),
          lte(schema.clockEvents.timestamp, endDate)
        )
      )
      .orderBy(desc(schema.clockEvents.timestamp))
      .all();

    // Calculate statistics
    const totalShifts = shifts.length;
    const completedShifts = shifts.filter(
      (s: any) => s.shift.status === "completed"
    );

    const totalHours = completedShifts.reduce(
      (sum: number, s: any) => sum + (s.shift.totalHours || 0),
      0
    );
    const regularHours = completedShifts.reduce(
      (sum: number, s: any) => sum + (s.shift.regularHours || 0),
      0
    );
    const overtimeHours = completedShifts.reduce(
      (sum: number, s: any) => sum + (s.shift.overtimeHours || 0),
      0
    );

    // Count late clock-ins (assuming grace period of 7 minutes)
    let lateClockIns = 0;
    let tardinessMinutes = 0;

    shifts.forEach((shiftData: any) => {
      const shift = shiftData.shift;
      if (shift.scheduleId) {
        const [schedule] = this.db
          .select({
            startTime: schema.schedules.startTime,
          })
          .from(schema.schedules)
          .where(eq(schema.schedules.id, shift.scheduleId))
          .limit(1)
          .all();

        if (schedule) {
          const scheduledTime = new Date(schedule.startTime).getTime();
          const actualTime = new Date(shiftData.clockInTime).getTime();
          const diff = (actualTime - scheduledTime) / (1000 * 60); // minutes

          if (diff > 7) {
            // Grace period
            lateClockIns++;
            tardinessMinutes += diff;
          }
        }
      }
    });

    // Count missed clock-outs
    const missedClockOuts = shifts.filter(
      (s: any) => s.shift.status === "active" || !s.shift.clockOutId
    ).length;

    return {
      userId,
      userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
      period: {
        startDate,
        endDate,
      },
      totalShifts,
      totalHours,
      regularHours,
      overtimeHours,
      lateClockIns,
      missedClockOuts,
      averageHoursPerShift: totalShifts > 0 ? totalHours / totalShifts : 0,
      tardinessMinutes,
    };
  }

  /**
   * Generate attendance report for entire business
   */
  generateBusinessAttendanceReport(
    businessId: string,
    startDate: string,
    endDate: string
  ): AttendanceReport[] {
    // Get all users in business
    const users = this.db
      .select({
        id: schema.users.id,
      })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.businessId, businessId),
          eq(schema.users.isActive, true)
        )
      )
      .all();

    return users.map((user: any) =>
      this.generateUserAttendanceReport(user.id, startDate, endDate)
    );
  }

  /**
   * Get late clock-ins for a date range
   */
  getLateClockIns(
    businessId: string,
    startDate: string,
    endDate: string
  ): any[] {
    return this.db
      .prepare(
        `
        SELECT 
          u.id as userId,
          u.firstName,
          u.lastName,
          ce.timestamp as actualTime,
          s.startTime as scheduledTime,
          CAST((julianday(ce.timestamp) - julianday(s.startTime)) * 24 * 60 AS INTEGER) as minutesLate,
          ts.id as shiftId
        FROM time_shifts ts
        JOIN users u ON ts.userId = u.id
        JOIN clock_events ce ON ts.clockInId = ce.id
        LEFT JOIN schedules s ON ts.scheduleId = s.id
        WHERE u.businessId = ?
          AND ce.timestamp >= ?
          AND ce.timestamp <= ?
          AND s.startTime IS NOT NULL
          AND CAST((julianday(ce.timestamp) - julianday(s.startTime)) * 24 * 60 AS INTEGER) > 7
        ORDER BY ce.timestamp DESC
      `
      )
      .all(businessId, startDate, endDate);
  }

  /**
   * Get missed clock-outs (active shifts older than 24 hours)
   */
  getMissedClockOuts(businessId: string): any[] {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    return this.db
      .prepare(
        `
        SELECT 
          u.id as userId,
          u.firstName,
          u.lastName,
          ce.timestamp as clockInTime,
          ts.id as shiftId,
          ts.status
        FROM time_shifts ts
        JOIN users u ON ts.userId = u.id
        JOIN clock_events ce ON ts.clockInId = ce.id
        WHERE u.businessId = ?
          AND ts.status = 'active'
          AND ce.timestamp < ?
        ORDER BY ce.timestamp ASC
      `
      )
      .all(businessId, twentyFourHoursAgo);
  }

  /**
   * Get overtime report
   */
  getOvertimeReport(
    businessId: string,
    startDate: string,
    endDate: string
  ): any[] {
    return this.db
      .prepare(
        `
        SELECT 
          u.id as userId,
          u.firstName,
          u.lastName,
          COUNT(ts.id) as shiftsWithOvertime,
          SUM(ts.overtimeHours) as totalOvertimeHours,
          AVG(ts.overtimeHours) as averageOvertimePerShift
        FROM time_shifts ts
        JOIN users u ON ts.userId = u.id
        JOIN clock_events ce ON ts.clockInId = ce.id
        WHERE u.businessId = ?
          AND ce.timestamp >= ?
          AND ce.timestamp <= ?
          AND ts.overtimeHours > 0
        GROUP BY u.id, u.firstName, u.lastName
        ORDER BY totalOvertimeHours DESC
      `
      )
      .all(businessId, startDate, endDate);
  }

  /**
   * Get break compliance report
   */
  getBreakComplianceReport(
    businessId: string,
    startDate: string,
    endDate: string
  ): any[] {
    return this.db
      .prepare(
        `
        SELECT 
          u.id as userId,
          u.firstName,
          u.lastName,
          COUNT(DISTINCT ts.id) as totalShifts,
          COUNT(DISTINCT CASE WHEN b.id IS NOT NULL THEN ts.id END) as shiftsWithBreaks,
          COUNT(b.id) as totalBreaks,
          CAST(AVG(b.duration) AS INTEGER) as averageBreakDuration
        FROM time_shifts ts
        JOIN users u ON ts.userId = u.id
        JOIN clock_events ce ON ts.clockInId = ce.id
        LEFT JOIN breaks b ON b.shiftId = ts.id AND b.status = 'completed'
        WHERE u.businessId = ?
          AND ce.timestamp >= ?
          AND ce.timestamp <= ?
          AND ts.totalHours >= 6
        GROUP BY u.id, u.firstName, u.lastName
        HAVING shiftsWithBreaks < totalShifts
        ORDER BY (CAST(shiftsWithBreaks AS REAL) / CAST(totalShifts AS REAL)) ASC
      `
      )
      .all(businessId, startDate, endDate);
  }

  /**
   * Get payroll summary
   */
  getPayrollSummary(
    businessId: string,
    startDate: string,
    endDate: string,
    hourlyRate?: number
  ): any[] {
    const rate = hourlyRate || 15; // Default hourly rate

    return this.db
      .prepare(
        `
        SELECT 
          u.id as userId,
          u.firstName,
          u.lastName,
          u.role,
          COUNT(ts.id) as totalShifts,
          CAST(SUM(ts.regularHours) AS REAL) as regularHours,
          CAST(SUM(ts.overtimeHours) AS REAL) as overtimeHours,
          CAST(SUM(ts.totalHours) AS REAL) as totalHours,
          CAST(SUM(ts.breakDuration) AS REAL) as totalBreakMinutes
        FROM time_shifts ts
        JOIN users u ON ts.userId = u.id
        JOIN clock_events ce ON ts.clockInId = ce.id
        WHERE u.businessId = ?
          AND ce.timestamp >= ?
          AND ce.timestamp <= ?
          AND ts.status = 'completed'
        GROUP BY u.id, u.firstName, u.lastName, u.role
        ORDER BY u.lastName, u.firstName
      `
      )
      .all(businessId, startDate, endDate)
      .map((record: any) => ({
        ...record,
        regularPay: (record.regularHours || 0) * rate,
        overtimePay: (record.overtimeHours || 0) * rate * 1.5, // Overtime at 1.5x
        totalPay:
          (record.regularHours || 0) * rate +
          (record.overtimeHours || 0) * rate * 1.5,
      }));
  }

  /**
   * Get shift patterns analysis
   */
  getShiftPatternsAnalysis(userId: string, days: number = 30): any {
    const startDate = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();
    const endDate = new Date().toISOString();

    const shifts = this.db
      .prepare(
        `
        SELECT 
          ts.*,
          ce_in.timestamp as clockInTime,
          ce_out.timestamp as clockOutTime,
          CAST(strftime('%w', ce_in.timestamp) AS INTEGER) as dayOfWeek,
          CAST(strftime('%H', ce_in.timestamp) AS INTEGER) as clockInHour
        FROM time_shifts ts
        JOIN clock_events ce_in ON ts.clockInId = ce_in.id
        LEFT JOIN clock_events ce_out ON ts.clockOutId = ce_out.id
        WHERE ts.userId = ?
          AND ce_in.timestamp >= ?
          AND ce_in.timestamp <= ?
        ORDER BY ce_in.timestamp ASC
      `
      )
      .all(userId, startDate, endDate);

    // Analyze patterns
    const dayDistribution = new Array(7).fill(0);
    const hourDistribution = new Array(24).fill(0);
    let totalShifts = shifts.length;

    shifts.forEach((shift: any) => {
      dayDistribution[shift.dayOfWeek]++;
      hourDistribution[shift.clockInHour]++;
    });

    // Find most common shift start time
    const mostCommonHour = hourDistribution.indexOf(
      Math.max(...hourDistribution)
    );
    const mostCommonDay = dayDistribution.indexOf(Math.max(...dayDistribution));

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return {
      totalShifts,
      periodDays: days,
      averageShiftsPerWeek: (totalShifts / days) * 7,
      mostCommonStartHour: mostCommonHour,
      mostCommonDay: dayNames[mostCommonDay],
      dayDistribution: dayDistribution.map((count, idx) => ({
        day: dayNames[idx],
        count,
        percentage: totalShifts > 0 ? (count / totalShifts) * 100 : 0,
      })),
      hourDistribution: hourDistribution.map((count, idx) => ({
        hour: idx,
        count,
        percentage: totalShifts > 0 ? (count / totalShifts) * 100 : 0,
      })),
    };
  }

  /**
   * Get real-time dashboard data
   */
  getRealTimeDashboard(businessId: string): any {
    const today = new Date().toISOString().split("T")[0];

    // Currently clocked in users
    const currentlyWorking = this.db
      .prepare(
        `
        SELECT 
          u.id,
          u.firstName,
          u.lastName,
          u.role,
          ce.timestamp as clockInTime,
          ts.id as shiftId
        FROM time_shifts ts
        JOIN users u ON ts.userId = u.id
        JOIN clock_events ce ON ts.clockInId = ce.id
        WHERE u.businessId = ?
          AND ts.status = 'active'
        ORDER BY ce.timestamp ASC
      `
      )
      .all(businessId);

    // Today's completed shifts
    const completedToday = this.db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM time_shifts ts
        JOIN users u ON ts.userId = u.id
        JOIN clock_events ce ON ts.clockInId = ce.id
        WHERE u.businessId = ?
          AND date(ce.timestamp) = date('now')
          AND ts.status = 'completed'
      `
      )
      .get(businessId);

    // Active breaks
    const activeBreaks = this.db
      .prepare(
        `
        SELECT 
          b.*,
          u.firstName,
          u.lastName
        FROM breaks b
        JOIN time_shifts ts ON b.shiftId = ts.id
        JOIN users u ON b.userId = u.id
        WHERE u.businessId = ?
          AND b.status = 'active'
      `
      )
      .all(businessId);

    // Today's total hours
    const todayHours = this.db
      .prepare(
        `
        SELECT 
          CAST(SUM(ts.totalHours) AS REAL) as totalHours,
          CAST(SUM(ts.overtimeHours) AS REAL) as overtimeHours
        FROM time_shifts ts
        JOIN users u ON ts.userId = u.id
        JOIN clock_events ce ON ts.clockInId = ce.id
        WHERE u.businessId = ?
          AND date(ce.timestamp) = date('now')
          AND ts.status = 'completed'
      `
      )
      .get(businessId);

    return {
      currentlyWorking: currentlyWorking.length,
      workingUsers: currentlyWorking,
      completedShifts: completedToday?.count || 0,
      activeBreaks: activeBreaks.length,
      breakUsers: activeBreaks,
      todayHours: todayHours?.totalHours || 0,
      todayOvertime: todayHours?.overtimeHours || 0,
      timestamp: new Date().toISOString(),
    };
  }
}
