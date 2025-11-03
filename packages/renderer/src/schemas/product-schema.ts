import { z } from "zod";

/**
 * Product Validation Schema
 * Centralized validation rules for product management
 * Promotes reusability and consistent error messages
 */

// Base string validations
const requiredString = (fieldName: string) =>
  z
    .string({ message: `${fieldName} must be text` })
    .min(1, `${fieldName} is required`)
    .trim();

const optionalString = z.string().trim().optional();

// SKU validation: alphanumeric, dashes, underscores only
export const skuSchema = z
  .string({ message: "SKU must be text" })
  .min(1, "SKU is required")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "SKU can only contain letters, numbers, dashes, and underscores"
  )
  .trim();

// PLU validation: alphanumeric only
export const pluSchema = z
  .string()
  .regex(/^[a-zA-Z0-9]+$/, "PLU can only contain letters and numbers")
  .trim()
  .optional()
  .or(z.literal(""));

// Price validations
export const priceSchema = z
  .number({ message: "Price must be a number" })
  .positive("Price must be greater than 0")
  .finite("Price must be a valid number");

export const costPriceSchema = z
  .number({ message: "Cost price must be a number" })
  .nonnegative("Cost price cannot be negative")
  .finite("Cost price must be a valid number");

export const taxRateSchema = z
  .number({ message: "Tax rate must be a number" })
  .min(0, "Tax rate cannot be negative")
  .max(100, "Tax rate cannot exceed 100%")
  .finite("Tax rate must be a valid number");

// Stock validations
export const stockLevelSchema = z
  .number({ message: "Stock level must be a number" })
  .int("Stock level must be a whole number")
  .nonnegative("Stock level cannot be negative")
  .finite("Stock level must be a valid number");

export const minStockLevelSchema = z
  .number({ message: "Minimum stock level must be a number" })
  .int("Minimum stock level must be a whole number")
  .nonnegative("Minimum stock level cannot be negative")
  .finite("Minimum stock level must be a valid number");

// Weight unit validation
export const weightUnitSchema = z.enum(["lb", "kg", "oz", "g", "each"]);

// Modifier option schema
const modifierOptionSchema = z.object({
  id: z.string().optional(),
  name: requiredString("Option name"),
  price: z.number().nonnegative("Option price cannot be negative"),
});

// Modifier schema
const modifierSchema = z
  .object({
    id: z.string().optional(),
    name: requiredString("Modifier name"),
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

// Main product schema for regular products
export const productSchema = z
  .object({
    name: requiredString("Product name"),
    description: optionalString,
    sku: skuSchema,
    plu: pluSchema,
    category: z
      .string({ message: "Category must be text" })
      .min(1, "Please select a category"),
    price: priceSchema,
    costPrice: costPriceSchema,
    taxRate: taxRateSchema,
    stockLevel: stockLevelSchema,
    minStockLevel: minStockLevelSchema,
    image: z.string().optional(),
    requiresWeight: z.boolean(),
    unit: weightUnitSchema,
    pricePerUnit: z.number().nonnegative().finite(),
    modifiers: z.array(modifierSchema).optional(),
    businessId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Cost price should not exceed sale price (only for non-weight-based products)
    if (!data.requiresWeight && data.costPrice > data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cost price cannot be higher than sale price",
        path: ["costPrice"],
      });
    }

    // Weight-based product validations
    if (data.requiresWeight) {
      // Must have a valid unit (not 'each')
      if (data.unit === "each") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid weight unit (lb, kg, oz, or g)",
          path: ["unit"],
        });
      }

      // Must have price per unit
      if (data.pricePerUnit <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price per unit must be greater than 0",
          path: ["pricePerUnit"],
        });
      }
    } else {
      // Regular product must have price > 0
      if (data.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price must be greater than 0",
          path: ["price"],
        });
      }
    }
  });

// Product update schema (for existing products)
// Cannot use .extend() on schemas with refinements, so we create a new schema
export const productUpdateSchema = z
  .object({
    id: z.string().min(1, "Product ID is required"),
    name: requiredString("Product name"),
    description: optionalString,
    sku: skuSchema,
    plu: pluSchema,
    category: z
      .string({ message: "Category must be text" })
      .min(1, "Please select a category"),
    price: priceSchema,
    costPrice: costPriceSchema,
    taxRate: taxRateSchema,
    stockLevel: stockLevelSchema,
    minStockLevel: minStockLevelSchema,
    image: z.string().optional(),
    requiresWeight: z.boolean(),
    unit: weightUnitSchema,
    pricePerUnit: z.number().nonnegative().finite(),
    modifiers: z.array(modifierSchema).optional(),
    businessId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Cost price should not exceed sale price (only for non-weight-based products)
    if (!data.requiresWeight && data.costPrice > data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cost price cannot be higher than sale price",
        path: ["costPrice"],
      });
    }

    // Weight-based product validations
    if (data.requiresWeight) {
      // Must have a valid unit (not 'each')
      if (data.unit === "each") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid weight unit (lb, kg, oz, or g)",
          path: ["unit"],
        });
      }

      // Must have price per unit
      if (data.pricePerUnit <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price per unit must be greater than 0",
          path: ["pricePerUnit"],
        });
      }
    } else {
      // Regular product must have price > 0
      if (data.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price must be greater than 0",
          path: ["price"],
        });
      }
    }
  });

// Type inference from schema
export type ProductFormData = z.infer<typeof productSchema>;
export type ProductUpdateData = z.infer<typeof productUpdateSchema>;

/**
 * Helper function to transform Zod errors into field-specific error messages
 * @param error - Zod error object
 * @returns Object with field names as keys and error messages as values
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
 * Helper function to get all error messages as an array
 * @param error - Zod error object
 * @returns Array of error messages
 */
export function getAllErrorMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}

/**
 * Validate product data and return typed result
 * @param data - Raw product data
 * @returns Validation result with success flag, data, or errors
 */
export function validateProduct(data: unknown): {
  success: boolean;
  data?: ProductFormData;
  errors?: Record<string, string>;
  fieldErrors?: Record<string, string>;
} {
  const result = productSchema.safeParse(data);

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
 * Validate product update data
 * @param data - Raw product data with ID
 * @returns Validation result
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
