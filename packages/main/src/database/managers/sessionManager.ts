import type { Session } from "../models/session.js";

export class SessionManager {
  private db: any;
  private uuid: any;

  constructor(db: any, uuid: any) {
    this.db = db;
    this.uuid = uuid;
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
}
