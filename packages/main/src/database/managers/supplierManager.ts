import type { Supplier } from "../models/supplier.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and, like } from "drizzle-orm";
import * as schema from "../schema.js";

export class SupplierManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Get supplier by ID
   */
  getSupplierById(id: string): Supplier | null {
    const result = this.db
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
    let queryBuilder = this.db.select().from(schema.suppliers);

    if (activeOnly) {
      const results = queryBuilder
        .where(
          and(
            eq(schema.suppliers.businessId, businessId),
            eq(schema.suppliers.isActive, true)
          )
        )
        .all();
      return results as Supplier[];
    }

    const results = queryBuilder
      .where(eq(schema.suppliers.businessId, businessId))
      .all();
    return results as Supplier[];
  }

  /**
   * Search suppliers by name
   */
  searchSuppliers(businessId: string, searchTerm: string): Supplier[] {
    const results = this.db
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

    this.db
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
    const now = new Date().toISOString();

    const result = this.db
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
    const result = this.db
      .delete(schema.suppliers)
      .where(eq(schema.suppliers.id, id))
      .run();

    return result.changes > 0;
  }

  /**
   * Get active suppliers count for a business
   */
  getActiveSuppliersCount(businessId: string): number {
    const result = this.db
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
