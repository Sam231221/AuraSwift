/**
 * Scanner Hardware Types
 */

export interface ScannerStatus {
  status: "ready" | "processing" | "error" | "disabled";
  lastScan?: string;
  scanCount: number;
  isReady: boolean;
}

export interface ScanLog {
  barcode: string;
  timestamp: string;
  success: boolean;
  productName?: string;
  error?: string;
}

export interface UseProductionScannerOptions {
  onScan: (barcode: string) => Promise<boolean> | boolean;
  enableAudio?: boolean;
  validateBarcode?: (barcode: string) => boolean;
  scanTimeout?: number;
  minBarcodeLength?: number;
  maxBarcodeLength?: number;
  ignoreInputs?: boolean;
}

