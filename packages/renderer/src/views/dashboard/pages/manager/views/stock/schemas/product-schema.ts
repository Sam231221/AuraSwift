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
} from "@/shared/validation/common";

/**
 * Coerced number schemas for keyboard input compatibility
 * These use z.coerce.number() to automatically convert string inputs to numbers
 */
const coercedNonNegativeNumber = z.coerce
  .number({ message: "Must be a valid number" })
  .nonnegative("Cannot be negative")
  .finite("Must be a valid number");

const coercedNonNegativeInteger = z.coerce
  .number({ message: "Must be a valid number" })
  .int("Must be a whole number")
  .nonnegative("Cannot be negative")
  .finite("Must be a valid number");

const coercedPercentage = z.coerce
  .number({ message: "Must be a valid number" })
  .min(0, "Cannot be negative")
  .max(100, "Cannot exceed 100%")
  .finite("Must be a valid number");

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
  price: coercedNonNegativeNumber,
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
    basePrice: coercedNonNegativeNumber,
    costPrice: coercedNonNegativeNumber,
    sku: commonSkuSchema,
    barcode: optionalStringSchema,
    plu: pluSchema,
    image: optionalStringSchema,
    // Accept any non-empty string for categoryId (not just UUIDs) to support legacy IDs
    categoryId: z.string().min(1, "Please select a category"),
    productType: productTypeSchema.default("STANDARD"),
    salesUnit: salesUnitSchema.default("PIECE"),
    usesScale: z.boolean().default(false),
    pricePerKg: coercedNonNegativeNumber.optional(),
    isGenericButton: z.boolean().default(false),
    genericDefaultPrice: coercedNonNegativeNumber.optional(),
    trackInventory: z.boolean().default(true),
    stockLevel: coercedNonNegativeInteger,
    minStockLevel: coercedNonNegativeInteger,
    reorderPoint: coercedNonNegativeInteger,
    // Accept any string for vatCategoryId (not just UUIDs) to support legacy IDs
    vatCategoryId: z.string().optional().or(z.literal("")),
    vatOverridePercent: coercedPercentage.optional(),
    isActive: z.boolean().default(true),
    allowPriceOverride: z.boolean().default(false),
    allowDiscount: z.boolean().default(true),
    modifiers: z.array(modifierSchema).optional(),
    hasExpiry: z.boolean().default(false),
    shelfLifeDays: coercedNonNegativeInteger.optional(),
    requiresBatchTracking: z.boolean().default(false),
    stockRotationMethod: stockRotationMethodSchema.default("FIFO"),
    ageRestrictionLevel: ageRestrictionLevelSchema.default("NONE"),
    requireIdScan: z.boolean().default(false),
    restrictionReason: optionalStringSchema,
    // Accept any non-empty string for businessId (not just UUIDs) to support legacy IDs
    businessId: z.string().min(1, "Business ID is required"),
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

    // Note: Removed strict basePrice > 0, pricePerKg > 0, genericDefaultPrice > 0,
    // shelfLifeDays > 0, restrictionReason, and costPrice < basePrice validations
    // because they interfere with tabbed form workflow where users may not have
    // entered values yet. These validations can be handled at the API level.
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
  // Accept any non-empty string for id (not just UUIDs) to support legacy IDs
  id: z.string().min(1, "ID is required"),
});

/**
 * Type exports
 * Inferred from schemas for type safety
 */
export type ProductFormData = z.infer<typeof productCreateSchema>;
export type ProductUpdateData = z.infer<typeof productUpdateSchema>;
