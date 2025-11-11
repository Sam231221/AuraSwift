import type { AuditLog } from "../../../../../types/database.d.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, gte, lte, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class AuditManager {
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

  /**
   * Create an audit log entry
   */
  async createAuditLog(data: {
    action: string;
    entityType:
      | "clock_event"
      | "shift"
      | "break"
      | "time_correction"
      | "session"
      | "user";
    entityId: string;
    userId: string;
    details: any; // Will be JSON stringified
    ipAddress?: string;
    terminalId?: string;
  }): Promise<AuditLog> {
    const auditId = this.uuid.v4();
    const now = new Date().toISOString();

    const auditLog: AuditLog = {
      id: auditId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      details:
        typeof data.details === "string"
          ? data.details
          : JSON.stringify(data.details),
      ipAddress: data.ipAddress,
      terminalId: data.terminalId,
      timestamp: now,
      createdAt: now,
    };

    this.db
      .prepare(
        `
        INSERT INTO audit_logs (id, userId, action, resource, resourceId, entityType, entityId, details, ipAddress, terminalId, timestamp, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        auditLog.id,
        auditLog.userId,
        auditLog.action,
        auditLog.entityType, // Also store in resource for backward compatibility
        auditLog.entityId, // Also store in resourceId for backward compatibility
        auditLog.entityType,
        auditLog.entityId,
        auditLog.details,
        auditLog.ipAddress,
        auditLog.terminalId,
        auditLog.timestamp,
        auditLog.createdAt
      );

    return auditLog;
  }

  /**
   * Log a clock event action
   */
  async logClockEvent(
    action: "clock_in" | "clock_out" | "clock_event_modified",
    clockEvent: any,
    userId: string,
    terminalId?: string,
    ipAddress?: string,
    additionalDetails?: any
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      entityType: "clock_event",
      entityId: clockEvent.id,
      userId,
      details: {
        clockEvent,
        ...additionalDetails,
      },
      ipAddress,
      terminalId,
    });
  }

  /**
   * Log a shift action
   */
  async logShiftAction(
    action:
      | "shift_started"
      | "shift_completed"
      | "shift_modified"
      | "shift_forced_end",
    shift: any,
    userId: string,
    terminalId?: string,
    ipAddress?: string,
    additionalDetails?: any
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      entityType: "shift",
      entityId: shift.id,
      userId,
      details: {
        shift,
        ...additionalDetails,
      },
      ipAddress,
      terminalId,
    });
  }

  /**
   * Log a break action
   */
  async logBreakAction(
    action: "break_started" | "break_ended" | "break_modified",
    breakRecord: any,
    userId: string,
    terminalId?: string,
    ipAddress?: string,
    additionalDetails?: any
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      entityType: "break",
      entityId: breakRecord.id,
      userId,
      details: {
        break: breakRecord,
        ...additionalDetails,
      },
      ipAddress,
      terminalId,
    });
  }

  /**
   * Log a time correction action
   */
  async logTimeCorrectionAction(
    action:
      | "time_correction_requested"
      | "time_correction_approved"
      | "time_correction_rejected",
    correction: any,
    userId: string,
    terminalId?: string,
    ipAddress?: string,
    additionalDetails?: any
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      entityType: "time_correction",
      entityId: correction.id,
      userId,
      details: {
        correction,
        ...additionalDetails,
      },
      ipAddress,
      terminalId,
    });
  }

  /**
   * Log a session action
   */
  async logSessionAction(
    action:
      | "login"
      | "logout"
      | "session_expired"
      | "concurrent_login"
      | "session_terminated",
    session: any,
    userId: string,
    terminalId?: string,
    ipAddress?: string,
    additionalDetails?: any
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      entityType: "session",
      entityId: session.id,
      userId,
      details: {
        session,
        ...additionalDetails,
      },
      ipAddress,
      terminalId,
    });
  }

  /**
   * Log a user action
   */
  async logUserAction(
    action:
      | "user_created"
      | "user_updated"
      | "user_deleted"
      | "password_changed",
    user: any,
    performedBy: string,
    terminalId?: string,
    ipAddress?: string,
    additionalDetails?: any
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      entityType: "user",
      entityId: user.id,
      userId: performedBy,
      details: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          ...additionalDetails,
        },
      },
      ipAddress,
      terminalId,
    });
  }

  /**
   * Get audit logs by entity
   */
  getAuditLogsByEntity(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): AuditLog[] {
    return this.db
      .prepare(
        "SELECT * FROM audit_logs WHERE entityType = ? AND entityId = ? ORDER BY timestamp DESC LIMIT ?"
      )
      .all(entityType, entityId, limit) as AuditLog[];
  }

  /**
   * Get audit logs by user
   */
  getAuditLogsByUser(userId: string, limit: number = 100): AuditLog[] {
    return this.db
      .prepare(
        "SELECT * FROM audit_logs WHERE userId = ? ORDER BY timestamp DESC LIMIT ?"
      )
      .all(userId, limit) as AuditLog[];
  }

  /**
   * Get audit logs by action
   */
  getAuditLogsByAction(action: string, limit: number = 100): AuditLog[] {
    return this.db
      .prepare(
        "SELECT * FROM audit_logs WHERE action = ? ORDER BY timestamp DESC LIMIT ?"
      )
      .all(action, limit) as AuditLog[];
  }

  /**
   * Get audit logs within date range
   */
  getAuditLogsByDateRange(
    startDate: string,
    endDate: string,
    entityType?: string,
    limit: number = 100
  ): AuditLog[] {
    let query =
      "SELECT * FROM audit_logs WHERE timestamp >= ? AND timestamp <= ?";
    const params: any[] = [startDate, endDate];

    if (entityType) {
      query += " AND entityType = ?";
      params.push(entityType);
    }

    query += " ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);

    return this.db.prepare(query).all(...params) as AuditLog[];
  }

  /**
   * Get recent suspicious activities
   */
  getSuspiciousActivities(businessId: string, limit: number = 50): AuditLog[] {
    return this.db
      .prepare(
        `
        SELECT al.* FROM audit_logs al
        JOIN users u ON al.userId = u.id
        WHERE u.businessId = ?
          AND (
            al.action IN ('clock_event_modified', 'shift_forced_end', 'time_correction_requested')
            OR al.action LIKE '%concurrent%'
          )
        ORDER BY al.timestamp DESC
        LIMIT ?
      `
      )
      .all(businessId, limit) as AuditLog[];
  }

  /**
   * Get audit trail for compliance reporting
   */
  getComplianceAuditTrail(
    businessId: string,
    startDate: string,
    endDate: string
  ): AuditLog[] {
    return this.db
      .prepare(
        `
        SELECT al.* FROM audit_logs al
        JOIN users u ON al.userId = u.id
        WHERE u.businessId = ?
          AND al.timestamp >= ?
          AND al.timestamp <= ?
        ORDER BY al.timestamp DESC
      `
      )
      .all(businessId, startDate, endDate) as AuditLog[];
  }

  /**
   * Clean up old audit logs (optional - for data retention policies)
   */
  async cleanupOldAuditLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffIso = cutoffDate.toISOString();

    const result = this.db
      .prepare("DELETE FROM audit_logs WHERE timestamp < ?")
      .run(cutoffIso);

    return result.changes || 0;
  }
}
