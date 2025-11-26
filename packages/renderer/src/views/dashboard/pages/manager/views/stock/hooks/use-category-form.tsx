/**
 * Category Form Hook
 * 
 * Custom hook for managing category form state, validation, and submission
 * using React Hook Form with Zod validation.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { configuredZodResolver } from "@/shared/validation/resolvers";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  type CategoryFormData,
  type CategoryUpdateData,
} from "../schemas/category-schema";
import { useFormNotification } from "@/shared/hooks/use-form-notification";
import type { Category } from "../hooks/use-product-data";

interface UseCategoryFormOptions {
  /**
   * Category to edit (if in edit mode)
   */
  category?: Category | null;

  /**
   * Business ID (required for all operations)
   */
  businessId: string;

  /**
   * Callback when form is submitted successfully
   */
  onSubmit: (data: CategoryFormData | CategoryUpdateData) => Promise<void>;

  /**
   * Optional callback after successful submission
   */
  onSuccess?: () => void;
}

/**
 * Get default form values for creating a new category
 */
const getDefaultValues = (businessId: string): CategoryFormData => ({
  name: "",
  description: "",
  parentId: undefined,
  businessId,
  vatCategoryId: "",
  vatOverridePercent: "",
  color: "",
  image: "",
  isActive: true,
});

/**
 * Map category entity to form data
 */
const mapCategoryToFormData = (
  category: Category,
  businessId: string
): CategoryUpdateData => ({
  id: category.id,
  name: category.name,
  description: category.description || "",
  parentId: category.parentId || undefined,
  businessId,
  vatCategoryId: category.vatCategoryId || "",
  vatOverridePercent: category.vatOverridePercent?.toString() || "",
  color: category.color || "",
  image: category.image || "",
  isActive: category.isActive ?? true,
});

/**
 * Hook for managing category form
 * 
 * @example
 * ```tsx
 * const { form, handleSubmit, isSubmitting } = useCategoryForm({
 *   category: editingCategory,
 *   businessId: user.businessId,
 *   onSubmit: async (data) => {
 *     await saveCategory(data);
 *   },
 *   onSuccess: () => {
 *     setIsDrawerOpen(false);
 *   },
 * });
 * ```
 */
export function useCategoryForm({
  category,
  businessId,
  onSubmit,
  onSuccess,
}: UseCategoryFormOptions) {
  const isEditMode = !!category;
  const schema = isEditMode ? categoryUpdateSchema : categoryCreateSchema;

  const form = useForm<CategoryFormData | CategoryUpdateData>({
    resolver: configuredZodResolver(schema),
    defaultValues: category
      ? mapCategoryToFormData(category, businessId)
      : getDefaultValues(businessId),
    mode: "onChange", // Enable real-time validation for better UX with keyboard
  });

  // Reset form when category changes (for edit mode)
  useEffect(() => {
    if (category) {
      form.reset(mapCategoryToFormData(category, businessId));
    } else {
      form.reset(getDefaultValues(businessId));
    }
  }, [category, businessId, form]);

  const { notifySuccess, notifyError } = useFormNotification({
    entityName: "Category",
  });

  const handleSubmit = form.handleSubmit(
    async (data) => {
    try {
      await onSubmit(data);
      notifySuccess(isEditMode ? "update" : "create");
      
      // Reset form after successful creation (not on update)
      if (!isEditMode) {
        form.reset(getDefaultValues(businessId));
      }
      
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      notifyError(errorMessage);
    }
    },
    (errors) => {
      // Log validation errors for debugging
      console.error("Category form validation errors:", errors);
    }
  );

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
    isEditMode,
  };
}
