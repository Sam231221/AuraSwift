import { z } from "zod";
import {
  requiredStringSchema,
  emailSchema,
  pinSchema,
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

export const userCreateSchema = z.object({
  email: emailSchema.optional(),
  username: requiredStringSchema("Username")
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters"),
  pin: pinSchema(4),
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.enum(["cashier", "manager"]),
  avatar: z.string(),
  address: z.string().max(200, "Address must not exceed 200 characters"),
  businessId: z.string().min(1, "Business ID is required"), // Accept any non-empty string, not just UUIDs
});

export const userUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"), // Accept any non-empty string, not just UUIDs
  email: emailSchema.optional(),
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
