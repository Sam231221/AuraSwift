/**
 * Product Validation Schema
 *
 * Validation schemas for product management forms.
 * Uses common schemas from shared/validation/common for consistency.
 */

import { z } from "zod";
import {
  requiredStringSchema,
  optionalStringSchema,
  skuSchema as commonSkuSchema,
  nonNegativeNumberSchema,
  percentageSchema,
  nonNegativeIntegerSchema,
  uuidSchema,
} from "@/shared/validation/common";

/**
 * PLU validation: alphanumeric only (optional)
 */
const pluSchema = z
  .string()
  .regex(/^[a-zA-Z0-9]*$/, "PLU can only contain letters and numbers")
  .trim()
  .optional()
  .or(z.literal(""));

/**
 * Sales unit validation
 */
export const salesUnitSchema = z.enum([
  "PIECE",
  "KG",
  "GRAM",
  "LITRE",
  "ML",
  "PACK",
]);

/**
 * Product type validation
 */
export const productTypeSchema = z.enum(["STANDARD", "WEIGHTED", "GENERIC"]);

/**
 * Stock rotation method validation
 */
export const stockRotationMethodSchema = z.enum(["FIFO", "FEFO", "NONE"]);

/**
 * Age restriction level validation
 */
export const ageRestrictionLevelSchema = z.enum([
  "NONE",
  "AGE_16",
  "AGE_18",
  "AGE_21",
]);

/**
 * Modifier option schema
 */
const modifierOptionSchema = z.object({
  id: z.string().optional(),
  name: requiredStringSchema("Option name"),
  price: nonNegativeNumberSchema,
});

/**
 * Modifier schema
 * Supports both old (type) and new (multiSelect) property formats
 */
const modifierSchema = z
  .object({
    id: z.string().optional(),
    name: requiredStringSchema("Modifier name"),
    required: z.boolean(),
    // Support both old (type) and new (multiSelect) property formats
    type: z.enum(["single", "multiple"]).optional(),
    multiSelect: z.boolean().optional(),
    options: z
      .array(modifierOptionSchema)
      .min(1, "Modifier must have at least one option"),
    businessId: z.string().optional(),
    updatedAt: z.string().optional(),
    createdAt: z.string().optional(),
  })
  .refine(
    (data) => {
      // At least one of multiSelect or type must be present
      return data.multiSelect !== undefined || data.type !== undefined;
    },
    {
      message: "Modifier must have either 'multiSelect' or 'type' property",
    }
  );

/**
 * Base product schema (shared between create and update)
 * This defines the common fields and validation logic
 */
