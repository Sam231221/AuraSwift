declare global {
  interface Window {
    authStore: {
      set: (key: string, value: string) => Promise<void>;
      get: (key: string) => Promise<string | null>;
      delete: (key: string) => Promise<void>;
    };
    authAPI: {
      register: (userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        businessName: string;
        role: "cashier" | "manager" | "admin";
      }) => Promise<{ success: boolean; message: string }>;
      login: (credentials: {
        email: string;
        password: string;
        rememberMe?: boolean;
      }) => Promise<{ token: string; user: { id: string; name: string } }>;
      validateSession: (token: string) => Promise<boolean>;
      logout: (token: string) => Promise<void>;
      getUserById: (
        userId: string
      ) => Promise<{ id: string; name: string; email: string }>;
      updateUser: (
        userId: string,
        updates: { name?: string; email?: string }
      ) => Promise<{ success: boolean; message: string }>;
    };
    productAPI: {
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
      }) => Promise<{
        success: boolean;
        message: string;
        product?: import("../types/product.types").Product;
      }>;
      getByBusiness: (
        businessId: string
      ) => Promise<{
        success: boolean;
        products?: import("../types/product.types").Product[];
      }>;
      getById: (
        id: string
      ) => Promise<{
        success: boolean;
        product?: import("../types/product.types").Product;
      }>;
      update: (
        id: string,
        updates: Partial<{
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
        }>
      ) => Promise<{
        success: boolean;
        message: string;
        product?: import("../types/product.types").Product;
      }>;
      delete: (id: string) => Promise<{ success: boolean; message: string }>;
      createModifier: (modifierData: {
        name: string;
        type: "single" | "multiple";
        required: boolean;
        businessId: string;
        options: { name: string; price: number }[];
      }) => Promise<{
        success: boolean;
        message: string;
        modifier?: import("../types/product.types").Modifier;
      }>;
      adjustStock: (adjustmentData: {
        productId: string;
        type: "add" | "remove" | "sale" | "waste" | "adjustment";
        quantity: number;
        reason: string;
        userId: string;
        businessId: string;
      }) => Promise<{ success: boolean; message: string }>;
      getStockAdjustments: (
        productId: string
      ) => Promise<{
        success: boolean;
        adjustments?: import("../types/product.types").StockAdjustment[];
      }>;
    };
  }
}

export {};
