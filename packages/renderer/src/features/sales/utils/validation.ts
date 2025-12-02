/**
 * Validation utilities
 */

import type { CartItemWithProduct } from "@/types/features/cart";

/**
 * Validate cash payment
 * @param cashAmount - Amount of cash received
 * @param total - Total amount due
 * @returns Object with valid flag and optional error message
 */
export function validateCashPayment(
  cashAmount: number,
  total: number
): {
  valid: boolean;
  error?: string;
} {
  if (cashAmount < total) {
    return {
      valid: false,
      error: `Insufficient cash. Need £${(total - cashAmount).toFixed(
        2
      )} more.`,
    };
  }

  if (cashAmount <= 0) {
    return {
      valid: false,
      error: "Please enter a valid cash amount",
    };
  }

  return { valid: true };
}

/**
 * Validate cart
 * @param cartItems - Array of cart items
 * @returns Object with valid flag and optional error message
 */
export function validateCart(cartItems: CartItemWithProduct[]): {
  valid: boolean;
  error?: string;
} {
  if (cartItems.length === 0) {
    return {
      valid: false,
      error: "Cart is empty",
    };
  }

  // Validate each item has valid pricing
  for (const item of cartItems) {
    if (!item.totalPrice || item.totalPrice <= 0) {
      return {
        valid: false,
        error: `Invalid price for item: ${item.itemName || "Unknown"}`,
      };
    }

    if (item.taxAmount < 0) {
      return {
        valid: false,
        error: `Invalid tax for item: ${item.itemName || "Unknown"}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate business ID
 * @param businessId - Business ID to validate
 * @returns Object with valid flag and optional error message
 */
export function validateBusinessId(businessId: string | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!businessId) {
    return {
      valid: false,
      error: "No business ID found",
    };
  }

  return { valid: true };
}
