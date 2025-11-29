/**
 * Category API Types - Preload
 * 
 * Type definitions for category management IPC APIs.
 * 
 * @module preload/types/api/category
 */

export interface CategoryAPIPreload {
  create: (categoryData: {
    name: string;
    description?: string;
    businessId: string;
    sortOrder?: number;
  }) => Promise<any>;

  getByBusiness: (businessId: string) => Promise<any>;

  getById: (id: string) => Promise<any>;

  update: (id: string, updates: any) => Promise<any>;

  delete: (id: string) => Promise<any>;

  reorder: (businessId: string, categoryIds: string[]) => Promise<any>;

  getVatCategories: (businessId: string) => Promise<any>;
}

