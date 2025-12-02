/**
 * Price calculation utilities
 */

import type { Product } from "@/types/domain";
import type { CartItemWithProduct } from "@/types/features/cart";
import {
  isWeightedProduct,
  getProductPrice,
  getProductPricePerKg,
  getProductTaxRate,
} from "./product-helpers";

/**
 * Calculate item price for a product
 * @param product - The product to calculate price for
 * @param weight - Optional weight for weighted products
 * @param customPrice - Optional custom price override
 * @returns Object with unitPrice, subtotal, taxAmount, and totalPrice
 */
export function calculateItemPrice(
  product: Product,
  weight?: number,
  customPrice?: number
): {
  unitPrice: number;
  subtotal: number;
  taxAmount: number;
  totalPrice: number;
} {
  const isWeighted = isWeightedProduct(product);
  const basePrice = getProductPrice(product);
  const pricePerKg = getProductPricePerKg(product);
  const taxRate = getProductTaxRate(product);

  let unitPrice: number;
  let subtotal: number;

  if (isWeighted) {
    // For weighted items, use pricePerKg if available, otherwise basePrice
    unitPrice = pricePerKg ?? basePrice;
    if (!weight || weight <= 0) {
      throw new Error("Weight is required for weighted items");
    }
    subtotal = unitPrice * weight;
  } else {
    // For unit items, use customPrice if provided, otherwise basePrice
    unitPrice = customPrice ?? basePrice;
    subtotal = unitPrice * 1; // Default quantity 1
  }

  // Calculate tax
  const taxAmount = subtotal * taxRate;
  const totalPrice = subtotal + taxAmount;

  // Validate calculations
  if (!unitPrice || unitPrice <= 0) {
    throw new Error("Invalid price for product. Please check product pricing.");
  }

  if (!totalPrice || totalPrice <= 0) {
    throw new Error("Invalid total price calculation. Please try again.");
  }

  if (taxAmount < 0) {
    throw new Error("Invalid tax calculation. Please try again.");
  }

  return {
    unitPrice,
    subtotal,
    taxAmount,
    totalPrice,
  };
}

/**
 * Calculate category item price
 * @param price - The price entered for the category
 * @param taxRate - Tax rate (defaults to 8%)
 * @returns Object with unitPrice, subtotal, taxAmount, and totalPrice
 */
export function calculateCategoryPrice(
  price: number,
  taxRate: number = 0.08
): {
  unitPrice: number;
  subtotal: number;
  taxAmount: number;
  totalPrice: number;
} {
  const unitPrice = price;
  const subtotal = unitPrice * 1; // Quantity is always 1 for categories
  const taxAmount = subtotal * taxRate;
  const totalPrice = subtotal + taxAmount;

  // Validate price
  if (!unitPrice || unitPrice <= 0) {
    throw new Error("Invalid price. Please enter a valid amount.");
  }

  if (!totalPrice || totalPrice <= 0) {
    throw new Error("Invalid total price calculation. Please try again.");
  }

  return {
    unitPrice,
    subtotal,
    taxAmount,
    totalPrice,
  };
}

/**
 * Calculate cart totals from cart items
 *
 * Note: item.totalPrice already includes tax (subtotal + taxAmount),
 * so we need to extract the true subtotal by subtracting taxAmount.
 *
 * @param items - Array of cart items
 * @returns Object with subtotal (before tax), tax, and total (subtotal + tax)
 */
export function calculateCartTotals(items: CartItemWithProduct[]): {
  subtotal: number;
  tax: number;
  total: number;
} {
  // Calculate true subtotal (before tax) by extracting tax from each item's totalPrice
  const subtotal = items.reduce((sum, item) => {
    // item.totalPrice = itemSubtotal + itemTaxAmount
    // itemSubtotal = item.totalPrice - item.taxAmount
    const itemSubtotal = item.totalPrice - (item.taxAmount || 0);
    return sum + itemSubtotal;
  }, 0);

  // Sum all item tax amounts
  const tax = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);

  // Total is subtotal + tax
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
  };
}
