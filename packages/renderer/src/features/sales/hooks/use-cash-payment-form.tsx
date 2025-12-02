/**
 * Cash Payment Form Hook
 * 
 * Custom hook for managing cash payment form state, validation, and submission
 * using React Hook Form with Zod validation.
 */

import { useForm } from "react-hook-form";
import { configuredZodResolver } from "@/shared/validation/resolvers";
import {
  cashPaymentSchema,
  type CashPaymentFormData,
} from "../schemas/payment-schema";
import { useFormNotification } from "@/shared/hooks/use-form-notification";

interface UseCashPaymentFormOptions {
  /**
   * Total amount due
   */
  total: number;

  /**
   * Callback when form is submitted successfully
   */
  onSubmit: (data: CashPaymentFormData) => Promise<void>;

  /**
   * Optional callback after successful submission
   */
  onSuccess?: () => void;
}

/**
 * Get default form values for cash payment
 */
const getDefaultValues = (total: number): CashPaymentFormData => ({
  cashAmount: 0,
  total,
});

/**
 * Hook for managing cash payment form
 * 
 * @example
 * ```tsx
 * const { form, handleSubmit, isSubmitting } = useCashPaymentForm({
 *   total: cartTotal,
 *   onSubmit: async (data) => {
 *     await processCashPayment(data);
 *   },
 * });
 * ```
 */
export function useCashPaymentForm({
  total,
  onSubmit,
  onSuccess,
}: UseCashPaymentFormOptions) {
  const form = useForm<CashPaymentFormData>({
    resolver: configuredZodResolver(cashPaymentSchema),
    defaultValues: getDefaultValues(total),
    mode: "onChange", // Validate on change for immediate feedback on payment forms
  });

  // Update total when it changes
  form.setValue("total", total);

  const { notifyError } = useFormNotification({
    entityName: "Payment",
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      notifyError(errorMessage);
    }
  });

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
    // Helper to calculate change
    change: form.watch("cashAmount") >= total 
      ? form.watch("cashAmount") - total 
      : 0,
    // Helper to calculate shortfall
    shortfall: form.watch("cashAmount") > 0 && form.watch("cashAmount") < total
      ? total - form.watch("cashAmount")
      : 0,
  };
}

