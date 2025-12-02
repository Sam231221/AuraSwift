/**
 * Product Form Hook
 *
 * Custom hook for managing product form state, validation, and submission
 * using React Hook Form with Zod validation.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { configuredZodResolver } from "@/shared/validation/resolvers";
import {
  productCreateSchema,
  productUpdateSchema,
  type ProductFormData,
  type ProductUpdateData,
} from "../schemas/product-schema";
import { useFormNotification } from "@/shared/hooks/use-form-notification";
import type { Product } from "@/types/domain";
import type { Category, VatCategory } from "./use-product-data";

import { getLogger } from "@/shared/utils/logger";
const logger = getLogger("use-product-form");

interface UseProductFormOptions {
  /**
   * Product to edit (if in edit mode)
   */
  product?: Product | null;

  /**
   * Categories list (for default category selection)
   */
  categories: Category[];

  /**
   * VAT categories list
   */
  vatCategories: VatCategory[];

  /**
   * Business ID (required for all operations)
   */
  businessId: string;

  /**
   * Callback when form is submitted successfully
   */
  onSubmit: (data: ProductFormData | ProductUpdateData) => Promise<void>;

  /**
   * Optional callback after successful submission
   */
  onSuccess?: () => void;
}

/**
 * Get default form values for creating a new product
 */
const getDefaultFormData = (
  categories: Category[],
  businessId: string
): ProductFormData => ({
  name: "",
  description: "",
  basePrice: 0,
  costPrice: 0,
  sku: "",
  barcode: "",
  plu: "",
  image: "",
  categoryId: categories.length > 0 ? categories[0].id : "",
  productType: "STANDARD",
  salesUnit: "PIECE",
  usesScale: false,
  pricePerKg: 0,
  isGenericButton: false,
  genericDefaultPrice: 0,
  trackInventory: true,
  stockLevel: 0,
  minStockLevel: 5,
  reorderPoint: 0,
  vatCategoryId: "",
  vatOverridePercent: 0,
  isActive: true,
  allowPriceOverride: false,
  allowDiscount: true,
  modifiers: [],
  hasExpiry: false,
  shelfLifeDays: 0,
  requiresBatchTracking: false,
  stockRotationMethod: "FIFO",
  ageRestrictionLevel: "NONE",
  requireIdScan: false,
  restrictionReason: "",
  businessId,
});

/**
 * Map product entity to form data
 */
