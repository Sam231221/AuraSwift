export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export interface Modifier {
  id: string;
  name: string;
  type: "single" | "multiple";
  multiSelect?: boolean; // Optional for backward compatibility
  options: ModifierOption[];
  required: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

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
  modifiers: Modifier[];
  isActive: boolean;
  // Weight-based product fields
  requiresWeight?: boolean;
  unit?: "lb" | "kg" | "oz" | "g" | "each";
  pricePerUnit?: number; // Price per weight unit (e.g., £1.99/lb)
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
}

export interface ProductResponse {
  success: boolean;
  message: string;
  product?: Product;
  products?: Product[];
  modifier?: Modifier;
  modifiers?: Modifier[];
  adjustment?: StockAdjustment;
  adjustments?: StockAdjustment[];
  errors?: string[];
}
