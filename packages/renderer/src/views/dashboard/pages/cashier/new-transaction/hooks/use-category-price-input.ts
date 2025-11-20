/**
 * Hook for managing category price input
 * Handles price input formatting, display, and validation
 */

import { useState, useCallback } from "react";
import type { Category } from "../types/transaction.types";

/**
 * Hook for managing category price input
 * @returns Category price input state and handlers
 */
export function useCategoryPriceInput() {
  const [pendingCategory, setPendingCategory] = useState<Category | null>(null);
  const [categoryPriceInput, setCategoryPriceInput] = useState("");
  const [categoryDisplayPrice, setCategoryDisplayPrice] = useState("0.00");

  /**
   * Handle price input from numeric keypad
   * Auto-formats display with decimal point 2 positions from right
   * @param value - Input value from keypad
   */
  const handlePriceInput = useCallback(
    (value: string) => {
      if (value === "Clear") {
        setCategoryPriceInput("");
        setCategoryDisplayPrice("0.00");
        return;
      }

      if (value === "Enter") {
        // Parse price: raw digits divided by 100 (auto-decimal format)
        const rawDigits = categoryPriceInput.replace(/[^0-9]/g, ""); // Remove any non-digits
        const priceValue = rawDigits ? parseFloat(rawDigits) / 100 : 0;
        return priceValue;
      }

      // Handle numeric input for category price (store raw digits only)
      let newPrice = categoryPriceInput.replace(/[^0-9]/g, ""); // Remove any non-digits
      if (value === "00") {
        newPrice = newPrice + "00";
      } else if (value === ".") {
        // Decimal point - user can still enter manually, but we auto-format
        // For now, treat as regular digit handling (auto-format on display)
        // Could be ignored or used for manual override if needed
        return;
      } else if (/^[0-9]$/.test(value)) {
        newPrice = newPrice + value;
      }

      setCategoryPriceInput(newPrice);

      // Auto-format display: insert decimal 2 positions from right
      const numDigits = newPrice.length;
      if (numDigits === 0) {
        setCategoryDisplayPrice("0.00");
      } else if (numDigits === 1) {
        setCategoryDisplayPrice(`0.0${newPrice}`);
      } else if (numDigits === 2) {
        setCategoryDisplayPrice(`0.${newPrice}`);
      } else {
        const wholePart = newPrice.slice(0, -2);
        const decimalPart = newPrice.slice(-2);
        setCategoryDisplayPrice(`${wholePart}.${decimalPart}`);
      }
    },
    [categoryPriceInput]
  );

  /**
   * Get parsed price value from input
   * @returns Parsed price value in decimal format
   */
  const getPriceValue = useCallback((): number => {
    const rawDigits = categoryPriceInput.replace(/[^0-9]/g, "");
    return rawDigits ? parseFloat(rawDigits) / 100 : 0;
  }, [categoryPriceInput]);

  /**
   * Reset price input
   */
  const resetPriceInput = useCallback(() => {
    setCategoryPriceInput("");
    setCategoryDisplayPrice("0.00");
    setPendingCategory(null);
  }, []);

  /**
   * Clear price input but keep pending category
   */
  const clearPriceInput = useCallback(() => {
    setCategoryPriceInput("");
    setCategoryDisplayPrice("0.00");
  }, []);

  return {
    pendingCategory,
    categoryPriceInput,
    categoryDisplayPrice,
    setPendingCategory,
    handlePriceInput,
    getPriceValue,
    resetPriceInput,
    clearPriceInput,
  };
}
