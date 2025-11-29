export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  taxRate: number;
  sku: string;
  plu?: string;
  image?: string;
  category: string;
  stockLevel: number;
  minStockLevel: number;
  businessId: string;

  isActive: boolean;
  // Weight-based product fields
  requiresWeight?: boolean;
  unit?: "lb" | "kg" | "oz" | "g" | "each";
  pricePerUnit?: number; // Price per weight unit (e.g., £1.99/lb)
  // Age restriction fields
  ageRestrictionLevel?: "NONE" | "AGE_16" | "AGE_18" | "AGE_21";
  requireIdScan?: boolean;
  restrictionReason?: string;
  // Generic button fields
  isGenericButton?: boolean;
  genericDefaultPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  type: "add" | "remove" | "sale" | "waste" | "adjustment";
  quantity: number;
  reason: string;
  userId: string;
  businessId: string;
  timestamp: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  costPrice: number;
  taxRate: number;
  sku: string;
  plu?: string;
  image?: string;
  category: string;
  stockLevel: number;
  minStockLevel: number;
  businessId: string;
  // Weight-based product fields
  requiresWeight?: boolean;
  unit?: "lb" | "kg" | "oz" | "g" | "each";
  pricePerUnit?: number;
  // Age restriction fields
  ageRestrictionLevel?: "NONE" | "AGE_16" | "AGE_18" | "AGE_21";
  requireIdScan?: boolean;
  restrictionReason?: string;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  product?: Product;
  products?: Product[];
  adjustment?: StockAdjustment;
  adjustments?: StockAdjustment[];
  errors?: string[];
}
