/**
 * Cart and Cart Item Types
 * 
 * These types correspond to the database schema for cart_sessions and cart_items tables.
 * They support both UNIT and WEIGHT item types, batch tracking, age restrictions, and scale integration.
 */

import type { Product } from "@/features/products/types/product.types";

/**
 * Cart Session Status
 */
export type CartSessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

/**
 * Item Type - UNIT for countable items, WEIGHT for items sold by weight
 */
export type CartItemType = "UNIT" | "WEIGHT";

/**
 * Age Restriction Levels
 */
export type AgeRestrictionLevel = "NONE" | "AGE_16" | "AGE_18" | "AGE_21";

/**
 * Verification Method for age-restricted items
 */
export type VerificationMethod = "NONE" | "MANUAL" | "SCAN" | "OVERRIDE";

/**
 * Cart Session - Represents an active shopping cart before payment
 */
export interface CartSession {
  id: string;
  cashierId: string;
  shiftId: string;
  businessId: string;
  stationId?: string;
  status: CartSessionStatus;
  totalAmount: number;
  taxAmount: number;
  customerAgeVerified: boolean;
  verificationMethod: VerificationMethod;
  verifiedBy?: string;
  completedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Cart Item - Individual item in a cart session
 */
export interface CartItem {
  id: string;
  cartSessionId: string;
  productId: string;
  product?: Product; // Populated when fetching with relations
  
  // Item type and quantity
  itemType: CartItemType;
  quantity?: number; // For UNIT items
  weight?: number; // For WEIGHT items (kg)
  unitOfMeasure?: string; // 'kg', 'g', 'lb', etc.
  
  // Pricing
  unitPrice: number; // Price per unit/kg
  totalPrice: number; // Calculated total
  taxAmount: number;
  
  // Batch tracking (for expiry)
  batchId?: string;
  batchNumber?: string;
  expiryDate?: Date | string;
  
  // Age restriction tracking
  ageRestrictionLevel: AgeRestrictionLevel;
  ageVerified: boolean;
  
  // Scale data (for weighted items audit)
  scaleReadingWeight?: number;
  scaleReadingStable: boolean;
  
  // Timestamps
  addedAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Cart Item with Product - Cart item with populated product data
 */
export interface CartItemWithProduct extends CartItem {
  product: Product;
}

/**
 * Create Cart Session Request
 */
export interface CreateCartSessionRequest {
  cashierId: string;
  shiftId: string;
  businessId: string;
  stationId?: string;
}

/**
 * Create Cart Item Request
 */
export interface CreateCartItemRequest {
  cartSessionId: string;
  productId: string;
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
}

/**
 * Update Cart Item Request
 */
export interface UpdateCartItemRequest {
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

/**
 * Cart Session with Items - Complete cart data with all items
 */
export interface CartSessionWithItems extends CartSession {
  items: CartItemWithProduct[];
}

/**
 * Cart Summary - Calculated totals and statistics
 */
export interface CartSummary {
  itemCount: number;
  unitItemCount: number;
  weightItemCount: number;
  totalWeight: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  hasAgeRestrictedItems: boolean;
  requiresAgeVerification: boolean;
  hasExpiringItems: boolean;
}

/**
 * Age Verification Data
 */
export interface AgeVerificationData {
  customerBirthdate?: Date | string;
  calculatedAge?: number;
  verificationMethod: VerificationMethod;
  verifiedBy?: string;
  idScanData?: Record<string, unknown>;
  overrideReason?: string;
  managerOverrideId?: string;
}

