import { cn } from "@/shared/utils/cn";

import React from "react";

interface NumericKeypadProps {
  onInput: (value: string) => void;
  keysOverride?: (string | React.ReactNode)[][];
}

export function NumericKeypad({ onInput, keysOverride }: NumericKeypadProps) {
  // Remove all Back keys from the grid
  // Color classes matching the main interface (slate/sky)
  const keyBase =
    "min-h-[44px] py-2 sm:py-3 lg:py-4 font-semibold text-sm sm:text-base lg:text-lg rounded transition-colors select-none focus:outline-none touch-manipulation";
  const keyNumber =
    "bg-slate-100 text-slate-700 hover:bg-sky-100 active:bg-sky-200";
  const keyEnter = "bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800";
  const keyClear =
    "bg-slate-200 text-slate-700 hover:bg-slate-300 active:bg-slate-400";

  // Example: Replace with your actual conditional button logic
  const conditionalButton = (
    <button
      className={cn(
        "w-full h-full flex-1 ",
        keyBase,
        keyEnter // or use keyNumber/keyClear for different styles
      )}
      onClick={() => onInput("Conditional")}
      type="button"
    >
      {/* Replace with your actual label, e.g., 'Checkout' or 'Back to Cart' */}
      Checkout
    </button>
  );

  const keys: (string | React.ReactNode)[][] = keysOverride
    ? keysOverride.map((row) => row.map((key) => (key === "Back" ? "" : key)))
    : [
        ["7", "8", "9", "Enter"],
        ["4", "5", "6", "Clear"],
        ["1", "2", "3", conditionalButton],
        ["0", "00"],
      ];

  // Determine the max number of columns in any row
  const colCount = Math.max(...keys.map((row) => row.length));
  return (
    <div className={`grid grid-cols-${colCount} mt-2 gap-1.5 sm:gap-2`}>
      {keys.map((row, rowIdx) =>
        row.map((key, colIdx) => {
          if (!key)
            return (
              <div key={`${rowIdx}-${colIdx}`} className="bg-transparent" />
            );

          // If key is a React element, render as-is
          if (React.isValidElement(key)) {
            return (
              <div
                key={`custom-${rowIdx}-${colIdx}`}
                className="col-span-1 h-full w-full flex items-stretch"
              >
                {key}
              </div>
            );
          }

          const isEnter = key === "Enter";
          const isClear = key === "Clear";
          let keyClass = keyNumber;
          if (isEnter) keyClass = keyEnter;
          else if (isClear) keyClass = keyClear;

          return (
            <button
              key={String(key) + rowIdx + colIdx}
              onClick={() => onInput(key as string)}
              className={cn(keyBase, keyClass)}
              tabIndex={0}
              type="button"
            >
              {key}
            </button>
          );
        })
      )}
    </div>
  );
}
