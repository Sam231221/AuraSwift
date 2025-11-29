/**
 * Cart API Types - Preload
 *
 * Type definitions for cart session and item management IPC APIs.
 *
 * @module preload/types/api/cart
 */

export interface CartAPIPreload {
  // Cart Session Operations
  createSession: (sessionData: {
    cashierId: string;
    shiftId: string;
    businessId: string;
    stationId?: string;
  }) => Promise<any>;

  getSession: (sessionId: string) => Promise<any>;

  getActiveSession: (cashierId: string) => Promise<any>;

  updateSession: (
    sessionId: string,
    updates: {
      status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
      totalAmount?: number;
      taxAmount?: number;
      customerAgeVerified?: boolean;
      verificationMethod?: "NONE" | "MANUAL" | "SCAN" | "OVERRIDE";
      verifiedBy?: string;
      completedAt?: Date | string;
    }
  ) => Promise<any>;

  completeSession: (sessionId: string) => Promise<any>;

  cancelSession: (sessionId: string) => Promise<any>;

  // Cart Item Operations
  addItem: (itemData: {
    cartSessionId: string;
    productId?: string;
    categoryId?: string;
    itemName?: string;
    itemType: "UNIT" | "WEIGHT";
    quantity?: number;
    weight?: number;
    unitOfMeasure?: string;
    unitPrice: number;
    totalPrice: number;
    taxAmount: number;
    batchId?: string;
    batchNumber?: string;
    expiryDate?: Date | string;
    ageRestrictionLevel?: "NONE" | "AGE_16" | "AGE_18" | "AGE_21";
    ageVerified?: boolean;
    scaleReadingWeight?: number;
    scaleReadingStable?: boolean;
  }) => Promise<any>;

  getItems: (sessionId: string) => Promise<any>;

  updateItem: (
    itemId: string,
    updates: {
      quantity?: number;
      weight?: number;
      unitPrice?: number;
      totalPrice?: number;
      taxAmount?: number;
      batchId?: string;
      batchNumber?: string;
      expiryDate?: Date | string;
      scaleReadingWeight?: number;
      scaleReadingStable?: boolean;
    }
  ) => Promise<any>;

  removeItem: (itemId: string) => Promise<any>;
}
