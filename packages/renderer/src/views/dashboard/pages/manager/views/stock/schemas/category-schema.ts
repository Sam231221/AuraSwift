/**
 * Category Validation Schema
 *
 * Validation schemas for category management forms.
 * Uses common schemas from shared/validation/common for consistency.
 */

import { z } from "zod";
import { requiredStringSchema, uuidSchema } from "@/shared/validation/common";

/**
 * Category name schema with custom validation
 * - Required string
 * - 2-100 characters
 * - Allows letters, numbers, spaces, and basic punctuation
 */
const categoryNameSchema = requiredStringSchema("Category name")
  .min(2, "Category name must be at least 2 characters")
  .max(100, "Category name must not exceed 100 characters")
  .refine(
    (val) => /^[a-zA-Z0-9\s\-_&'()]+$/.test(val),
    "Category name can only contain letters, numbers, spaces, and basic punctuation (-, _, &, ', ())"
  );

/**
 * Description schema
 * - Optional string
 * - Max 500 characters
 */
const descriptionSchema = z
  .string()
  .max(500, "Description must not exceed 500 characters")
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((val) => val || "");

/**
 * Parent ID schema
 * - Optional UUID
 * - Transforms empty strings to undefined
 */
const parentIdSchema = z
  .string()
  .optional()
  .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined));

/**
 * Category create schema
 * Used for creating new categories
 * Includes all form fields, with optional fields for UI-specific data
 */
export const categoryCreateSchema = z.object({
  name: categoryNameSchema,
  description: descriptionSchema,
  parentId: parentIdSchema,
  businessId: uuidSchema,
  // Optional UI fields (not validated but included for form state)
  vatCategoryId: z.string().optional().or(z.literal("")),
  vatOverridePercent: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

/**
 * Category update schema
 * Extends create schema with required ID field
 * Uses safeExtend() because categoryCreateSchema contains refinements
 */
export const categoryUpdateSchema = categoryCreateSchema.safeExtend({
  id: uuidSchema,
});

/**
 * Type exports
 * Inferred from schemas for type safety
 */
export type CategoryFormData = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateData = z.infer<typeof categoryUpdateSchema>;

/**
 * @deprecated Use zodResolver with categoryCreateSchema or categoryUpdateSchema instead
 * This function is kept for backward compatibility but will be removed in future versions
 */
export const categorySchema = categoryCreateSchema;
