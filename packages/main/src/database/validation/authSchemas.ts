/**
 * Zod Validation Schemas for Authentication
 *
 * Following Drizzle ORM best practices, we use Zod schemas for:
 * - Input validation
 * - Type inference
 * - Runtime validation
 * - Integration with Drizzle schemas
 */

import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "../schema.js";

// ============================================
// BASE USER SCHEMA (from Drizzle)
// ============================================

// Generate base schemas from Drizzle schema
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// ============================================
// CUSTOM VALIDATION RULES
// ============================================

// Password validation with security requirements
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be less than 128 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "Password must contain at least one special character"
  )
  .refine(
    (password) => {
      // Check for common weak patterns
      const commonPasswords = [
        "password",
        "123456",
        "123456789",
        "qwerty",
        "abc123",
        "password123",
        "admin",
        "letmein",
        "welcome",
        "monkey",
      ];
      return !commonPasswords.some((common) =>
        password.toLowerCase().includes(common)
      );
    },
    { message: "Password contains common weak patterns" }
  );

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .min(1, "Email is required")
  .max(255, "Email must be less than 255 characters");

// Name validation
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters long")
  .max(50, "Name must be less than 50 characters long")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Name can only contain letters, spaces, hyphens, and apostrophes"
  );

// Business name validation
export const businessNameSchema = z
  .string()
  .min(2, "Business name must be at least 2 characters long")
  .max(100, "Business name must be less than 100 characters long");

// PIN validation (4-6 digits)
export const pinSchema = z
  .string()
  .regex(/^\d{4,6}$/, "PIN must be 4-6 digits");

// ============================================
// AUTH REQUEST SCHEMAS
// ============================================

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  businessName: businessNameSchema,
  role: z.enum(["cashier", "manager", "admin"]),
  pin: pinSchema.optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional(),
});

// Login schema (email + password - for admin/initial setup)
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// PIN-based login schema (username + PIN - for POS terminal)
export const pinLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  pin: pinSchema,
  rememberMe: z.boolean().optional(),
});

// Update user schema
export const updateUserSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  businessName: businessNameSchema.optional(),
  role: z.enum(["cashier", "manager", "admin"]).optional(),
  email: emailSchema.optional(),
  isActive: z.boolean().optional(),
  address: z.string().max(200, "Address must be less than 200 characters").optional(),
});

// Create staff user schema (for business owners creating staff)
export const createStaffUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  pin: pinSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.enum(["cashier", "manager"]),
  businessId: z.string().uuid("Invalid business ID"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional(),
});

// Session validation schema
export const sessionTokenSchema = z
  .string()
  .min(1, "Session token is required");

// User ID validation schema
export const userIdSchema = z.string().uuid("Invalid user ID");

// ============================================
// TYPE EXPORTS
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PinLoginInput = z.infer<typeof pinLoginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate input and return formatted errors
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((err: z.ZodIssue) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { success: false, errors };
}

/**
 * Async validation wrapper
 */
export async function validateInputAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => {
        const path = err.path.join(".");
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ["Validation failed"] };
  }
}
