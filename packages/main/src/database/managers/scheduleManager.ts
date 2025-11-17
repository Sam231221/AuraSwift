import type { Schedule } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, desc, asc, sql as drizzleSql } from "drizzle-orm";
import * as schema from "../schema.js";

export class ScheduleManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Create schedule
   */
  createSchedule(
    scheduleData: Omit<Schedule, "id" | "createdAt" | "updatedAt">
  ): Schedule {
    const scheduleId = this.uuid.v4();

    this.db
      .insert(schema.schedules)
      .values({
        id: scheduleId,
        staffId: scheduleData.staffId,
        businessId: scheduleData.businessId,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        status: scheduleData.status,
        assignedRegister: scheduleData.assignedRegister ?? null,
        notes: scheduleData.notes ?? null,
      })
      .run();

    // Retrieve and return the created schedule
    const [created] = this.db
      .select()
      .from(schema.schedules)
      .where(eq(schema.schedules.id, scheduleId))
      .limit(1)
      .all();

    return created as Schedule;
  }

  /**
   * Get schedule by ID
   */
  getScheduleById(id: string): Schedule {
    const schedules = this.db
      .select()
      .from(schema.schedules)
      .where(eq(schema.schedules.id, id))
      .limit(1)
      .all();

    if (!schedules || schedules.length === 0) {
      throw new Error("Schedule not found");
    }

    const s = schedules[0];
    return {
      ...s,
      assignedRegister: s.assignedRegister ?? undefined,
      notes: s.notes ?? undefined,
    } as Schedule;
  }

  /**
   * Get schedules by business
   */
  getSchedulesByBusiness(businessId: string): Schedule[] {
    const result = this.db
      .select()
      .from(schema.schedules)
      .where(eq(schema.schedules.businessId, businessId))
      .orderBy(asc(schema.schedules.startTime))
      .all();

    return result.map((s) => ({
      ...s,
      assignedRegister: s.assignedRegister ?? undefined,
      notes: s.notes ?? undefined,
    })) as Schedule[];
  }

  /**
   * Get schedules by staff ID
   */
  getSchedulesByStaffId(staffId: string): Schedule[] {
    const result = this.db
      .select()
      .from(schema.schedules)
      .where(eq(schema.schedules.staffId, staffId))
      .orderBy(asc(schema.schedules.startTime))
      .all();

    return result.map((s) => ({
      ...s,
      assignedRegister: s.assignedRegister ?? undefined,
      notes: s.notes ?? undefined,
    })) as Schedule[];
  }

  /**
   * Update schedule status
   */
  updateScheduleStatus(scheduleId: string, status: Schedule["status"]): void {
    this.db
      .update(schema.schedules)
      .set({ status })
      .where(eq(schema.schedules.id, scheduleId))
      .run();
  }

  /**
   * Update schedule
   */
  updateSchedule(
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

    this.db
      .update(schema.schedules)
      .set(updateData)
      .where(eq(schema.schedules.id, scheduleId))
      .run();

    // Return the updated schedule
    const updated = this.db
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
    } as Schedule;
  }

  /**
   * Delete schedule
   */
  deleteSchedule(scheduleId: string): void {
    const result = this.db
      .delete(schema.schedules)
      .where(eq(schema.schedules.id, scheduleId))
      .run();

    if (result.changes === 0) {
      throw new Error("Schedule not found");
    }
  }
}
