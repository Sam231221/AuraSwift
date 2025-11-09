import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class AuditLogManager {
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
      throw new Error("Drizzle ORM not initialized");
    }
    return this.drizzle;
  }

  createAuditLog(logData: {
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details?: string;
  }): void {
    const logId = this.uuid.v4();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO audit_logs (id, userId, action, resource, resourceId, details, timestamp, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        logId,
        logData.userId,
        logData.action,
        logData.resource,
        logData.resourceId,
        logData.details || null,
        now,
        now
      );
  }

  getAuditLogsByUser(userId: string, limit: number = 100): any[] {
    return this.db
      .prepare(
        "SELECT * FROM audit_logs WHERE userId = ? ORDER BY timestamp DESC LIMIT ?"
      )
      .all(userId, limit);
  }

  getAuditLogsByResource(
    resource: string,
    resourceId: string,
    limit: number = 100
  ): any[] {
    return this.db
      .prepare(
        "SELECT * FROM audit_logs WHERE resource = ? AND resourceId = ? ORDER BY timestamp DESC LIMIT ?"
      )
      .all(resource, resourceId, limit);
  }

  // ============================================
  // DRIZZLE ORM METHODS
  // ============================================

  /**
   * Create audit log using Drizzle ORM (type-safe)
   */
  createDrizzle(auditData: {
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details?: any;
  }): void {
    const db = this.getDrizzleInstance();
    const auditId = this.uuid.v4();
    const now = new Date().toISOString();

    db.insert(schema.auditLogs)
      .values({
        id: auditId,
        userId: auditData.userId,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId,
        details: auditData.details ? JSON.stringify(auditData.details) : null,
        timestamp: now,
        createdAt: now,
      })
      .run();
  }

  /**
   * Get audit logs with filtering using Drizzle ORM (type-safe)
   */
  getDrizzle(options?: {
    userId?: string;
    resource?: string;
    resourceId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): any[] {
    const db = this.getDrizzleInstance();

    // Build where conditions
    const conditions = [];
    if (options?.userId) {
      conditions.push(eq(schema.auditLogs.userId, options.userId));
    }
    if (options?.resource) {
      conditions.push(eq(schema.auditLogs.resource, options.resource));
    }
    if (options?.resourceId) {
      conditions.push(eq(schema.auditLogs.resourceId, options.resourceId));
    }
    if (options?.action) {
      conditions.push(eq(schema.auditLogs.action, options.action));
    }

    // Build query with conditions
    let queryBuilder = db.select().from(schema.auditLogs);

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    queryBuilder = queryBuilder.orderBy(
      desc(schema.auditLogs.timestamp)
    ) as any;

    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options.limit) as any;
    }
    if (options?.offset) {
      queryBuilder = queryBuilder.offset(options.offset) as any;
    }

    const results = queryBuilder.all();

    return results.map((log: any) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  }

  /**
   * Get audit logs by user using Drizzle ORM (type-safe)
   */
  getByUserDrizzle(userId: string, limit: number = 100): any[] {
    return this.getDrizzle({ userId, limit });
  }

  /**
   * Get audit logs by resource using Drizzle ORM (type-safe)
   */
  getByResourceDrizzle(
    resource: string,
    resourceId: string,
    limit: number = 100
  ): any[] {
    return this.getDrizzle({ resource, resourceId, limit });
  }
}
