/**
 * Cashier Validation Schema
 *
 * Validation schemas for cashier/staff management forms.
 * Uses common schemas from shared/validation/common for consistency.
 */

import { z } from "zod";
import {
  requiredStringSchema,
  optionalStringSchema,
  emailSchema,
  pinSchema,
} from "@/shared/validation/common";

/**
 * Name validation (first name, last name)
 */
const nameSchema = requiredStringSchema("Name")
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must not exceed 50 characters")
  .refine(
    (val) => /^[a-zA-Z\s'-]+$/.test(val),
    "Name can only contain letters, spaces, hyphens, and apostrophes"
  );

/**
 * Cashier create schema (with username and PIN)
 * Used for creating new cashier/staff accounts
 */
export const cashierCreateSchema = z
  .object({
    email: emailSchema.optional(),
    username: requiredStringSchema("Username")
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must not exceed 50 characters"),
    pin: pinSchema(6),
    firstName: nameSchema,
    lastName: nameSchema,
    role: z.enum(["cashier", "manager"]).default("cashier"),
    avatar: optionalStringSchema,
    address: z
      .string()
      .max(200, "Address must not exceed 200 characters")
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((val) => val || ""),
    businessId: z.string().min(1, "Business ID is required"),
  });

/**
 * Cashier update schema (without password)
 * Used for updating existing cashier/staff accounts
 */
export const cashierUpdateSchema = z.object({
  id: z.string().min(1, "Cashier ID is required"),
  email: emailSchema.optional(),
  firstName: nameSchema,
  lastName: nameSchema,
  avatar: optionalStringSchema,
  address: z
    .string()
    .max(200, "Address must not exceed 200 characters")
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => val || ""),
  isActive: z.boolean().default(true),
  businessId: z.string().min(1, "Business ID is required"),
});

/**
 * Type exports
 * Inferred from schemas for type safety
 */
export type CashierFormData = z.infer<typeof cashierCreateSchema>;
export type CashierUpdateData = z.infer<typeof cashierUpdateSchema>;
