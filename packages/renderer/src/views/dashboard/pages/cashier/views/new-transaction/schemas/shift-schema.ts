/**
 * Shift Validation Schema
 * 
 * Validation schemas for shift-related forms.
 */

import { z } from "zod";

/**
 * Start shift schema
 * Validates starting cash amount for shift start
 */
export const startShiftSchema = z.object({
  startingCash: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === "" || val === undefined || val === null) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    })
    .pipe(
      z
        .number({ message: "Starting cash is required" })
        .nonnegative("Starting cash cannot be negative")
        .finite("Must be a valid number")
        .max(100000, "Starting cash cannot exceed £100,000")
        .refine(
          (val) => {
            // Check if number has more than 2 decimal places
            const decimalPlaces = (val.toString().split(".")[1] || []).length;
            return decimalPlaces <= 2;
          },
          {
            message: "Amount cannot have more than 2 decimal places",
          }
        )
    ),
});

/**
 * Type exports
 * Inferred from schemas for type safety
 */
export type StartShiftFormData = z.infer<typeof startShiftSchema>;
