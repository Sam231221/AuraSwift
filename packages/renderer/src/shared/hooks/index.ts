export { useAuth } from "./use-auth";
export { useIsMobile } from "./use-mobile";
export * from "./use-office-printer";
// Hardware services are now in @/services/hardware
// Re-export for backward compatibility (deprecated - use @/services/hardware directly)
export { useProductionScanner } from "@/services/hardware/scanner";
export { useScaleManager } from "@/services/hardware/scale";
export { useFormNotification, getErrorMessage } from "./use-form-notification";
export { useAdaptiveKeyboard } from "../../features/adaptive-keyboard/hooks/use-adaptive-keyboard";
export type {
  UseAdaptiveKeyboardOptions,
  FieldConfig,
} from "../../features/adaptive-keyboard/hooks/use-adaptive-keyboard";
export { useKeyboardWithRHF } from "../../features/adaptive-keyboard/hooks/use-keyboard-with-react-hook-form";
export type { UseKeyboardWithRHFOptions } from "../../features/adaptive-keyboard/hooks/use-keyboard-with-react-hook-form";
