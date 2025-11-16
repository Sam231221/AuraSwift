import { ipcRenderer } from "electron";

export const productAPI = {
  create: (productData: {
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
    modifiers?: any[];
    // Weight-based product fields
    requiresWeight?: boolean;
    unit?: "lb" | "kg" | "oz" | "g" | "each";
    pricePerUnit?: number;
  }) => ipcRenderer.invoke("products:create", productData),

  getByBusiness: (businessId: string) =>
    ipcRenderer.invoke("products:getByBusiness", businessId),

  getById: (id: string) => ipcRenderer.invoke("products:getById", id),

  update: (id: string, updates: any) =>
    ipcRenderer.invoke("products:update", id, updates),

  delete: (id: string) => ipcRenderer.invoke("products:delete", id),

  createModifier: (modifierData: {
    name: string;
    type: "single" | "multiple";
    required: boolean;
    businessId: string;
    options: { name: string; price: number }[];
  }) => ipcRenderer.invoke("modifiers:create", modifierData),

  adjustStock: (adjustmentData: {
    productId: string;
    type: "add" | "remove" | "sale" | "waste" | "adjustment";
    quantity: number;
    reason: string;
    userId: string;
    businessId: string;
  }) => ipcRenderer.invoke("stock:adjust", adjustmentData),

  getStockAdjustments: (productId: string) =>
    ipcRenderer.invoke("stock:getAdjustments", productId),
};
