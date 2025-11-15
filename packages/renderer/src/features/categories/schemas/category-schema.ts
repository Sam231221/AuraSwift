import { z } from "zod";

// Category name schema
const categoryNameSchema = z
  .string()
  .min(1, "Category name is required")
  .min(2, "Category name must be at least 2 characters")
  .max(100, "Category name must not exceed 100 characters")
  .refine(
    (val: string) => /^[a-zA-Z0-9\s\-_&'()]+$/.test(val),
    "Category name can only contain letters, numbers, spaces, and basic punctuation (-, _, &, ', ())"
  )
  .transform((val) => val.trim());

// Description schema
const descriptionSchema = z
  .string()
  .max(500, "Description must not exceed 500 characters")
  .optional()
  .transform((val) => (val ? val.trim() : undefined));

// Parent ID schema
const parentIdSchema = z
  .string()
  .optional()
  .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined));

// Base category schema
export const categorySchema = z.object({
  name: categoryNameSchema,
  description: descriptionSchema,
  parentId: parentIdSchema,
  businessId: z.string().min(1, "Business ID is required"),
});

// Category update schema (includes id)
export const categoryUpdateSchema = z.object({
  id: z.string().min(1, "Category ID is required"),
  name: categoryNameSchema,
  description: descriptionSchema,
  parentId: parentIdSchema,
  businessId: z.string().min(1, "Business ID is required"),
});

// Type inference
export type CategoryFormData = z.infer<typeof categorySchema>;
export type CategoryUpdateData = z.infer<typeof categoryUpdateSchema>;

// Validation helper function
export function validateCategory(
  data: Partial<CategoryFormData> | Partial<CategoryUpdateData>
): {
  success: boolean;
  data?: CategoryFormData | CategoryUpdateData;
  errors?: Record<string, string>;
} {
  // Determine which schema to use based on presence of id
  const schema =
    "id" in data && data.id ? categoryUpdateSchema : categorySchema;

  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Transform Zod errors to field-specific errors
  const errors: Record<string, string> = {};
  result.error.issues.forEach((error) => {
    const field = error.path[0] as string;
    if (!errors[field]) {
      errors[field] = error.message;
    }
  });

  return {
    success: false,
    errors,
  };
}

// Get all error messages as array
export function getAllErrorMessages(
  errors: Record<string, string> | undefined
): string[] {
  if (!errors) return [];
  return Object.values(errors);
}

// Get field-specific error
export function getFieldError(
  errors: Record<string, string> | undefined,
  field: string
): string | undefined {
  return errors?.[field];
}
