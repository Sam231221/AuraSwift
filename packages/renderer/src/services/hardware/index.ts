/**
 * Hardware Services
 *
 * Central export for all hardware integration services.
 * These services provide infrastructure-level hardware integration,
 * separate from business domain features.
 */

// Scanner
export {
  useProductionScanner,
} from "./scanner";
export type {
  ScannerStatus,
  ScanLog,
  UseProductionScannerOptions,
} from "./scanner";

// Printer
export {
  useThermalPrinter,
  usePrinterSetup,
  useReceiptPrintingFlow,
} from "./printer";
export type {
  PrintStatus,
  PrinterInfo,
  PrintJob,
} from "./printer";

// Scale
export {
  useScaleManager,
} from "./scale";
export type {
  ScaleDevice,
  ScaleReading,
  ScaleStatus,
  ScaleConfig,
} from "./scale";

// Payment (placeholder for future hardware integrations)
// export { ... } from "./payment";

