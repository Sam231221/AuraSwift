/**
 * Seeding Configuration & Presets
 *
 * This module handles seeding of categories and products only.
 * Basic system data (users, roles, business, terminal) is handled
 * separately in packages/main/src/database/seed.ts
 *
 * @module seed-data/config
 */

/**
 * Seed configuration interface
 */
export interface SeedConfig {
  /** Number of categories to generate */
  categories: number;
  /** Number of products to generate */
  products: number;
  /** Batch size for database inserts (larger = faster but more memory) */
  batchSize: number;
  /** Whether to clear existing categories and products before seeding */
  clearExisting: boolean;
}

export const SEED_PRESETS = {
  /** Minimal data for basic testing (fast) */
  minimal: {
    categories: 50,
    products: 500,
    batchSize: 100,
    clearExisting: false,
  } as SeedConfig,

  /** Small dataset for quick tests */
  small: {
    categories: 200,
    products: 2000,
    batchSize: 200,
    clearExisting: false,
  } as SeedConfig,

  /** Medium dataset for realistic testing */
  medium: {
    categories: 1000,
    products: 10000,
    batchSize: 500,
    clearExisting: false,
  } as SeedConfig,

  /** Large dataset for stress testing */
  large: {
    categories: 5000,
    products: 30000,
    batchSize: 500,
    clearExisting: false,
  } as SeedConfig,

  /** Extra large for maximum stress testing */
  xlarge: {
    categories: 10000,
    products: 60000,
    batchSize: 1000,
    clearExisting: false,
  } as SeedConfig,
} as const;

export type SeedPreset = keyof typeof SEED_PRESETS;

/**
 * Get configuration by preset name
 */
export function getPresetConfig(preset: SeedPreset): SeedConfig {
  return SEED_PRESETS[preset];
}

/**
 * Category templates for realistic supermarket data
 */
export const CATEGORY_TEMPLATES = [
  { name: "Fresh Produce", color: "#4CAF50", ageRestriction: "NONE" },
  { name: "Meat & Seafood", color: "#E91E63", ageRestriction: "NONE" },
  { name: "Dairy & Eggs", color: "#2196F3", ageRestriction: "NONE" },
  { name: "Bakery", color: "#FF9800", ageRestriction: "NONE" },
  { name: "Beverages", color: "#00BCD4", ageRestriction: "NONE" },
  { name: "Alcohol", color: "#9C27B0", ageRestriction: "AGE_21" },
  { name: "Tobacco Products", color: "#795548", ageRestriction: "AGE_18" },
  { name: "Frozen Foods", color: "#607D8B", ageRestriction: "NONE" },
  { name: "Snacks & Candy", color: "#FFC107", ageRestriction: "NONE" },
  { name: "Canned & Jarred", color: "#8BC34A", ageRestriction: "NONE" },
  { name: "Household & Cleaning", color: "#03A9F4", ageRestriction: "NONE" },
  { name: "Personal Care", color: "#E91E63", ageRestriction: "NONE" },
  { name: "Health & Pharmacy", color: "#F44336", ageRestriction: "NONE" },
  { name: "Baby & Kids", color: "#FFEB3B", ageRestriction: "NONE" },
  { name: "Pet Supplies", color: "#9E9E9E", ageRestriction: "NONE" },
];

/**
 * Product type distribution for realistic inventory
 */
export const PRODUCT_TYPE_DISTRIBUTION = {
  STANDARD: 0.7, // 70% standard products
  WEIGHTED: 0.2, // 20% weighted products (produce, deli)
  GENERIC: 0.1, // 10% generic products (bulk items)
} as const;
