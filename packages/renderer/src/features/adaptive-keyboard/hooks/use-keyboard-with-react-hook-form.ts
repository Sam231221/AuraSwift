import { useState, useCallback } from "react";
import type {
  UseFormSetValue,
  UseFormWatch,
  FieldValues,
  Path,
} from "react-hook-form";
import type { KeyboardMode } from "@/features/adaptive-keyboard/keyboard-layouts";

export interface UseKeyboardWithRHFOptions<T extends FieldValues> {
  setValue: UseFormSetValue<T>;
  watch: UseFormWatch<T>;
  fieldConfigs?: Partial<Record<keyof T, { keyboardMode?: KeyboardMode }>>;
}

/**
 * Hook to integrate Adaptive Keyboard with React Hook Form
 *
 * This hook bridges the gap between the keyboard's manual input
 * and React Hook Form's state management.
 *
 * @example
 * ```tsx
 * const form = useForm()
 * const keyboard = useKeyboardWithRHF({
 *   setValue: form.setValue,
 *   watch: form.watch,
 * })
 *
 * // Use keyboard.handleInput, keyboard.handleBackspace, etc.
 * ```
 */
export function useKeyboardWithRHF<T extends FieldValues>({
  setValue,
  watch,
  fieldConfigs = {},
}: UseKeyboardWithRHFOptions<T>) {
  const [activeField, setActiveField] = useState<Path<T> | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  // Get all form values
  const formValues = watch();

  // Get active field config
  const activeFieldConfig = activeField ? fieldConfigs[activeField] : null;

  const handleInput = useCallback(
    (char: string) => {
      if (!activeField) return;
      const currentValue = formValues[activeField] || "";
      setValue(activeField, (currentValue + char) as any, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [activeField, formValues, setValue]
  );

  const handleBackspace = useCallback(() => {
    if (!activeField) return;
    const currentValue = String(formValues[activeField] || "");
    setValue(activeField, currentValue.slice(0, -1) as any, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [activeField, formValues, setValue]);

  const handleClear = useCallback(() => {
    if (!activeField) return;
    setValue(activeField, "" as any, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [activeField, setValue]);

  const handleFieldFocus = useCallback((fieldName: Path<T>) => {
    setActiveField(fieldName);
    setShowKeyboard(true);
  }, []);

  const handleCloseKeyboard = useCallback(() => {
    setShowKeyboard(false);
    setActiveField(null);
  }, []);

  return {
    // State
    activeField,
    showKeyboard,
    activeFieldConfig,
    formValues,

    // Handlers
    handleInput,
    handleBackspace,
    handleClear,
    handleFieldFocus,
    handleCloseKeyboard,

    // Utilities
    setShowKeyboard,
  };
}
