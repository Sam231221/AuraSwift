import { useState, useRef, useCallback } from "react";
import type { KeyboardMode } from "@/components/adaptive-keyboard/keyboard-layouts";

export interface FieldConfig {
  type?: "text" | "number" | "email" | "tel";
  keyboardMode?: KeyboardMode;
}

export interface UseAdaptiveKeyboardOptions<T extends string> {
  fields: T[];
  initialValues?: Partial<Record<T, string>>;
  fieldConfigs?: Partial<Record<T, FieldConfig>>;
  onSubmit?: (data: Record<T, string>) => void;
}

export function useAdaptiveKeyboard<T extends string>({
  fields,
  initialValues = {},
  fieldConfigs = {},
  onSubmit,
}: UseAdaptiveKeyboardOptions<T>) {
  // Form state
  const [formData, setFormData] = useState<Record<T, string>>(() => {
    const initial = {} as Record<T, string>;
    fields.forEach((field) => {
      initial[field] = initialValues[field] || "";
    });
    return initial;
  });

  // Keyboard state
  const [activeField, setActiveField] = useState<T | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  // Field refs for focus management
  const inputRefs = useRef<Record<T, HTMLInputElement | null>>(
    {} as Record<T, HTMLInputElement | null>
  );

  // Get active field config
  const activeFieldConfig = activeField ? fieldConfigs[activeField] : null;

  // Handlers
  const handleInput = useCallback(
    (char: string) => {
      if (!activeField) return;
      setFormData((prev) => ({
        ...prev,
        [activeField]: prev[activeField] + char,
      }));
    },
    [activeField]
  );

  const handleBackspace = useCallback(() => {
    if (!activeField) return;
    setFormData((prev) => ({
      ...prev,
      [activeField]: prev[activeField].slice(0, -1),
    }));
  }, [activeField]);

  const handleClear = useCallback(() => {
    if (!activeField) return;
    setFormData((prev) => ({
      ...prev,
      [activeField]: "",
    }));
  }, [activeField]);

  const handleEnter = useCallback(() => {
    if (!activeField) return;
    const currentIndex = fields.findIndex((f) => f === activeField);
    if (currentIndex < fields.length - 1) {
      const nextField = fields[currentIndex + 1];
      setActiveField(nextField);
      inputRefs.current[nextField]?.focus();
    } else {
      // Last field - trigger submit if available
      if (onSubmit) {
        onSubmit(formData);
      }
    }
  }, [activeField, fields, formData, onSubmit]);

  const handleTab = useCallback(() => {
    handleEnter();
  }, [handleEnter]);

  const handleFieldFocus = useCallback((fieldName: T) => {
    setActiveField(fieldName);
    setShowKeyboard(true);
  }, []);

  const handleCloseKeyboard = useCallback(() => {
    setShowKeyboard(false);
    setActiveField(null);
  }, []);

  const resetForm = useCallback(() => {
    const initial = {} as Record<T, string>;
    fields.forEach((field) => {
      initial[field] = initialValues[field] || "";
    });
    setFormData(initial);
    setActiveField(null);
    setShowKeyboard(false);
  }, [fields, initialValues]);

  const updateField = useCallback((fieldName: T, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  return {
    // State
    formData,
    activeField,
    showKeyboard,
    inputRefs,
    activeFieldConfig,

    // Keyboard handlers
    handleInput,
    handleBackspace,
    handleClear,
    handleEnter,
    handleTab,
    handleFieldFocus,
    handleCloseKeyboard,

    // Form utilities
    resetForm,
    updateField,
    setFormData,
    setShowKeyboard,
  };
}
