/**
 * Common Validation Schemas
 *
 * Reusable Zod schemas for common field types used across multiple features.
 * These schemas can be composed into feature-specific validation schemas.
 */

import { z } from "zod";

/**
 * Email validation schema
 * - Validates email format
 * - Trims and lowercases the input
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .toLowerCase()
  .trim();

/**
 * Optional email validation schema
 */
export const optionalEmailSchema = z
  .string()
  .email("Please enter a valid email address")
  .toLowerCase()
  .trim()
  .optional()
  .or(z.literal(""));

/**
 * Phone number validation schema
 * Supports common phone number formats with spaces, dashes, parentheses, and plus sign
 */
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^[\d\s\-\+\(\)]+$/.test(val),
    "Please enter a valid phone number"
  )
  .transform((val) => val?.trim() || "");

/**
 * Required string schema factory
 * Creates a required string field with trimming
 */
export const requiredStringSchema = (fieldName: string = "Field") =>
  z
    .string({ message: `${fieldName} is required` })
    .min(1, `${fieldName} is required`)
    .trim();

/**
 * Optional string schema
 * Handles empty strings, null, and undefined
 * Note: To apply max/min, use it before the transform:
 * z.string().max(100).trim().optional().or(z.literal("")).transform(...)
 */
export const optionalStringSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .or(z.null())
  .transform((val) => val || "");

/**
 * Helper to create optional string with max length
 */
export const optionalStringWithMax = (max: number, message?: string) =>
  z
    .string()
    .max(max, message || `Must not exceed ${max} characters`)
    .trim()
    .optional()
    .or(z.literal(""))
    .or(z.null())
    .transform((val) => val || "");

/**
 * Positive number schema
 * Must be greater than zero
 */
export const positiveNumberSchema = z
  .number({ message: "This field is required" })
  .positive("Must be greater than zero")
  .finite("Must be a valid number");

/**
 * Non-negative number schema
 * Can be zero or positive
 */
export const nonNegativeNumberSchema = z
  .number({ message: "This field is required" })
  .nonnegative("Cannot be negative")
  .finite("Must be a valid number");

/**
 * Integer schema (positive)
 * Must be a whole number greater than zero
 */
export const positiveIntegerSchema = z
  .number({ message: "This field is required" })
  .int("Must be a whole number")
  .positive("Must be greater than zero")
  .finite("Must be a valid number");

/**
 * Non-negative integer schema
 * Must be a whole number (zero or positive)
 */
export const nonNegativeIntegerSchema = z
  .number({ message: "This field is required" })
  .int("Must be a whole number")
  .nonnegative("Cannot be negative")
  .finite("Must be a valid number");

/**
 * Percentage schema
 * Validates numbers between 0 and 100
 */
export const percentageSchema = z
  .number({ message: "This field is required" })
  .min(0, "Cannot be negative")
  .max(100, "Cannot exceed 100%")
  .finite("Must be a valid number");

/**
 * Currency amount schema
 * Validates positive numbers with up to 2 decimal places
 */
export const currencyAmountSchema = z
  .number({ message: "This field is required" })
  .nonnegative("Amount cannot be negative")
  .finite("Must be a valid number")
  .refine(
    (val) => {
      // Check if number has more than 2 decimal places
      const decimalPlaces = (val.toString().split(".")[1] || []).length;
      return decimalPlaces <= 2;
    },
    {
      message: "Amount cannot have more than 2 decimal places",
    }
  );

/**
 * URL schema
 * Validates URL format
 */
export const urlSchema = z
  .string()
  .url("Please enter a valid URL")
  .trim()
  .optional()
  .or(z.literal(""));

/**
 * UUID schema
 * Validates UUID format
 */
export const uuidSchema = z.string().uuid("Invalid ID format");

/**
 * Date string schema
 * Validates ISO date strings
 */
export const dateStringSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), "Please enter a valid date")
  .optional();

/**
 * Boolean schema with default
 */
export const booleanSchema = z.boolean().default(false);

/**
 * Password schema (basic)
 * Minimum 6 characters, can be enhanced based on requirements
 */
export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password must not exceed 100 characters");

/**
 * PIN schema
 * Numeric PIN with specific length
 */
export const pinSchema = (length: number = 6) =>
  z
    .string()
    .min(length, `PIN must be exactly ${length} digits`)
    .max(length, `PIN must be exactly ${length} digits`)
    .regex(/^\d+$/, "PIN must contain only numbers");

/**
 * SKU/Barcode schema
 * Alphanumeric with dashes and underscores
 */
export const skuSchema = z
  .string()
  .min(1, "SKU is required")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "SKU can only contain letters, numbers, dashes, and underscores"
  )
  .trim()
  .toUpperCase();

/**
 * Optional SKU schema
 */
export const optionalSkuSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9_-]*$/,
    "SKU can only contain letters, numbers, dashes, and underscores"
  )
  .trim()
  .toUpperCase()
  .optional()
  .or(z.literal(""));
