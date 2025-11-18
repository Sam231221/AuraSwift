import type { Supplier } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and } from "drizzle-orm";
import * as schema from "../schema.js";

export interface SupplierResponse {
  success: boolean;
  message: string;
  supplier?: Supplier;
  suppliers?: Supplier[];
  errors?: string[];
}

export class SupplierManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Create a new supplier
   */
  async createSupplier(
    supplierData: Omit<Supplier, "id" | "createdAt" | "updatedAt">
  ): Promise<Supplier> {
    const supplierId = this.uuid.v4();
    const now = new Date();

    // Validate required fields
    if (!supplierData.name || supplierData.name.trim() === "") {
      throw new Error("Supplier name is required");
    }
    if (!supplierData.businessId) {
      throw new Error("Business ID is required");
    }

    await this.db.insert(schema.suppliers).values({
      id: supplierId,
      name: supplierData.name,
      contactPerson: supplierData.contactPerson ?? null,
      email: supplierData.email ?? null,
      phone: supplierData.phone ?? null,
      address: supplierData.address ?? null,
      businessId: supplierData.businessId,
      isActive: supplierData.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return this.getSupplierById(supplierId);
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string): Promise<Supplier> {
    const [supplier] = await this.db
      .select()
      .from(schema.suppliers)
      .where(eq(schema.suppliers.id, id))
      .limit(1);

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier as Supplier;
  }

  /**
   * Get suppliers by business ID
   */
  async getSuppliersByBusiness(
    businessId: string,
    includeInactive: boolean = false
  ): Promise<Supplier[]> {
    const conditions = [eq(schema.suppliers.businessId, businessId)];

    if (!includeInactive) {
      conditions.push(eq(schema.suppliers.isActive, true));
    }

    const suppliers = await this.db
      .select()
      .from(schema.suppliers)
      .where(and(...conditions))
      .orderBy(schema.suppliers.name);

    return suppliers as Supplier[];
  }

  /**
   * Update supplier
   */
  async updateSupplier(
    id: string,
    updates: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>
  ): Promise<Supplier> {
    if (Object.keys(updates).length === 0) {
      return this.getSupplierById(id);
    }

    // Check if supplier exists
    try {
      await this.getSupplierById(id);
    } catch (error) {
      throw new Error("Supplier not found");
    }

    const now = new Date();

    await this.db
      .update(schema.suppliers)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(schema.suppliers.id, id))
      .run();

    return this.getSupplierById(id);
  }

  /**
   * Delete supplier (soft delete by setting isActive to false)
   */
  async deleteSupplier(id: string): Promise<boolean> {
    const now = new Date();

    const result = await this.db
      .update(schema.suppliers)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.suppliers.id, id),
          eq(schema.suppliers.isActive, true)
        )
      )
      .run();

    return result.changes > 0;
  }
}

