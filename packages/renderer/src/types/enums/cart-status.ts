/**
 * Cart Status Types
 * 
 * @module types/enums/cart-status
 */

export type CartSessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export const CART_STATUSES: Record<CartSessionStatus, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;
