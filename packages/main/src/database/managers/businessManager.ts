import type { Business } from "../models/business.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq } from "drizzle-orm";
import * as schema from "../schema.js";

export class BusinessManager {
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

  getBusinessById(id: string): Business | null {
    const drizzle = this.getDrizzleInstance();
    const result = drizzle
      .select()
      .from(schema.businesses)
      .where(eq(schema.businesses.id, id))
      .get();

    return result as Business | null;
  }

  createBusiness(businessData: {
    name: string;
    ownerId: string;
    address?: string;
    phone?: string;
    vatNumber?: string;
  }): Business {
    const businessId = this.uuid.v4();
    const now = new Date().toISOString();
    const drizzle = this.getDrizzleInstance();

    drizzle
      .insert(schema.businesses)
      .values({
        id: businessId,
        name: businessData.name,
        ownerId: businessData.ownerId,
        address: businessData.address || "",
        phone: businessData.phone || "",
        vatNumber: businessData.vatNumber || "",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const business = this.getBusinessById(businessId);
    if (!business) {
      throw new Error("Business not found after creation");
    }
    return business;
  }

  updateBusiness(
    id: string,
    updates: Partial<{
      name: string;
      address: string;
      phone: string;
      vatNumber: string;
    }>
  ): boolean {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const result = drizzle
      .update(schema.businesses)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(schema.businesses.id, id))
      .run();

    return result.changes > 0;
  }
}
