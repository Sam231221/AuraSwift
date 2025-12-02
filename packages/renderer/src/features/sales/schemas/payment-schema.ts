/**
 * Payment Validation Schema
 * 
 * Validation schemas for payment forms.
 * Uses common schemas from shared/validation/common for consistency.
 */

import { z } from "zod";
import { currencyAmountSchema } from "@/shared/validation/common";

/**
 * Cash payment schema
 * Validates cash amount for cash payments
 */
export const cashPaymentSchema = z
  .object({
    cashAmount: currencyAmountSchema,
    total: currencyAmountSchema,
  })
  .superRefine((data, ctx) => {
    // Cash amount should be greater than or equal to total
    if (data.cashAmount < data.total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Insufficient funds. Need £${(data.total - data.cashAmount).toFixed(2)} more.`,
        path: ["cashAmount"],
      });
    }
  });

/**
 * Type exports
 * Inferred from schemas for type safety
 */
export type CashPaymentFormData = z.infer<typeof cashPaymentSchema>;

