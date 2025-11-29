/**
 * Cart API Types
 * 
 * Types for cart session and cart item operations.
 * 
 * @module types/api/cart
 */

import type { APIResponse } from './common';
import type { CartSessionStatus } from '../enums/cart-status';
import type { VerificationMethod } from '../enums/verification-method';
import type { AgeRestrictionLevel } from '../enums/age-restriction';
import type { CartItemType } from '../features/cart';

export interface CartAPI {
  // Cart Session Operations
  createSession: (sessionData: {
    cashierId: string;
    shiftId: string;
    businessId: string;
    stationId?: string;
  }) => Promise<APIResponse>;

  getSession: (sessionId: string) => Promise<APIResponse>;
  getSessionWithItems: (sessionId: string) => Promise<APIResponse>;
  getActiveSession: (cashierId: string) => Promise<APIResponse>;

  updateSession: (
    sessionId: string,
    updates: {
      status?: CartSessionStatus;
      totalAmount?: number;
      taxAmount?: number;
      customerAgeVerified?: boolean;
      verificationMethod?: VerificationMethod;
      verifiedBy?: string;
      completedAt?: Date | string;
    }
  ) => Promise<APIResponse>;

  completeSession: (sessionId: string) => Promise<APIResponse>;
  cancelSession: (sessionId: string) => Promise<APIResponse>;

  // Cart Item Operations
  addItem: (itemData: {
    cartSessionId: string;
    productId?: string;
    categoryId?: string;
    itemName?: string;
    itemType: CartItemType;
    quantity?: number;
    weight?: number;
    unitOfMeasure?: string;
    unitPrice: number;
    totalPrice: number;
    taxAmount: number;
    batchId?: string;
    batchNumber?: string;
    expiryDate?: Date | string;
    ageRestrictionLevel?: AgeRestrictionLevel;
    ageVerified?: boolean;
    scaleReadingWeight?: number;
    scaleReadingStable?: boolean;
  }) => Promise<APIResponse>;

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
  ) => Promise<APIResponse>;

  removeItem: (itemId: string) => Promise<APIResponse>;
  getItems: (sessionId: string) => Promise<APIResponse>;
  getItem: (itemId: string) => Promise<APIResponse>;
}
