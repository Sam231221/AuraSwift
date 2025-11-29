/**
 * Product Domain Types
 * 
 * Consolidated product types from features/products/types/product.types.ts
 * 
 * @module types/domain/product
 */

import type { AgeRestrictionLevel } from '../enums/age-restriction';
import type { StockRotationMethod } from '../features/batches';

export type ProductType = 'STANDARD' | 'WEIGHTED' | 'GENERIC';
export type SalesUnit = 'PIECE' | 'KG' | 'GRAM' | 'LITRE' | 'ML' | 'PACK';

export interface Product {
  id: string;
  name: string;
  description?: string;
  
  // Pricing
  basePrice: number;
  costPrice?: number;
  taxRate?: number;
  
  // Identifiers
  sku: string;
  barcode?: string;
  plu?: string;
  
  // Category & Business
  categoryId: string;
  category?: string; // Category name (populated)
  businessId: string;
  
  // Product Type
  productType: ProductType;
  salesUnit: SalesUnit;
  
  // Weight-based product fields
  usesScale?: boolean;
  pricePerKg?: number;
  
  // Generic button fields
  isGenericButton?: boolean;
  genericDefaultPrice?: number;
  
  // Inventory
  trackInventory?: boolean;
  stockLevel?: number;
  minStockLevel?: number;
  reorderPoint?: number;
  
  // VAT
  vatCategoryId?: string;
  vatOverridePercent?: number;
  
  // Expiry tracking
  hasExpiry?: boolean;
  shelfLifeDays?: number;
  requiresBatchTracking?: boolean;
  stockRotationMethod?: StockRotationMethod;
  
  // Age restriction
  ageRestrictionLevel?: AgeRestrictionLevel;
  requireIdScan?: boolean;
  restrictionReason?: string;
  
  // Settings
  isActive: boolean;
  allowPriceOverride?: boolean;
  allowDiscount?: boolean;
  
  // Media
  image?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Stock adjustment record
 */
export interface StockAdjustment {
  id: string;
  productId: string;
  type: 'add' | 'remove' | 'sale' | 'waste' | 'adjustment';
  quantity: number;
  reason: string;
  userId: string;
  businessId: string;
  timestamp: string;
}

/**
 * Request type for creating a product
 */
export interface CreateProductRequest {
  name: string;
  description?: string;
  basePrice: number;
  costPrice?: number;
  taxRate?: number;
  sku: string;
  barcode?: string;
  plu?: string;
  image?: string;
  categoryId: string;
  productType?: ProductType;
  salesUnit?: SalesUnit;
  usesScale?: boolean;
  pricePerKg?: number;
  isGenericButton?: boolean;
  genericDefaultPrice?: number;
  trackInventory?: boolean;
  stockLevel?: number;
  minStockLevel?: number;
  reorderPoint?: number;
  vatCategoryId?: string;
  vatOverridePercent?: number;
  businessId: string;
  isActive?: boolean;
  allowPriceOverride?: boolean;
  allowDiscount?: boolean;
  hasExpiry?: boolean;
  shelfLifeDays?: number;
  requiresBatchTracking?: boolean;
  stockRotationMethod?: StockRotationMethod;
  ageRestrictionLevel?: AgeRestrictionLevel;
  requireIdScan?: boolean;
  restrictionReason?: string;
}

/**
 * Response type for product operations
 */
export interface ProductResponse {
  success: boolean;
  message: string;
  product?: Product;
  products?: Product[];
  adjustment?: StockAdjustment;
  adjustments?: StockAdjustment[];
  errors?: string[];
}