const mapProductToFormData = (
  product: Product,
  categories: Category[],
  businessId: string
): ProductUpdateData => {
  const dbProduct = product as unknown as Record<string, unknown>;
  const productCategoryId =
    (dbProduct.categoryId as string | undefined) || product.category;
  const safeCategories = categories || [];
  const categoryExists = safeCategories.some(
    (cat) => cat.id === productCategoryId
  );
  const validCategory = categoryExists
    ? productCategoryId
    : safeCategories.length > 0
    ? safeCategories[0].id
    : "";

  const normalizedModifiers = ((product as any).modifiers || []).map(
    (modifier: any) => ({
      ...modifier,
      multiSelect:
        "multiSelect" in modifier
          ? Boolean((modifier as { multiSelect?: boolean }).multiSelect)
          : modifier.type === "multiple",
      required: modifier.required ?? false,
    })
  );

  return {
    id: product.id,
    name: product.name,
    description: product.description || "",
    basePrice: (dbProduct.basePrice as number | undefined) ?? 0,
    costPrice: product.costPrice || 0,
    sku: product.sku,
    barcode: (dbProduct.barcode as string | undefined) || "",
    plu: product.plu || "",
    image: product.image || "",
    categoryId:
      (dbProduct.categoryId as string | undefined) || validCategory || "",
    productType:
      (dbProduct.productType as
        | "STANDARD"
        | "WEIGHTED"
        | "GENERIC"
        | undefined) || "STANDARD",
    salesUnit:
      (dbProduct.salesUnit as
        | "PIECE"
        | "KG"
        | "GRAM"
        | "LITRE"
        | "ML"
        | "PACK"
        | undefined) ||
      ((dbProduct.usesScale as boolean | undefined) ? "KG" : "PIECE"),
    usesScale: (dbProduct.usesScale as boolean | undefined) ?? false,
    pricePerKg: (dbProduct.pricePerKg as number | undefined) ?? 0,
    isGenericButton:
      (dbProduct.isGenericButton as boolean | undefined) || false,
    genericDefaultPrice:
      (dbProduct.genericDefaultPrice as number | undefined) || 0,
    trackInventory:
      (dbProduct.trackInventory as boolean | undefined) !== undefined
        ? (dbProduct.trackInventory as boolean)
        : true,
    stockLevel: product.stockLevel || 0,
    minStockLevel: product.minStockLevel || 0,
    reorderPoint: (dbProduct.reorderPoint as number | undefined) || 0,
    vatCategoryId: (dbProduct.vatCategoryId as string | undefined) || "",
    vatOverridePercent: dbProduct.vatOverridePercent
      ? (dbProduct.vatOverridePercent as number)
      : 0,
    isActive: product.isActive !== undefined ? product.isActive : true,
    allowPriceOverride:
      (dbProduct.allowPriceOverride as boolean | undefined) || false,
    allowDiscount:
      (dbProduct.allowDiscount as boolean | undefined) !== undefined
        ? (dbProduct.allowDiscount as boolean)
        : true,
    modifiers: normalizedModifiers,
    hasExpiry: (dbProduct.hasExpiry as boolean | undefined) || false,
    shelfLifeDays: (dbProduct.shelfLifeDays as number | undefined) || 0,
    requiresBatchTracking:
      (dbProduct.requiresBatchTracking as boolean | undefined) || false,
    stockRotationMethod:
      (dbProduct.stockRotationMethod as "FIFO" | "FEFO" | "NONE" | undefined) ||
      "FIFO",
    ageRestrictionLevel:
      (dbProduct.ageRestrictionLevel as
        | "NONE"
        | "AGE_16"
        | "AGE_18"
        | "AGE_21"
        | undefined) || "NONE",
    requireIdScan: (dbProduct.requireIdScan as boolean | undefined) || false,
    restrictionReason:
      (dbProduct.restrictionReason as string | undefined) || "",
    businessId,
  };
};

/**
 * Hook for managing product form
 *
 * @example
 * ```tsx
 * const { form, handleSubmit, isSubmitting } = useProductForm({
 *   product: editingProduct,
 *   categories: categoriesList,
 *   vatCategories: vatCategoriesList,
 *   businessId: user.businessId,
 *   onSubmit: async (data) => {
 *     await saveProduct(data);
 *   },
 *   onSuccess: () => {
 *     setIsDrawerOpen(false);
 *   },
 * });
 * ```
 */
export function useProductForm({
  product,
  categories,
  vatCategories: _vatCategories,
  businessId,
  onSubmit,
  onSuccess,
}: UseProductFormOptions) {
  const isEditMode = !!product;
  const schema = isEditMode ? productUpdateSchema : productCreateSchema;

  // Suppress unused parameter warning - vatCategories may be used in future
  void _vatCategories;

  const form = useForm<ProductFormData | ProductUpdateData>({
    resolver: configuredZodResolver(schema),
    defaultValues: product
      ? mapProductToFormData(product, categories, businessId)
      : getDefaultFormData(categories, businessId),
    mode: "onChange", // Enable real-time validation for better UX with keyboard
  });

  // Reset form when product changes (for edit mode)
  useEffect(() => {
    if (product) {
      form.reset(mapProductToFormData(product, categories, businessId));
    } else {
      form.reset(getDefaultFormData(categories, businessId));
    }
  }, [product, categories, businessId, form]);

  const { notifySuccess, notifyError } = useFormNotification({
    entityName: "Product",
  });

  const handleSubmit = form.handleSubmit(
    async (data) => {
      try {
        await onSubmit(data);
        notifySuccess(isEditMode ? "update" : "create");

        // Reset form after successful creation (not on update)
        if (!isEditMode) {
          form.reset(getDefaultFormData(categories, businessId));
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
      logger.error("Product form validation errors:", errors);
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
