export { useAuth } from "./use-auth";
export { useIsMobile } from "./use-mobile";
export { useViewNavigation } from "./use-view-navigation";
export { useViewMap } from "./use-view-map";
export * from "../../features/barcode-scanner/use-production-scanner";
export * from "./use-office-printer";
export * from "./use-scale-manager";
export { useFormNotification, getErrorMessage } from "./use-form-notification";
export { useAdaptiveKeyboard } from "../../features/adaptive-keyboard/hooks/use-adaptive-keyboard";
export type {
  UseAdaptiveKeyboardOptions,
  FieldConfig,
} from "../../features/adaptive-keyboard/hooks/use-adaptive-keyboard";
export { useKeyboardWithRHF } from "../../features/adaptive-keyboard/hooks/use-keyboard-with-react-hook-form";
export type { UseKeyboardWithRHFOptions } from "../../features/adaptive-keyboard/hooks/use-keyboard-with-react-hook-form";
