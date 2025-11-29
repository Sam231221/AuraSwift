import { z } from "zod";

// Role Create Schema
export const roleCreateSchema = z.object({
  name: z
    .string()
    .min(3, "Role name must be at least 3 characters")
    .max(50, "Role name must be less than 50 characters")
    .regex(/^[a-z0-9_]+$/, "Role name must be lowercase with underscores only"),
  displayName: z
    .string()
    .min(3, "Display name must be at least 3 characters")
    .max(100, "Display name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .optional(),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required"),
});

export type RoleCreateFormData = z.infer<typeof roleCreateSchema>;

// Role Update Schema
export const roleUpdateSchema = z.object({
  displayName: z
    .string()
    .min(3, "Display name must be at least 3 characters")
    .max(100, "Display name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type RoleUpdateFormData = z.infer<typeof roleUpdateSchema>;

// User Role Assignment Schema
export const userRoleAssignSchema = z.object({
  userId: z.string().min(1, "User is required"),
  roleId: z.string().min(1, "Role is required"),
});

export type UserRoleAssignFormData = z.infer<typeof userRoleAssignSchema>;

// Direct Permission Grant Schema
export const permissionGrantSchema = z.object({
  userId: z.string().min(1, "User is required"),
  permission: z.string().min(1, "Permission is required"),
  grantedBy: z.string().min(1, "Granted by is required"),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be less than 500 characters")
    .optional(),
  expiresAt: z.date().optional(),
});

export type PermissionGrantFormData = z.infer<typeof permissionGrantSchema>;
