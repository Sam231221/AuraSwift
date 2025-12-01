/**
 * Sales Unit Types
 *
 * Shared type definitions for sales unit functionality
 */

export type SalesUnitMode = "Fixed" | "Varying";

export type SalesUnit = "PIECE" | "KG" | "GRAM" | "LITRE" | "ML" | "PACK";

export interface SalesUnitSettings {
  mode: SalesUnitMode;
  fixedUnit: SalesUnit;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Database model for sales unit settings
 */
export interface SalesUnitSetting {
  id: string;
  businessId: string;
  salesUnitMode: SalesUnitMode;
  fixedSalesUnit: SalesUnit;
  createdAt: Date | string | number;
  updatedAt: Date | string | number | null;
}

export const SALES_UNIT_OPTIONS: readonly {
  value: SalesUnit;
  label: string;
}[] = [
  { value: "PIECE", label: "Piece" },
  { value: "KG", label: "Kilogram (KG)" },
  { value: "GRAM", label: "Gram (GRAM)" },
  { value: "LITRE", label: "Litre (LITRE)" },
  { value: "ML", label: "Milliliter (ML)" },
  { value: "PACK", label: "Pack" },
] as const;

export const DEFAULT_SALES_UNIT_MODE: SalesUnitMode = "Varying";
export const DEFAULT_FIXED_SALES_UNIT: SalesUnit = "KG";
export const DEFAULT_PRODUCT_SALES_UNIT: SalesUnit = "PIECE";

/**
 * Validate if a string is a valid SalesUnitMode
 */
export function isValidSalesUnitMode(value: string): value is SalesUnitMode {
  return value === "Fixed" || value === "Varying";
}

/**
 * Validate if a string is a valid SalesUnit
 */
export function isValidSalesUnit(value: string): value is SalesUnit {
  return SALES_UNIT_OPTIONS.some((option) => option.value === value);
}
