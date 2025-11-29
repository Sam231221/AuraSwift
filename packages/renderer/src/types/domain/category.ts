/**
 * Category Domain Types
 * 
 * @module types/domain/category
 */

export interface Category {
  id: string;
  name: string;
  description?: string;
  businessId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  parentId?: string | null;
}

export interface VatCategory {
  id: string;
  name: string;
  percentage: number;
  businessId: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}
