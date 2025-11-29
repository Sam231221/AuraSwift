/**
 * Product helper utilities
 */

import type { Product } from "@/types/domain";

/**
 * Extended product type that supports both old and new schema fields
 */
type ExtendedProduct = Product & {
  productType?: "STANDARD" | "WEIGHTED" | "GENERIC";
  usesScale?: boolean;
  basePrice?: number;
  pricePerKg?: number;
  salesUnit?: string;
};

/**
 * Check if a product requires weight input
 * Supports both old field names (requiresWeight) and new schema fields (productType, usesScale)
 */
export function isWeightedProduct(product: Product): boolean {
  const extendedProduct = product as ExtendedProduct;
  return (
    extendedProduct.productType === "WEIGHTED" ||
    extendedProduct.usesScale === true ||
    product.requiresWeight === true
  );
}

/**
 * Get the appropriate price for a product
 * Returns basePrice if available, otherwise falls back to price
 */
export function getProductPrice(product: Product): number {
  const extendedProduct = product as ExtendedProduct;
  return extendedProduct.basePrice ?? product.price ?? 0;
}

/**
 * Get the price per unit/kg for weighted products
 */
export function getProductPricePerKg(product: Product): number | null {
  const extendedProduct = product as ExtendedProduct;
  return extendedProduct.pricePerKg ?? product.pricePerUnit ?? null;
}

/**
 * Get the sales unit for a product
 */
export function getProductSalesUnit(product: Product): string {
  const extendedProduct = product as ExtendedProduct;
  return extendedProduct.salesUnit ?? product.unit ?? "each";
}

/**
 * Check if a product requires age verification
 */
export function requiresAgeVerification(product: Product): boolean {
  return (
    product.ageRestrictionLevel !== undefined &&
    product.ageRestrictionLevel !== "NONE"
  );
}

/**
 * Get product tax rate (defaults to 8% if not available)
 */
export function getProductTaxRate(product: Product): number {
  return product.taxRate ?? 0.08;
}

