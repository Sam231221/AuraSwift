/**
 * Login Validation Schema
 * 
 * Validation schema for user login forms.
 * Uses common schemas from shared/validation/common for consistency.
 */

import { z } from "zod";
import { requiredStringSchema, pinSchema } from "@/shared/validation/common";

/**
 * Login schema
 * Validates username and PIN for login
 */
export const loginSchema = z.object({
  username: requiredStringSchema("Username")
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters"),
  pin: pinSchema(6), // 6-digit PIN
  rememberMe: z.boolean().default(false),
});

/**
 * Type exports
 * Inferred from schemas for type safety
 */
export type LoginFormData = z.infer<typeof loginSchema>;

