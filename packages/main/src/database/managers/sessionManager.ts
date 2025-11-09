import type { Session } from "../models/session.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class SessionManager {
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

  createSession(userId: string, expiryDays: number = 7): Session {
    const sessionId = this.uuid.v4();
    const token = this.uuid.v4();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + expiryDays * 24 * 60 * 60 * 1000
    );

    this.db
      .prepare(
        `
      INSERT INTO sessions (id, userId, token, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(
        sessionId,
        userId,
        token,
        expiresAt.toISOString(),
        now.toISOString()
      );

    return {
      id: sessionId,
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };
  }

  createOrUpdateSession(token: string, value: string): void {
    const session = this.getSessionByToken(token);
    if (session) {
      this.db
        .prepare(
          "UPDATE sessions SET token = ?, createdAt = datetime('now') WHERE id = ?"
        )
        .run(token, session.id);
    } else {
      const userId = JSON.parse(value).userId || "";
      // Validate user exists and is active
      const user = this.db
        .prepare("SELECT id FROM users WHERE id = ? AND isActive = 1")
        .get(userId);
      if (!user) {
        throw new Error(
          "Cannot create session: user does not exist or is not active"
        );
      }
      const sessionId = this.uuid.v4();
      const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      this.db
        .prepare(
          `INSERT INTO sessions (id, userId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?, datetime('now'))`
        )
        .run(sessionId, userId, token, expiresAt);
    }
  }

  getSessionByToken(token: string): Session | null {
    const session = this.db
      .prepare(
        `SELECT * FROM sessions WHERE token = ? AND expiresAt > datetime('now')`
      )
      .get(token) as any;
    return session || null;
  }

  deleteSession(token: string): boolean {
    const result = this.db
      .prepare("DELETE FROM sessions WHERE token = ?")
      .run(token);
    return result.changes > 0;
  }

  deleteSessionByToken(token: string): void {
    this.db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }

  cleanupExpiredSessions(): void {
    this.db
      .prepare("DELETE FROM sessions WHERE expiresAt <= datetime('now')")
      .run();
  }

  // ============================================
  // DRIZZLE ORM METHODS
  // ============================================

  /**
   * Delete user sessions using Drizzle ORM (type-safe)
   */
  deleteUserSessionsDrizzle(userId: string): number {
    const db = this.getDrizzleInstance();

    const result = db
      .delete(schema.sessions)
      .where(eq(schema.sessions.userId, userId))
      .run();

    return result.changes;
  }

  /**
   * Cleanup expired sessions using Drizzle ORM (type-safe)
   * Maintenance task
   */
  cleanupExpiredSessionsDrizzle(): number {
    const db = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const result = db
      .delete(schema.sessions)
      .where(drizzleSql`${schema.sessions.expiresAt} <= ${now}`)
      .run();

    return result.changes;
  }

  /**
   * Get active sessions using Drizzle ORM (type-safe)
   */
  getActiveSessionsDrizzle(userId: string): Session[] {
    const db = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const sessions = db
      .select()
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.userId, userId),
          drizzleSql`${schema.sessions.expiresAt} > ${now}`
        )
      )
      .orderBy(desc(schema.sessions.createdAt))
      .all();

    return sessions as Session[];
  }
}
