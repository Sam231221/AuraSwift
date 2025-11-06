import type { Schedule } from "../models/schedule.js";

export class ScheduleManager {
  private db: any;
  private uuid: any;

  constructor(db: any, uuid: any) {
    this.db = db;
    this.uuid = uuid;
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
}
