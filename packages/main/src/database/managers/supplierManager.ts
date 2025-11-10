import type { Supplier } from "../models/supplier.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, like } from "drizzle-orm";
import * as schema from "../schema.js";

export class SupplierManager {
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

  /**
   * Get supplier by ID
   */
  getSupplierById(id: string): Supplier | null {
    const drizzle = this.getDrizzleInstance();
    const result = drizzle
      .select()
      .from(schema.suppliers)
      .where(eq(schema.suppliers.id, id))
      .get();

    return result as Supplier | null;
  }

  /**
   * Get all suppliers for a business
   */
  getSuppliersByBusinessId(businessId: string, activeOnly = false): Supplier[] {
    const drizzle = this.getDrizzleInstance();

    let query = drizzle
      .select()
      .from(schema.suppliers)
      .where(eq(schema.suppliers.businessId, businessId));

    if (activeOnly) {
      query = query.where(
        and(
          eq(schema.suppliers.businessId, businessId),
          eq(schema.suppliers.isActive, true)
        )
      );
    }

    const results = query.all();
    return results as Supplier[];
  }

  /**
   * Search suppliers by name
   */
  searchSuppliers(businessId: string, searchTerm: string): Supplier[] {
    const drizzle = this.getDrizzleInstance();
    const results = drizzle
      .select()
      .from(schema.suppliers)
      .where(
        and(
          eq(schema.suppliers.businessId, businessId),
          like(schema.suppliers.name, `%${searchTerm}%`)
        )
      )
      .all();

    return results as Supplier[];
  }

  /**
   * Create a new supplier
   */
  createSupplier(supplierData: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    paymentTerms?: string;
    businessId: string;
    notes?: string;
  }): Supplier {
    const supplierId = this.uuid.v4();
    const now = new Date().toISOString();
    const drizzle = this.getDrizzleInstance();

    drizzle
      .insert(schema.suppliers)
      .values({
        id: supplierId,
        name: supplierData.name,
        contactPerson: supplierData.contactPerson || null,
        email: supplierData.email || null,
        phone: supplierData.phone || null,
        address: supplierData.address || null,
        city: supplierData.city || null,
        country: supplierData.country || null,
        taxId: supplierData.taxId || null,
        paymentTerms: supplierData.paymentTerms || null,
        businessId: supplierData.businessId,
        isActive: true,
        notes: supplierData.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const supplier = this.getSupplierById(supplierId);
    if (!supplier) {
      throw new Error("Supplier not found after creation");
    }
    return supplier;
  }

  /**
   * Update supplier information
   */
  updateSupplier(
    id: string,
    updates: Partial<{
      name: string;
      contactPerson: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      country: string;
      taxId: string;
      paymentTerms: string;
      isActive: boolean;
      notes: string;
    }>
  ): boolean {
    const drizzle = this.getDrizzleInstance();
    const now = new Date().toISOString();

    const result = drizzle
      .update(schema.suppliers)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(schema.suppliers.id, id))
      .run();

    return result.changes > 0;
  }

  /**
   * Delete supplier (soft delete by marking as inactive)
   */
  deleteSupplier(id: string): boolean {
    return this.updateSupplier(id, { isActive: false });
  }

  /**
   * Permanently delete supplier from database
   */
  permanentlyDeleteSupplier(id: string): boolean {
    const drizzle = this.getDrizzleInstance();
    const result = drizzle
      .delete(schema.suppliers)
      .where(eq(schema.suppliers.id, id))
      .run();

    return result.changes > 0;
  }

  /**
   * Get active suppliers count for a business
   */
  getActiveSuppliersCount(businessId: string): number {
    const drizzle = this.getDrizzleInstance();
    const result = drizzle
      .select()
      .from(schema.suppliers)
      .where(
        and(
          eq(schema.suppliers.businessId, businessId),
          eq(schema.suppliers.isActive, true)
        )
      )
      .all();

    return result.length;
  }
}
