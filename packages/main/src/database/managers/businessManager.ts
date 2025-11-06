import type { Business } from "../models/business.js";

export class BusinessManager {
  private db: any;
  private uuid: any;

  constructor(db: any, uuid: any) {
    this.db = db;
    this.uuid = uuid;
  }

  getBusinessById(id: string): Business | null {
    return this.db
      .prepare("SELECT * FROM businesses WHERE id = ?")
      .get(id) as Business | null;
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

    this.db
      .prepare(
        `
      INSERT INTO businesses (id, name, ownerId, address, phone, vatNumber, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        businessId,
        businessData.name,
        businessData.ownerId,
        businessData.address || "",
        businessData.phone || "",
        businessData.vatNumber || "",
        now,
        now
      );

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
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(updates);
    values.push(new Date().toISOString()); // updatedAt
    values.push(id);

    const result = this.db
      .prepare(
        `
      UPDATE businesses 
      SET ${setClause}, updatedAt = ?
      WHERE id = ?
    `
      )
      .run(...values);

    return result.changes > 0;
  }
}
