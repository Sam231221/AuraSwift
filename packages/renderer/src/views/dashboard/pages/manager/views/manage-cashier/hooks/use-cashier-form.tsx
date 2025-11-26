/**
 * Cashier Form Hook
 *
 * Custom hook for managing cashier/staff form state, validation, and submission
 * using React Hook Form with Zod validation.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { configuredZodResolver } from "@/shared/validation/resolvers";
import {
  cashierCreateSchema,
  cashierUpdateSchema,
  type CashierFormData,
  type CashierUpdateData,
} from "../schemas/cashier-schema";
import { useFormNotification } from "@/shared/hooks/use-form-notification";

interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "cashier" | "manager";
  businessId: string;
  avatar?: string;
  address?: string;
  isActive: boolean;
}

interface UseCashierFormOptions {
  /**
   * Cashier to edit (if in edit mode)
   */
  cashier?: StaffUser | null;

  /**
   * Business ID (required for all operations)
   */
  businessId: string;

  /**
   * Callback when form is submitted successfully
   */
  onSubmit: (data: CashierFormData | CashierUpdateData) => Promise<void>;

  /**
   * Optional callback after successful submission
   */
  onSuccess?: () => void;
}

/**
 * Get default form values for creating a new cashier
 */
const getDefaultValues = (businessId: string): CashierFormData => ({
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  role: "cashier",
  avatar: "",
  address: "",
  businessId,
});

/**
 * Map cashier entity to form data
 */
const mapCashierToFormData = (
  cashier: StaffUser,
  businessId: string
): CashierUpdateData => ({
  id: cashier.id,
  email: cashier.email,
  firstName: cashier.firstName,
  lastName: cashier.lastName,
  avatar: cashier.avatar || "",
  address: cashier.address || "",
  isActive: cashier.isActive ?? true,
  businessId,
});

/**
 * Hook for managing cashier form (create)
 *
 * @example
 * ```tsx
 * const { form, handleSubmit, isSubmitting } = useCashierForm({
 *   businessId: user.businessId,
 *   onSubmit: async (data) => {
 *     await createCashier(data);
 *   },
 *   onSuccess: () => {
 *     setIsDialogOpen(false);
 *   },
 * });
 * ```
 */
export function useCashierForm({
  businessId,
  onSubmit,
  onSuccess,
}: Omit<UseCashierFormOptions, "cashier">) {
  const form = useForm<CashierFormData>({
    resolver: configuredZodResolver(cashierCreateSchema),
    defaultValues: getDefaultValues(businessId),
    mode: "onChange", // Validate on change for keyboard input
  });

  const { notifySuccess, notifyError } = useFormNotification({
    entityName: "Cashier",
  });

  const handleSubmit = form.handleSubmit(
    async (data) => {
      try {
        await onSubmit(data);
        notifySuccess("create");
        form.reset(getDefaultValues(businessId));
        onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        notifyError(errorMessage);
      }
    },
    (errors) => {
      // Log validation errors for debugging
      console.error("Cashier create form validation errors:", errors);
    }
  );

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
  };
}

/**
 * Hook for managing cashier form (update)
 *
 * @example
 * ```tsx
 * const { form, handleSubmit, isSubmitting } = useCashierEditForm({
 *   cashier: editingCashier,
 *   businessId: user.businessId,
 *   onSubmit: async (data) => {
 *     await updateCashier(data);
 *   },
 *   onSuccess: () => {
 *     setIsDialogOpen(false);
 *   },
 * });
 * ```
 */
export function useCashierEditForm({
  cashier,
  businessId,
  onSubmit,
  onSuccess,
}: UseCashierFormOptions) {
  if (!cashier) {
    throw new Error("Cashier is required for edit form");
  }

  const form = useForm<CashierUpdateData>({
    resolver: configuredZodResolver(cashierUpdateSchema),
    defaultValues: mapCashierToFormData(cashier, businessId),
    mode: "onChange", // Validate on change for keyboard input
  });

  const { notifySuccess, notifyError } = useFormNotification({
    entityName: "Cashier",
  });

  // Reset form when cashier prop changes (important for edit mode)
  useEffect(() => {
    if (cashier) {
      form.reset(mapCashierToFormData(cashier, businessId));
    }
  }, [cashier, businessId, form]);

  const handleSubmit = form.handleSubmit(
    async (data) => {
      try {
        await onSubmit(data);
        notifySuccess("update");
        onSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        notifyError(errorMessage);
      }
    },
    (errors) => {
      // Log validation errors for debugging
      console.error("Cashier edit form validation errors:", errors);
    }
  );

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
  };
}
