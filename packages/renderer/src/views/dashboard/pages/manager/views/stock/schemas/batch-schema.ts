/**
 * Batch Validation Schema
 *
 * Validation schemas for product batch/lot tracking forms.
 * Uses common schemas from shared/validation/common for consistency.
 */

import { z } from "zod";
import {
  optionalStringSchema,
  coercedNonNegativeInteger,
  optionalCoercedNonNegativeNumber,
} from "@/shared/validation/common";

/**
 * Date string validation (YYYY-MM-DD format)
 */
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((val) => !isNaN(Date.parse(val)), "Please enter a valid date");

/**
 * Optional date string validation
 */
const optionalDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((val) => !val || !isNaN(Date.parse(val)), "Please enter a valid date")
  .optional()
  .or(z.literal(""));

/**
 * Batch number validation (optional, can be auto-generated)
 */
const batchNumberSchema = optionalStringSchema.refine(
  (val) => !val || val.length >= 1,
  "Batch number must be at least 1 character"
);

/**
 * Purchase order number validation (optional)
 */
const purchaseOrderNumberSchema = z
  .string()
  .max(100, "Purchase order number must not exceed 100 characters")
  .optional()
  .or(z.literal(""));

/**
 * Batch create schema
 * Used for creating new batches
 */
export const batchCreateSchema = z
  .object({
    productId: z.string().min(1, "Product ID is required"),
    batchNumber: batchNumberSchema,
    manufacturingDate: optionalDateStringSchema,
    expiryDate: dateStringSchema,
    initialQuantity: coercedNonNegativeInteger,
    supplierId: z.string().optional().or(z.literal("none")),
    purchaseOrderNumber: purchaseOrderNumberSchema,
    costPrice: optionalCoercedNonNegativeNumber,
    businessId: z.string().min(1, "Business ID is required"),
  })
  .superRefine((data, ctx) => {
    // Expiry date must be after manufacturing date (if both provided)
    if (data.manufacturingDate && data.expiryDate) {
      const manufacturingDate = new Date(data.manufacturingDate);
      const expiryDate = new Date(data.expiryDate);

      if (expiryDate <= manufacturingDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expiry date must be after manufacturing date",
          path: ["expiryDate"],
        });
      }
    }

    // Expiry date should not be in the past (for new batches)
    const expiryDate = new Date(data.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry date cannot be in the past",
        path: ["expiryDate"],
      });
    }

    // Initial quantity must be greater than 0
    if (data.initialQuantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Initial quantity must be greater than 0",
        path: ["initialQuantity"],
      });
    }
  });

/**
 * Batch update schema
 * Extends create schema with required ID field and optional fields for updates
 */
export const batchUpdateSchema = z
  .object({
    id: z.string().min(1, "Batch ID is required"),
    batchNumber: batchNumberSchema.optional(),
    manufacturingDate: optionalDateStringSchema,
    expiryDate: dateStringSchema.optional(),
    currentQuantity: coercedNonNegativeInteger.optional(),
    supplierId: z.string().optional().or(z.literal("none")),
    purchaseOrderNumber: purchaseOrderNumberSchema,
    costPrice: optionalCoercedNonNegativeNumber,
    status: z.enum(["ACTIVE", "EXPIRED", "SOLD_OUT", "REMOVED"]).optional(),
  })
  .superRefine((data, ctx) => {
    // If both dates are provided, expiry must be after manufacturing
    if (data.manufacturingDate && data.expiryDate) {
      const manufacturingDate = new Date(data.manufacturingDate);
      const expiryDate = new Date(data.expiryDate);

      if (expiryDate <= manufacturingDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expiry date must be after manufacturing date",
          path: ["expiryDate"],
        });
      }
    }
  });

/**
 * Type exports
 * Inferred from schemas for type safety
 */
export type BatchFormData = z.infer<typeof batchCreateSchema>;
export type BatchUpdateData = z.infer<typeof batchUpdateSchema>;
