/**
 * Production Barcode Scanner Hook
 * Handles hardware barcode scanner integration via keyboard emulation
 * Based on real supermarket POS requirements
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { ScannerAudio } from "@/shared/services/scanner-audio";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('use-production-scanner');

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

interface UseProductionScannerOptions {
  onScan: (barcode: string) => Promise<boolean> | boolean;
  enableAudio?: boolean;
  validateBarcode?: (barcode: string) => boolean;
  scanTimeout?: number; // ms to wait for complete barcode
  minBarcodeLength?: number;
  maxBarcodeLength?: number;
  ignoreInputs?: boolean; // Ignore scans when typing in inputs
}

/**
 * Production-ready barcode scanner hook
 * Handles USB barcode scanners in keyboard emulation mode
 */
export const useProductionScanner = (options: UseProductionScannerOptions) => {
  const {
    onScan,
    enableAudio = true,
    validateBarcode,
    scanTimeout = 200,
    minBarcodeLength = 6,
    maxBarcodeLength = 18,
    ignoreInputs = true,
  } = options;

  // State
  const [scannerStatus, setScannerStatus] =
    useState<ScannerStatus["status"]>("ready");
  const [scanLog, setScanLog] = useState<ScanLog[]>([]);
  const [scanCount, setScanCount] = useState(0);

  // Refs for barcode accumulation
  const barcodeRef = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeyTimeRef = useRef(0);
  const isProcessingRef = useRef(false);

  /**
   * Default barcode validation
   */
  const defaultValidateBarcode = useCallback(
    (barcode: string): boolean => {
      const cleanBarcode = barcode.trim();

      // Length validation
      if (
        cleanBarcode.length < minBarcodeLength ||
        cleanBarcode.length > maxBarcodeLength
      ) {
        logger.warn(
          `Invalid barcode length: ${cleanBarcode.length}. Expected ${minBarcodeLength}-${maxBarcodeLength}`
        );
        return false;
      }

      // Common barcode formats validation
      const validLengths = [6, 7, 8, 12, 13, 14, 15, 16, 17, 18]; // UPC, EAN, Code128, etc.
      if (!validLengths.includes(cleanBarcode.length)) {
        logger.warn(`Uncommon barcode length: ${cleanBarcode.length}`);
        // Don't reject, just warn
      }

      // Check if it contains reasonable characters (alphanumeric)
      const validCharPattern = /^[A-Za-z0-9\-_]+$/;
      if (!validCharPattern.test(cleanBarcode)) {
        logger.warn("Barcode contains invalid characters");
        return false;
      }

      // Check if it's mostly numeric (most retail barcodes are)
      const numericRatio =
        cleanBarcode.replace(/[^0-9]/g, "").length / cleanBarcode.length;
      if (numericRatio < 0.5) {
        logger.warn(
          "Barcode contains many non-numeric characters, might be invalid"
        );
        // Don't reject, just warn - some products have alphanumeric codes
      }

      return true;
    },
    [minBarcodeLength, maxBarcodeLength]
  );

  /**
   * Process a scanned barcode
   */
  const processScannedBarcode = useCallback(
    async (barcode: string) => {
      if (isProcessingRef.current) {
        logger.warn("Already processing a scan, ignoring duplicate");
        return;
      }

      isProcessingRef.current = true;
      setScannerStatus("processing");

      const scanEntry: ScanLog = {
        barcode,
        timestamp: new Date().toLocaleTimeString(),
        success: false,
      };

      try {
        // Validate barcode format
        const validator = validateBarcode || defaultValidateBarcode;
        const isValidFormat = validator(barcode);

        if (!isValidFormat) {
          scanEntry.error = "Invalid barcode format";
          if (enableAudio) {
            await ScannerAudio.error();
          }
          setScannerStatus("error");
          setTimeout(() => setScannerStatus("ready"), 1500);
          return;
        }

        // Process the scan

        const scanResult = await onScan(barcode);

        if (scanResult) {
          // Successful scan
          scanEntry.success = true;
          setScanCount((prev) => prev + 1);

          if (enableAudio) {
            await ScannerAudio.success();
          }

          setScannerStatus("ready");
        } else {
          // Product not found or other error
          scanEntry.error = "Product not found";
          if (enableAudio) {
            await ScannerAudio.error();
          }

          logger.warn("❌ Barcode scan failed - product not found:", barcode);
          setScannerStatus("error");
          setTimeout(() => setScannerStatus("ready"), 1500);
        }
      } catch (error) {
        logger.error("Error processing barcode scan:", error);
        scanEntry.error =
          error instanceof Error ? error.message : "Unknown error";

        if (enableAudio) {
          await ScannerAudio.error();
        }

        setScannerStatus("error");
        setTimeout(() => setScannerStatus("ready"), 1500);
      } finally {
        // Update scan log (keep last 50 scans)
        setScanLog((prev) => [...prev.slice(-49), scanEntry]);
        isProcessingRef.current = false;
      }
    },
    [onScan, validateBarcode, defaultValidateBarcode, enableAudio]
  );

  /**
   * Check if we should ignore the current key event
   */
  const shouldIgnoreKeyEvent = useCallback(
    (event: KeyboardEvent): boolean => {
      if (!ignoreInputs) return false;

      const target = event.target as HTMLElement;

      // Ignore if typing in input fields, textareas, or contenteditable elements
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        target.getAttribute("role") === "textbox"
      ) {
        return true;
      }

      // Ignore if any modifier keys are pressed (Ctrl, Alt, Meta)
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return true;
      }

      return false;
    },
    [ignoreInputs]
  );

  /**
   * Main keyboard event handler
   */
  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      // Initialize audio on first user interaction
      if (enableAudio && scanCount === 0) {
        await ScannerAudio.init();
      }

      // Check if we should ignore this event
      if (shouldIgnoreKeyEvent(event)) {
        barcodeRef.current = ""; // Reset accumulation when typing in inputs
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;

      // Detect new scan sequence (gap > 100ms indicates new barcode)
      // This is crucial for distinguishing barcode scanner input from manual typing
      if (timeSinceLastKey > 100) {
        barcodeRef.current = "";
      }

      lastKeyTimeRef.current = now;

      if (event.key === "Enter") {
        // Barcode complete with Enter key (most scanners send this)
        event.preventDefault();
        event.stopPropagation();

        if (barcodeRef.current.length >= minBarcodeLength) {
          await processScannedBarcode(barcodeRef.current);
        }

        barcodeRef.current = "";
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      } else if (event.key.length === 1) {
        // Accumulate barcode characters
        // Only accept printable characters
        barcodeRef.current += event.key;

        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Fallback timeout for scanners that don't send Enter
        // Some older scanners just send the barcode without Enter
        timeoutRef.current = setTimeout(async () => {
          if (barcodeRef.current.length >= minBarcodeLength) {
            await processScannedBarcode(barcodeRef.current);
            barcodeRef.current = "";
          }
        }, scanTimeout);

        // Prevent excessively long barcodes (likely manual typing)
        if (barcodeRef.current.length > maxBarcodeLength) {
          barcodeRef.current = "";
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        }
      }
    };

    // Add event listener with capture to ensure we get events first
    // This is important for preventing conflicts with other keyboard handlers
    document.addEventListener("keydown", handleKeyPress, true);

    return () => {
      document.removeEventListener("keydown", handleKeyPress, true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    processScannedBarcode,
    shouldIgnoreKeyEvent,
    enableAudio,
    scanCount,
    minBarcodeLength,
    maxBarcodeLength,
    scanTimeout,
  ]);

  /**
   * Manual scan function for testing
   */
  const manualScan = useCallback(
    async (barcode: string) => {
      await processScannedBarcode(barcode);
    },
    [processScannedBarcode]
  );

  /**
   * Clear scan log
   */
  const clearScanLog = useCallback(() => {
    setScanLog([]);
  }, []);

  /**
   * Reset scanner state
   */
  const reset = useCallback(() => {
    barcodeRef.current = "";
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setScannerStatus("ready");
    isProcessingRef.current = false;
  }, []);

  return {
    scannerStatus: {
      status: scannerStatus,
      lastScan: scanLog[scanLog.length - 1]?.barcode,
      scanCount,
      isReady: scannerStatus === "ready",
    },
    scanLog,
    manualScan,
    clearScanLog,
    reset,
  };
};
