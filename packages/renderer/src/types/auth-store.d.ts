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
        // Expiry tracking fields
        hasExpiry?: boolean;
        shelfLifeDays?: number;
        requiresBatchTracking?: boolean;
        stockRotationMethod?: "FIFO" | "FEFO" | "NONE";
        // Age restriction fields
        ageRestrictionLevel?: "NONE" | "AGE_16" | "AGE_18" | "AGE_21";
        requireIdScan?: boolean;
        restrictionReason?: string;
      }) => Promise<{
        success: boolean;
        message: string;
        product?: import("../types/product.types").Product;
      }>;
      getByBusiness: (businessId: string) => Promise<{
        success: boolean;
        products?: import("../types/product.types").Product[];
      }>;
      getById: (id: string) => Promise<{
        success: boolean;
        product?: import("../types/product.types").Product;
      }>;
      update: (
        id: string,
        updates: Partial<{
          name: string;
          description: string;
          basePrice: number;
          costPrice: number;
          sku: string;
          barcode: string;
          plu: string;
          image: string;
          categoryId: string;
          productType: "STANDARD" | "WEIGHTED" | "GENERIC";
          salesUnit: "PIECE" | "KG" | "GRAM" | "LITRE" | "ML" | "PACK";
          usesScale: boolean;
          pricePerKg: number;
          isGenericButton: boolean;
          genericDefaultPrice: number;
          trackInventory: boolean;
          stockLevel: number;
          minStockLevel: number;
          reorderPoint: number;
          vatCategoryId: string;
          vatOverridePercent: number;
          isActive: boolean;
          allowPriceOverride: boolean;
          allowDiscount: boolean;
          // Expiry tracking fields
          hasExpiry?: boolean;
          shelfLifeDays?: number;
          requiresBatchTracking?: boolean;
          stockRotationMethod?: "FIFO" | "FEFO" | "NONE";
          // Age restriction fields
          ageRestrictionLevel?: "NONE" | "AGE_16" | "AGE_18" | "AGE_21";
          requireIdScan?: boolean;
          restrictionReason?: string;
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
      getStockAdjustments: (productId: string) => Promise<{
        success: boolean;
        adjustments?: import("../types/product.types").StockAdjustment[];
      }>;
    };
    batchAPI: {
      create: (batchData: {
        productId: string;
        batchNumber?: string;
        manufacturingDate?: string;
        expiryDate: string;
        initialQuantity: number;
        currentQuantity: number;
        supplierId?: string;
        purchaseOrderNumber?: string;
        costPrice?: number;
        businessId: string;
      }) => Promise<{
        success: boolean;
        message?: string;
        batch?: import("../features/products/types/batch.types").ProductBatch;
        error?: string;
      }>;
      update: (
        batchId: string,
        updates: {
          batchNumber?: string;
          manufacturingDate?: string;
          expiryDate?: string;
          currentQuantity?: number;
          supplierId?: string;
          purchaseOrderNumber?: string;
          costPrice?: number;
          status?: "ACTIVE" | "EXPIRED" | "SOLD_OUT" | "REMOVED";
        }
      ) => Promise<{
        success: boolean;
        message?: string;
        batch?: import("../features/products/types/batch.types").ProductBatch;
        error?: string;
      }>;
      delete: (batchId: string) => Promise<{
        success: boolean;
        message?: string;
        error?: string;
      }>;
      getByBusiness: (businessId: string, productId?: string) => Promise<{
        success: boolean;
        batches?: import("../features/products/types/batch.types").ProductBatch[];
        error?: string;
      }>;
      getById: (batchId: string) => Promise<{
        success: boolean;
        batch?: import("../features/products/types/batch.types").ProductBatch;
        error?: string;
      }>;
      adjustStock: (adjustmentData: {
        batchId: string;
        quantity: number;
        reason: string;
        userId: string;
        businessId: string;
      }) => Promise<{
        success: boolean;
        message?: string;
        error?: string;
      }>;
    };
    supplierAPI: {
      create: (supplierData: {
        name: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
        address?: string;
        businessId: string;
      }) => Promise<{
        success: boolean;
        message?: string;
        supplier?: import("../features/products/types/batch.types").Supplier;
        error?: string;
      }>;
      update: (
        supplierId: string,
        updates: {
          name?: string;
          contactPerson?: string;
          email?: string;
          phone?: string;
          address?: string;
          isActive?: boolean;
        }
      ) => Promise<{
        success: boolean;
        message?: string;
        supplier?: import("../features/products/types/batch.types").Supplier;
        error?: string;
      }>;
      delete: (supplierId: string) => Promise<{
        success: boolean;
        message?: string;
        error?: string;
      }>;
      getByBusiness: (businessId: string) => Promise<{
        success: boolean;
        suppliers?: import("../features/products/types/batch.types").Supplier[];
        error?: string;
      }>;
    };
    expirySettingsAPI: {
      get: (businessId: string) => Promise<{
        success: boolean;
        settings?: import("../features/products/types/batch.types").ExpirySettings;
        error?: string;
      }>;
      update: (
        businessId: string,
        settings: Partial<{
          criticalAlertDays: number;
          warningAlertDays: number;
          infoAlertDays: number;
          notifyViaEmail: boolean;
          notifyViaPush: boolean;
          notifyViaDashboard: boolean;
          autoDisableExpired: boolean;
          allowSellNearExpiry: boolean;
          nearExpiryThreshold: number;
          notificationRecipients: string[];
        }>
      ) => Promise<{
        success: boolean;
        message?: string;
        settings?: import("../features/products/types/batch.types").ExpirySettings;
        error?: string;
      }>;
    };
    expiryNotificationsAPI: {
      get: (businessId: string, status?: string) => Promise<{
        success: boolean;
        notifications?: import("../features/products/types/batch.types").ExpiryNotification[];
        alerts?: import("../features/products/types/batch.types").ExpiryAlert[];
        error?: string;
      }>;
      acknowledge: (notificationId: string, userId: string) => Promise<{
        success: boolean;
        message?: string;
        error?: string;
      }>;
    };
    categoryAPI: {
      create: (categoryData: {
        name: string;
        description?: string;
        businessId: string;
        sortOrder?: number;
      }) => Promise<{
        success: boolean;
        message: string;
        category?: {
          id: string;
          name: string;
          description?: string;
          businessId: string;
          isActive: boolean;
          sortOrder: number;
          createdAt: string;
          updatedAt: string;
        };
      }>;
      getByBusiness: (businessId: string) => Promise<{
        success: boolean;
        categories?: Array<{
          id: string;
          name: string;
          description?: string;
          businessId: string;
          isActive: boolean;
          sortOrder: number;
          createdAt: string;
          updatedAt: string;
        }>;
      }>;
      getById: (id: string) => Promise<{
        success: boolean;
        category?: {
          id: string;
          name: string;
          description?: string;
          businessId: string;
          isActive: boolean;
          sortOrder: number;
          createdAt: string;
          updatedAt: string;
        };
      }>;
      update: (
        id: string,
        updates: {
          name?: string;
          description?: string;
          isActive?: boolean;
          sortOrder?: number;
        }
      ) => Promise<{
        success: boolean;
        message: string;
        category?: {
          id: string;
          name: string;
          description?: string;
          businessId: string;
          isActive: boolean;
          sortOrder: number;
          createdAt: string;
          updatedAt: string;
        };
      }>;
      delete: (id: string) => Promise<{ success: boolean; message: string }>;
      reorder: (
        businessId: string,
        categoryIds: string[]
      ) => Promise<{ success: boolean; message: string }>;
      getVatCategories: (businessId: string) => Promise<{
        success: boolean;
        vatCategories?: import("../../../../types/db").VatCategory[];
        message?: string;
      }>;
    };
  }
}

export {};
