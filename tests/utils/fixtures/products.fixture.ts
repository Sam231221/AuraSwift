/**
 * Product Test Fixtures
 *
 * Factory functions for creating test product data with sensible defaults.
 * Use these fixtures in tests to avoid hardcoding test data.
 *
 * @example
 * ```ts
 * const product = createMockProduct({ name: 'Custom Product', price: 29.99 });
 * const products = createMockProducts(10); // Create 10 products
 * ```
 */

// TODO: Replace with actual Product type from your codebase
// import type { Product } from '@/types/domain/product';
type Product = {
  id: string;
  name: string;
  description?: string;
  barcode: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock?: number;
  maxStock?: number;
  categoryId: string;
  vatCategoryId: string;
  supplierId?: string;
  sku: string;
  requiresAgeVerification: boolean;
  ageRestriction: number | null;
  isWeighed: boolean;
  weightUnit?: string;
  isActive: boolean;
  imageUrl?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  hasBatchTracking?: boolean;
  hasExpiryDate?: boolean;
  [key: string]: any; // Allow additional properties
};

/**
 * Create a single mock product with optional overrides
 */
export function createMockProduct(overrides?: Partial<Product>): Product {
  const id =
    overrides?.id ||
    `product-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    name: overrides?.name || "Test Product",
    description: overrides?.description || "A test product description",
    barcode: overrides?.barcode || generateBarcode(),
    price: overrides?.price ?? 19.99,
    costPrice: overrides?.costPrice ?? 10.0,
    stock: overrides?.stock ?? 100,
    minStock: overrides?.minStock ?? 10,
    maxStock: overrides?.maxStock ?? 500,
    categoryId: overrides?.categoryId || "category-test-1",
    vatCategoryId: overrides?.vatCategoryId || "vat-standard",
    supplierId: overrides?.supplierId || "supplier-test-1",
    sku: overrides?.sku || `SKU-${id}`,
    requiresAgeVerification: overrides?.requiresAgeVerification ?? false,
    ageRestriction: overrides?.ageRestriction || null,
    isWeighed: overrides?.isWeighed ?? false,
    weightUnit: overrides?.weightUnit || "kg",
    isActive: overrides?.isActive ?? true,
    imageUrl: overrides?.imageUrl || `https://example.com/products/${id}.jpg`,
    tags: overrides?.tags || [],
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    createdBy: overrides?.createdBy || "test-user",
    updatedBy: overrides?.updatedBy || "test-user",
    ...overrides,
  };
}

/**
 * Create multiple mock products
 */
export function createMockProducts(
  count: number,
  baseOverrides?: Partial<Product>
): Product[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProduct({
      id: `product-${i}`,
      name: `${baseOverrides?.name || "Product"} ${i + 1}`,
      barcode: generateBarcode(i),
      price: (baseOverrides?.price ?? 10) + i,
      ...baseOverrides,
    })
  );
}

/**
 * Create a mock product with age restriction (e.g., alcohol, tobacco)
 */
export function createAgeRestrictedProduct(
  age: number = 18,
  overrides?: Partial<Product>
): Product {
  return createMockProduct({
    requiresAgeVerification: true,
    ageRestriction: age,
    name: "Age Restricted Product",
    ...overrides,
  });
}

/**
 * Create a mock product that requires weighing
 */
export function createWeighedProduct(overrides?: Partial<Product>): Product {
  return createMockProduct({
    isWeighed: true,
    weightUnit: "kg",
    price: 5.99, // Price per kg
    name: "Weighed Product",
    ...overrides,
  });
}

/**
 * Create a mock product with low stock
 */
export function createLowStockProduct(overrides?: Partial<Product>): Product {
  return createMockProduct({
    stock: 5,
    minStock: 10,
    name: "Low Stock Product",
    ...overrides,
  });
}

/**
 * Create a mock product that is out of stock
 */
export function createOutOfStockProduct(overrides?: Partial<Product>): Product {
  return createMockProduct({
    stock: 0,
    name: "Out of Stock Product",
    ...overrides,
  });
}

/**
 * Create a mock product with batch/expiry tracking
 */
export function createBatchTrackedProduct(
  overrides?: Partial<Product>
): Product {
  return createMockProduct({
    name: "Batch Tracked Product",
    hasBatchTracking: true,
    hasExpiryDate: true,
    ...overrides,
  });
}

/**
 * Helper: Generate a valid EAN-13 barcode
 */
function generateBarcode(
  seed: number = Math.floor(Math.random() * 100000000)
): string {
  const base = String(seed).padStart(12, "0").slice(0, 12);

  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return base + checkDigit;
}

/**
 * Barcode constants for common test scenarios
 */
export const TEST_BARCODES = {
  VALID: "5901234123457",
  AGE_RESTRICTED: "5901234567890",
  WEIGHED: "2100000000000", // PLU code format
  LOW_STOCK: "5901234111111",
  OUT_OF_STOCK: "5901234000000",
  NON_EXISTENT: "0000000000000",
  INVALID: "INVALID_BARCODE",
} as const;
