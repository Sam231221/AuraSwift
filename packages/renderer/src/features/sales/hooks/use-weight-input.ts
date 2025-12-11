/**
 * Hook for managing weight input for weighted products
 * Handles weight input formatting, display, and validation
 */

import { useState, useCallback } from "react";
import type { Product } from "@/types/domain";

/**
 * Hook for managing weight input
 * @returns Weight input state and handlers
 */
export function useWeightInput() {
  const [weightInput, setWeightInput] = useState("");
  const [weightDisplayPrice, setWeightDisplayPrice] = useState("0.00");
  const [selectedWeightProduct, setSelectedWeightProduct] =
    useState<Product | null>(null);

  /**
   * Handle weight input from numeric keypad
   * Auto-formats display with decimal point 2 positions from right
   * @param value - Input value from keypad
   */
  const handleWeightInput = useCallback(
    (value: string) => {
      if (value === "Clear") {
        setWeightInput("");
        setWeightDisplayPrice("0.00");
        return;
      }

      if (value === "Enter") {
        // Parse weight: raw digits divided by 100 (auto-decimal format)
        const rawDigits = weightInput.replace(/[^0-9]/g, ""); // Remove any non-digits
        const weightValue = rawDigits ? parseFloat(rawDigits) / 100 : 0;
        return weightValue;
      }

      // Handle numeric input for weight (store raw digits only)
      let newWeight = weightInput.replace(/[^0-9]/g, ""); // Remove any non-digits
      if (value === "00") {
        newWeight = newWeight + "00";
      } else if (value === ".") {
        // Decimal point - user can still enter manually, but we auto-format
        // For now, treat as regular digit handling (auto-format on display)
        // Could be ignored or used for manual override if needed
        return;
      } else if (/^[0-9]$/.test(value)) {
        newWeight = newWeight + value;
      }

      setWeightInput(newWeight);

      // Auto-format display: insert decimal 2 positions from right
      const numDigits = newWeight.length;
      if (numDigits === 0) {
        setWeightDisplayPrice("0.00");
      } else if (numDigits === 1) {
        setWeightDisplayPrice(`0.0${newWeight}`);
      } else if (numDigits === 2) {
        setWeightDisplayPrice(`0.${newWeight}`);
      } else {
        const wholePart = newWeight.slice(0, -2);
        const decimalPart = newWeight.slice(-2);
        setWeightDisplayPrice(`${wholePart}.${decimalPart}`);
      }
    },
    [weightInput]
  );

  /**
   * Get parsed weight value from input
   * @returns Parsed weight value in decimal format
   */
  const getWeightValue = useCallback((): number => {
    const rawDigits = weightInput.replace(/[^0-9]/g, "");
    return rawDigits ? parseFloat(rawDigits) / 100 : 0;
  }, [weightInput]);

  /**
   * Reset weight input
   */
  const resetWeightInput = useCallback(() => {
    setWeightInput("");
    setWeightDisplayPrice("0.00");
    setSelectedWeightProduct(null);
  }, []);

  /**
   * Clear weight input but keep selected product
   */
  const clearWeightInput = useCallback(() => {
    setWeightInput("");
    setWeightDisplayPrice("0.00");
  }, []);

  return {
    weightInput,
    weightDisplayPrice,
    selectedWeightProduct,
    setSelectedWeightProduct,
    setWeightInput,
    setWeightDisplayPrice,
    handleWeightInput,
    getWeightValue,
    resetWeightInput,
    clearWeightInput,
  };
}
