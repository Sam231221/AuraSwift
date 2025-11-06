export class AuditLogManager {
  private db: any;
  private uuid: any;

  constructor(db: any, uuid: any) {
    this.db = db;
    this.uuid = uuid;
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
}
