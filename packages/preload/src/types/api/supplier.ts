/**
 * Supplier API Types - Preload
 * 
 * Type definitions for supplier management IPC APIs.
 * 
 * @module preload/types/api/supplier
 */

export interface CreateSupplierData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  businessId: string;
  isActive?: boolean;
}

export interface SupplierAPIPreload {
  create: (supplierData: CreateSupplierData) => Promise<any>;

  getById: (supplierId: string) => Promise<any>;

  getByBusiness: (businessId: string, includeInactive?: boolean) => Promise<any>;

  update: (supplierId: string, updates: Partial<CreateSupplierData>) => Promise<any>;

  delete: (supplierId: string) => Promise<any>;
}

