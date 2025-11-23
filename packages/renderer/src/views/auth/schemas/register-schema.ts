/**
 * Register Validation Schema
 * 
 * Validation schema for user registration forms.
 * Uses common schemas from shared/validation/common for consistency.
 */

import { z } from "zod";
import {
  requiredStringSchema,
  emailSchema,
  passwordSchema,
  optionalStringSchema,
} from "@/shared/validation/common";

/**
 * Name validation (first name, last name, business name)
 */
const nameSchema = requiredStringSchema("Name")
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must not exceed 100 characters")
  .refine(
    (val) => /^[a-zA-Z0-9\s'-]+$/.test(val),
    "Name can only contain letters, numbers, spaces, hyphens, and apostrophes"
  );

/**
 * Business name validation
 */
const businessNameSchema = requiredStringSchema("Business name")
  .min(2, "Business name must be at least 2 characters")
  .max(100, "Business name must not exceed 100 characters");

/**
 * Register schema
 * Validates user registration data
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema
      .min(8, "Password must be at least 8 characters")
      .refine(
        (val) => /[A-Z]/.test(val),
        "Password must contain at least one uppercase letter"
      )
      .refine(
        (val) => /[a-z]/.test(val),
        "Password must contain at least one lowercase letter"
      )
      .refine(
        (val) => /[0-9]/.test(val),
        "Password must contain at least one number"
      )
      .refine(
        (val) => /[^A-Za-z0-9]/.test(val),
        "Password must contain at least one special character"
      ),
    firstName: nameSchema,
    lastName: nameSchema,
    businessName: businessNameSchema,
    avatar: optionalStringSchema,
    businessAvatar: optionalStringSchema,
  });

/**
 * Type exports
 * Inferred from schemas for type safety
 */
export type RegisterFormData = z.infer<typeof registerSchema>;

