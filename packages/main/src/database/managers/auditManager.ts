import type { AuditLog } from "../../../../../types/database.d.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, gte, lte, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class AuditManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
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

    this.db
      .insert(schema.auditLogs)
      .values({
        id: auditId,
        action: data.action,
        resource: data.entityType, // Store in resource for backward compatibility
        resourceId: data.entityId, // Store in resourceId for backward compatibility
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
      })
      .run();

    return {
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
      .select()
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.entityType, entityType),
          eq(schema.auditLogs.entityId, entityId)
        )
      )
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(limit)
      .all() as AuditLog[];
  }

  /**
   * Get audit logs by user
   */
  getAuditLogsByUser(userId: string, limit: number = 100): AuditLog[] {
    return this.db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.userId, userId))
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(limit)
      .all() as AuditLog[];
  }

  /**
   * Get audit logs by action
   */
  getAuditLogsByAction(action: string, limit: number = 100): AuditLog[] {
    return this.db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.action, action))
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(limit)
      .all() as AuditLog[];
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
    const conditions = [
      gte(schema.auditLogs.timestamp, startDate),
      lte(schema.auditLogs.timestamp, endDate),
    ];

    if (entityType) {
      conditions.push(eq(schema.auditLogs.entityType, entityType));
    }

    return this.db
      .select()
      .from(schema.auditLogs)
      .where(and(...conditions))
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(limit)
      .all() as AuditLog[];
  }

  /**
   * Get recent suspicious activities
   */
  getSuspiciousActivities(businessId: string, limit: number = 50): AuditLog[] {
    const results = this.db
      .select({
        auditLog: schema.auditLogs,
      })
      .from(schema.auditLogs)
      .innerJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .where(
        and(
          eq(schema.users.businessId, businessId),
          drizzleSql`(
            ${schema.auditLogs.action} IN ('clock_event_modified', 'shift_forced_end', 'time_correction_requested')
            OR ${schema.auditLogs.action} LIKE '%concurrent%'
          )`
        )
      )
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(limit)
      .all();

    return results.map((r) => r.auditLog) as AuditLog[];
  }

  /**
   * Get audit trail for compliance reporting
   */
  getComplianceAuditTrail(
    businessId: string,
    startDate: string,
    endDate: string
  ): AuditLog[] {
    const results = this.db
      .select({
        auditLog: schema.auditLogs,
      })
      .from(schema.auditLogs)
      .innerJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .where(
        and(
          eq(schema.users.businessId, businessId),
          gte(schema.auditLogs.timestamp, startDate),
          lte(schema.auditLogs.timestamp, endDate)
        )
      )
      .orderBy(desc(schema.auditLogs.timestamp))
      .all();

    return results.map((r) => r.auditLog) as AuditLog[];
  }

  /**
   * Clean up old audit logs (optional - for data retention policies)
   */
  async cleanupOldAuditLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffIso = cutoffDate.toISOString();

    const result = this.db
      .delete(schema.auditLogs)
      .where(drizzleSql`${schema.auditLogs.timestamp} < ${cutoffIso}`)
      .run();

    return result.changes || 0;
  }
}
