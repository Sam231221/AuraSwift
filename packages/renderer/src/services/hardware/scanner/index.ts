/**
 * Barcode Scanner Hardware Service
 *
 * Hardware integration for barcode scanner devices.
 * Provides hooks and utilities for barcode scanning functionality.
 */

export { useProductionScanner } from "./hooks/use-production-scanner";
export type {
  ScannerStatus,
  ScanLog,
  UseProductionScannerOptions,
} from "./types/scanner.types";