const baseProductSchema = z
  .object({
    name: requiredStringSchema("Product name"),
    description: optionalStringSchema,
    basePrice: nonNegativeNumberSchema,
    costPrice: nonNegativeNumberSchema,
    sku: commonSkuSchema,
    barcode: optionalStringSchema,
    plu: pluSchema,
    image: optionalStringSchema,
    categoryId: uuidSchema.min(1, "Please select a category"),
    productType: productTypeSchema.default("STANDARD"),
    salesUnit: salesUnitSchema.default("PIECE"),
    usesScale: z.boolean().default(false),
    pricePerKg: nonNegativeNumberSchema.optional(),
    isGenericButton: z.boolean().default(false),
    genericDefaultPrice: nonNegativeNumberSchema.optional(),
    trackInventory: z.boolean().default(true),
    stockLevel: nonNegativeIntegerSchema,
    minStockLevel: nonNegativeIntegerSchema,
    reorderPoint: nonNegativeIntegerSchema,
    vatCategoryId: uuidSchema.optional().or(z.literal("")),
    vatOverridePercent: percentageSchema.optional(),
    isActive: z.boolean().default(true),
    allowPriceOverride: z.boolean().default(false),
    allowDiscount: z.boolean().default(true),
    modifiers: z.array(modifierSchema).optional(),
    hasExpiry: z.boolean().default(false),
    shelfLifeDays: nonNegativeIntegerSchema.optional(),
    requiresBatchTracking: z.boolean().default(false),
    stockRotationMethod: stockRotationMethodSchema.default("FIFO"),
    ageRestrictionLevel: ageRestrictionLevelSchema.default("NONE"),
    requireIdScan: z.boolean().default(false),
    restrictionReason: optionalStringSchema,
    businessId: uuidSchema,
  })
  .superRefine((data, ctx) => {
    // Weight-based product validations
    if (data.usesScale) {
      if (data.salesUnit === "PIECE") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Weight-based products must have a weight unit (e.g., KG, GRAM)",
          path: ["salesUnit"],
        });
      }
      if (!data.pricePerKg || data.pricePerKg <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price per KG/GRAM is required for weight-based products",
          path: ["pricePerKg"],
        });
      }
    } else {
      if (data.basePrice <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Base price must be greater than 0 for standard products",
          path: ["basePrice"],
        });
      }
    }

    // Generic button product validations
    if (data.isGenericButton) {
      if (!data.genericDefaultPrice || data.genericDefaultPrice <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Default price is required for generic button products",
          path: ["genericDefaultPrice"],
        });
      }
    }

    // Expiry tracking validations
    if (data.hasExpiry) {
      if (!data.shelfLifeDays || data.shelfLifeDays <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Shelf life in days is required for products with expiry tracking",
          path: ["shelfLifeDays"],
        });
      }
    }

    // Batch tracking validations
    if (data.requiresBatchTracking) {
      if (data.stockRotationMethod === "NONE") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Stock rotation method is required for batch tracked products",
          path: ["stockRotationMethod"],
        });
      }
    }

    // Age restriction validations
    if (data.ageRestrictionLevel !== "NONE") {
      if (!data.restrictionReason || data.restrictionReason.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Restriction reason is required for age-restricted products",
          path: ["restrictionReason"],
        });
      }
    }

    // Cost price should not exceed sale price (only for non-weight-based products)
    if (!data.usesScale && data.costPrice > data.basePrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cost price cannot be higher than sale price",
        path: ["costPrice"],
      });
    }
  });

/**
 * Product create schema
 * Used for creating new products
 */
export const productCreateSchema = baseProductSchema;

/**
 * Product update schema
 * Extends base schema with required ID field
 * Uses safeExtend() because baseProductSchema contains refinements
 */
export const productUpdateSchema = baseProductSchema.safeExtend({
  id: uuidSchema,
});

/**
 * Type exports
 * Inferred from schemas for type safety
 */
export type ProductFormData = z.infer<typeof productCreateSchema>;
export type ProductUpdateData = z.infer<typeof productUpdateSchema>;

/**
 * @deprecated Use zodResolver with productCreateSchema or productUpdateSchema instead
 * These functions are kept for backward compatibility but will be removed in future versions
 */
export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  });

  return fieldErrors;
}

/**
 * @deprecated Use zodResolver with productCreateSchema or productUpdateSchema instead
 */
export function getAllErrorMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}

/**
 * @deprecated Use zodResolver with productCreateSchema or productUpdateSchema instead
 */
export function validateProduct(data: unknown): {
  success: boolean;
  data?: ProductFormData;
  errors?: Record<string, string>;
  fieldErrors?: Record<string, string>;
} {
  const result = productCreateSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: getFieldErrors(result.error),
    fieldErrors: getFieldErrors(result.error),
  };
}

/**
 * @deprecated Use zodResolver with productCreateSchema or productUpdateSchema instead
 */
export function validateProductUpdate(data: unknown): {
  success: boolean;
  data?: ProductUpdateData;
  errors?: Record<string, string>;
  fieldErrors?: Record<string, string>;
} {
  const result = productUpdateSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: getFieldErrors(result.error),
    fieldErrors: getFieldErrors(result.error),
  };
}
