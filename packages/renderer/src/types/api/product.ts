/**
 * Product API Types
 * 
 * Types for product management operations.
 * 
 * @module types/api/product
 */

export interface ProductAPI {
  create: (productData: Record<string, any>) => Promise<any>;
  getByBusiness: (businessId: string) => Promise<any>;
  getPaginated: (
    businessId: string,
    pagination: {
      page: number;
      pageSize: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    filters?: {
      categoryId?: string;
      searchTerm?: string;
      stockStatus?: 'all' | 'in_stock' | 'low' | 'out_of_stock';
      isActive?: boolean;
    }
  ) => Promise<any>;
  getById: (id: string) => Promise<any>;
  update: (id: string, updates: Record<string, any>) => Promise<any>;
  delete: (id: string) => Promise<any>;
  adjustStock: (adjustmentData: Record<string, any>) => Promise<any>;
  getStockAdjustments: (productId: string) => Promise<any>;
  syncStock: (businessId: string) => Promise<any>;
}
