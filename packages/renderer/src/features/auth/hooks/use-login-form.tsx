/**
 * Login Form Hook
 * 
 * Custom hook for managing login form state, validation, and submission
 * using React Hook Form with Zod validation.
 */

import { useForm } from "react-hook-form";
import { configuredZodResolver } from "@/shared/validation/resolvers";
import {
  loginSchema,
  type LoginFormData,
} from "@/features/auth/schemas/login-schema";
import { toast } from "sonner";

interface UseLoginFormOptions {
  /**
   * Callback when form is submitted successfully
   */
  onSubmit: (data: LoginFormData) => Promise<void>;

  /**
   * Optional callback after successful submission
   */
  onSuccess?: () => void;
}

/**
 * Get default form values for login
 */
const getDefaultValues = (): LoginFormData => ({
  username: "",
  pin: "",
  rememberMe: false,
});

/**
 * Hook for managing login form
 * 
 * @example
 * ```tsx
 * const { form, handleSubmit, isSubmitting } = useLoginForm({
 *   onSubmit: async (data) => {
 *     await login(data.username, data.pin, data.rememberMe);
 *   },
 * });
 * ```
 */
export function useLoginForm({
  onSubmit,
  onSuccess,
}: UseLoginFormOptions) {
  const form = useForm<LoginFormData>({
    resolver: configuredZodResolver(loginSchema),
    defaultValues: getDefaultValues(),
    mode: "onBlur", // Validate on blur for better UX
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      toast.error(errorMessage);
    }
  });

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
  };
}

