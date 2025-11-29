/**
 * Cart Feature Types
 * 
 * Types for cart sessions, cart items, and age verification.
 * Supports both UNIT and WEIGHT item types, batch tracking, and scale integration.
 * 
 * @module types/features/cart
 */

import type { Product } from '../../domain/product';
import type { AgeRestrictionLevel } from '../../enums/age-restriction';
import type { VerificationMethod } from '../../enums/verification-method';
import type { CartSessionStatus } from '../../enums/cart-status';

/**
 * Item Type - UNIT for countable items, WEIGHT for items sold by weight
 */
export type CartItemType = 'UNIT' | 'WEIGHT';

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
 * Supports both product items (productId) and category items (categoryId)
 */
export interface CartItem {
  id: string;
  cartSessionId: string;
  
  // Item source: either a product OR a category (mutually exclusive)
  productId?: string;
  categoryId?: string;
  itemName?: string; // For category items or when product is deleted
  product?: Product; // Populated when fetching with relations (only for product items)
  
  // Item type and quantity
  itemType: CartItemType;
  quantity?: number; // For UNIT items
  weight?: number; // For WEIGHT items (kg)
  unitOfMeasure?: string; // 'kg', 'g', 'lb', etc.
  
  // Pricing
  unitPrice: number; // Price per unit/kg
  totalPrice: number; // Calculated total
  taxAmount: number;
  
  // Batch tracking (for expiry) - only for product items
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
 * Either productId OR categoryId must be provided (mutually exclusive)
 */
export interface CreateCartItemRequest {
  cartSessionId: string;
  // Either productId OR categoryId must be provided
  productId?: string;
  categoryId?: string;
  itemName?: string; // For category items or when product is deleted
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

/**
 * Age Verification Record (database entity)
 */
export interface AgeVerificationRecord {
  id: string;
  transactionId?: string;
  transactionItemId?: string;
  productId: string;
  verificationMethod: VerificationMethod;
  customerBirthdate?: Date | string;
  calculatedAge?: number;
  idScanData?: Record<string, unknown>;
  verifiedBy: string;
  managerOverrideId?: string;
  overrideReason?: string;
  businessId: string;
  verifiedAt: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
