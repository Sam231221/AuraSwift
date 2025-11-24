import { z } from "zod";
import {
  requiredStringSchema,
  emailSchema,
  passwordSchema,
} from "@/shared/validation/common";

// Note: Both create and update schemas use string validation for IDs
// since existing IDs in the database may not be UUIDs (e.g., 'default-manager-001')

const nameSchema = requiredStringSchema("Name")
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must not exceed 50 characters")
  .refine(
    (val) => /^[a-zA-Z\s'-]+$/.test(val),
    "Name can only contain letters, spaces, hyphens, and apostrophes"
  );

export const userCreateSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema.min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    firstName: nameSchema,
    lastName: nameSchema,
    role: z.enum(["cashier", "manager"]),
    avatar: z.string(),
    address: z.string().max(200, "Address must not exceed 200 characters"),
    businessId: z.string().min(1, "Business ID is required"), // Accept any non-empty string, not just UUIDs
  })
  .superRefine((data, ctx) => {
    // Password confirmation must match password
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const userUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"), // Accept any non-empty string, not just UUIDs
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.enum(["cashier", "manager"]),
  avatar: z.string(),
  address: z.string().max(200, "Address must not exceed 200 characters"),
  isActive: z.boolean(),
  businessId: z.string().min(1, "Business ID is required"), // Accept any non-empty string, not just UUIDs
});

export type UserCreateFormData = z.infer<typeof userCreateSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;
