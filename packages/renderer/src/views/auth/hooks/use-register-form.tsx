/**
 * Register Form Hook
 * 
 * Custom hook for managing registration form state, validation, and submission
 * using React Hook Form with Zod validation.
 */

import { useForm } from "react-hook-form";
import { configuredZodResolver } from "@/shared/validation/resolvers";
import {
  registerSchema,
  type RegisterFormData,
} from "../schemas/register-schema";
import { toast } from "sonner";

interface UseRegisterFormOptions {
  /**
   * Callback when form is submitted successfully
   */
  onSubmit: (data: RegisterFormData) => Promise<void>;

  /**
   * Optional callback after successful submission
   */
  onSuccess?: () => void;
}

/**
 * Get default form values for registration
 */
const getDefaultValues = (): RegisterFormData => ({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  businessName: "",
  avatar: "",
  businessAvatar: "",
});

/**
 * Hook for managing register form
 * 
 * @example
 * ```tsx
 * const { form, handleSubmit, isSubmitting } = useRegisterForm({
 *   onSubmit: async (data) => {
 *     await register(data);
 *   },
 * });
 * ```
 */
export function useRegisterForm({
  onSubmit,
  onSuccess,
}: UseRegisterFormOptions) {
  const form = useForm<RegisterFormData>({
    resolver: configuredZodResolver(registerSchema),
    defaultValues: getDefaultValues(),
    mode: "onBlur", // Validate on blur for better UX
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      toast.success("Account created successfully");
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
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

