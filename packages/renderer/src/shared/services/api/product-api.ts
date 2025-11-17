/**
 * Product API Service
 * Abstraction layer for product-related API calls
 */

import type { Product } from "@/features/products/types/product.types";

export interface CreateProductData {
  name: string;
  description?: string;
  basePrice: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  plu?: string;
  image?: string;
  categoryId: string;
  productType?: "STANDARD" | "WEIGHTED" | "GENERIC";
  salesUnit?: "PIECE" | "KG" | "GRAM" | "LITRE" | "ML" | "PACK";
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
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  costPrice?: number;
  taxRate?: number;
  sku?: string;
  plu?: string;
  image?: string;
  category?: string;
  stockLevel?: number;
  minStockLevel?: number;
}

export interface ProductAPIResponse {
  success: boolean;
  message: string;
  product?: Product;
}

/**
 * Product API Service
 */
export const productAPI = {
  /**
   * Create a new product
   */
  create: async (
    productData: CreateProductData
  ): Promise<ProductAPIResponse> => {
    if (!window.productAPI) {
      throw new Error("Product API not available");
    }
    return window.productAPI.create(productData);
  },

  /**
   * Get products by business ID
   */
  getByBusiness: async (businessId: string) => {
    if (!window.productAPI) {
      throw new Error("Product API not available");
    }
    return window.productAPI.getByBusiness(businessId);
  },

  /**
   * Get product by ID
   */
  getById: async (id: string) => {
    if (!window.productAPI) {
      throw new Error("Product API not available");
    }
    return window.productAPI.getById(id);
  },

  /**
   * Update product
   */
  update: async (
    id: string,
    updates: UpdateProductData
  ): Promise<ProductAPIResponse> => {
    if (!window.productAPI) {
      throw new Error("Product API not available");
    }
    return window.productAPI.update(id, updates);
  },

  /**
   * Delete product
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    if (!window.productAPI) {
      throw new Error("Product API not available");
    }
    return window.productAPI.delete(id);
  },
};

