/**
 * Product helper utilities
 */

import type { Product } from "@/types/domain";

/**
 * Check if a product requires weight input
 */
export function isWeightedProduct(product: Product): boolean {
  return product.productType === "WEIGHTED" || product.usesScale === true;
}

/**
 * Get the appropriate price for a product
 */
export function getProductPrice(product: Product): number {
  return product.basePrice ?? 0;
}

/**
 * Get the price per unit/kg for weighted products
 */
export function getProductPricePerKg(product: Product): number | null {
  return product.pricePerKg ?? null;
}

/**
 * Get the sales unit for a product
 * Note: This function returns the product's own sales unit.
 * For the effective sales unit (considering fixed unit settings),
 * use getEffectiveSalesUnit from use-sales-unit-settings hook.
 */
export function getProductSalesUnit(product: Product): string {
  return product.salesUnit ?? "PIECE";
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

