import type { Schedule } from "../models/schedule.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, asc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class ScheduleManager {
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

  // Schedule CRUD methods - to be implemented from database.ts
  createSchedule(
    scheduleData: Omit<Schedule, "id" | "createdAt" | "updatedAt">
  ): Schedule {
    const scheduleId = this.uuid.v4();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO schedules (id, staffId, businessId, startTime, endTime, status, assignedRegister, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        scheduleId,
        scheduleData.staffId,
        scheduleData.businessId,
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.status,
        scheduleData.assignedRegister || null,
        scheduleData.notes || null,
        now,
        now
      );

    return this.getScheduleById(scheduleId);
  }

  getScheduleById(id: string): Schedule {
    const schedule = this.db
      .prepare("SELECT * FROM schedules WHERE id = ?")
      .get(id) as Schedule;

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    return schedule;
  }

  getSchedulesByBusiness(businessId: string): Schedule[] {
    return this.db
      .prepare(
        "SELECT * FROM schedules WHERE businessId = ? ORDER BY startTime DESC"
      )
      .all(businessId) as Schedule[];
  }

  // ============================================
  // DRIZZLE ORM METHODS
  // ============================================

  /**
   * Create schedule using Drizzle ORM (type-safe)
   */
  createDrizzle(
    schedule: Omit<Schedule, "id" | "createdAt" | "updatedAt">
  ): Schedule {
    const db = this.getDrizzleInstance();
    const id = this.uuid.v4();
    const now = new Date().toISOString();

    db.insert(schema.schedules)
      .values({
        id,
        staffId: schedule.staffId,
        businessId: schedule.businessId,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        status: schedule.status,
        assignedRegister: schedule.assignedRegister ?? null,
        notes: schedule.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    return {
      ...schedule,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get schedules by business ID using Drizzle ORM (type-safe)
   */
  getByBusinessIdDrizzle(businessId: string): Schedule[] {
    const db = this.getDrizzleInstance();

    const result = db
      .select()
      .from(schema.schedules)
      .where(eq(schema.schedules.businessId, businessId))
      .orderBy(asc(schema.schedules.startTime))
      .all();

    return result.map((s) => ({
      ...s,
      assignedRegister: s.assignedRegister ?? undefined,
      notes: s.notes ?? undefined,
    }));
  }

  /**
   * Get schedules by staff ID using Drizzle ORM (type-safe)
   */
  getByStaffIdDrizzle(staffId: string): Schedule[] {
    const db = this.getDrizzleInstance();

    const result = db
      .select()
      .from(schema.schedules)
      .where(eq(schema.schedules.staffId, staffId))
      .orderBy(asc(schema.schedules.startTime))
      .all();

    return result.map((s) => ({
      ...s,
      assignedRegister: s.assignedRegister ?? undefined,
      notes: s.notes ?? undefined,
    }));
  }

  /**
   * Update schedule status using Drizzle ORM (type-safe)
   */
  updateStatusDrizzle(scheduleId: string, status: Schedule["status"]): void {
    const db = this.getDrizzleInstance();
    const now = new Date().toISOString();

    db.update(schema.schedules)
      .set({
        status,
        updatedAt: now,
      })
      .where(eq(schema.schedules.id, scheduleId))
      .run();
  }

  /**
   * Update schedule using Drizzle ORM (type-safe)
   */
  updateDrizzle(
    scheduleId: string,
    updates: Partial<
      Pick<
        Schedule,
        | "staffId"
        | "startTime"
        | "endTime"
        | "assignedRegister"
        | "notes"
        | "status"
      >
    >
  ): Schedule {
    const db = this.getDrizzleInstance();
    const now = new Date().toISOString();

    // Build update object
    const updateData: any = { updatedAt: now };

    if (updates.staffId !== undefined) updateData.staffId = updates.staffId;
    if (updates.startTime !== undefined)
      updateData.startTime = updates.startTime;
    if (updates.endTime !== undefined) updateData.endTime = updates.endTime;
    if (updates.assignedRegister !== undefined)
      updateData.assignedRegister = updates.assignedRegister ?? null;
    if (updates.notes !== undefined) updateData.notes = updates.notes ?? null;
    if (updates.status !== undefined) updateData.status = updates.status;

    if (Object.keys(updateData).length === 1) {
      throw new Error("No fields to update");
    }

    db.update(schema.schedules)
      .set(updateData)
      .where(eq(schema.schedules.id, scheduleId))
      .run();

    // Return the updated schedule
    const updated = db
      .select()
      .from(schema.schedules)
      .where(eq(schema.schedules.id, scheduleId))
      .get();

    if (!updated) {
      throw new Error("Schedule not found after update");
    }

    return {
      ...updated,
      assignedRegister: updated.assignedRegister ?? undefined,
      notes: updated.notes ?? undefined,
    };
  }

  /**
   * Delete schedule using Drizzle ORM (type-safe)
   */
  deleteDrizzle(scheduleId: string): void {
    const db = this.getDrizzleInstance();

    const result = db
      .delete(schema.schedules)
      .where(eq(schema.schedules.id, scheduleId))
      .run();

    if (result.changes === 0) {
      throw new Error("Schedule not found");
    }
  }
}
