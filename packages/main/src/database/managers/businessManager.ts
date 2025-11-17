import type { Business } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq } from "drizzle-orm";
import * as schema from "../schema.js";

export class BusinessManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  getBusinessById(id: string): Business | null {
    const result = this.db
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
    const now = new Date();

    this.db
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
    const now = new Date();

    const result = this.db
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
