/**
 * Barcode Scanner Feature - Public API
 *
 * Utility feature for barcode scanner integration.
 * This is a utility feature, not a domain feature, so it doesn't require
 * navigation integration or feature config.
 */

export { useProductionScanner } from "./use-production-scanner";
export type {
  ScannerStatus,
  ScanLog,
} from "./use-production-scanner";

