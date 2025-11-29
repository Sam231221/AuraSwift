/**
 * Category API Types
 * 
 * @module types/api/category
 */

export interface CategoryAPI {
  create: (categoryData: Record<string, any>) => Promise<any>;
  getByBusiness: (businessId: string) => Promise<any>;
  getVatCategories: (businessId: string) => Promise<any>;
  update: (id: string, updates: Record<string, any>) => Promise<any>;
  delete: (id: string) => Promise<any>;
  reorder: (businessId: string, categoryIds: string[]) => Promise<any>;
}
