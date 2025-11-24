# User Management View Refactoring Plan

## 📋 Overview

This document outlines a comprehensive refactoring plan for `user-management-view.tsx` to improve code organization, maintainability, and developer experience through:

1. **Code Splitting** - Breaking down the monolithic component into smaller, focused components
2. **Custom Hooks** - Extracting CRUD operations and business logic into reusable hooks
3. **Component Separation** - Creating dedicated components for forms, dialogs, tables, etc.
4. **Zod + React Hook Form** - Implementing proper form validation and state management

---

## 🎯 Goals

- **Maintainability**: Easier to understand, test, and modify
- **Reusability**: Components and hooks can be reused across the application
- **Type Safety**: Leverage Zod for runtime validation and TypeScript type inference
- **Performance**: Better code splitting and lazy loading opportunities
- **Developer Experience**: Clearer structure, better error handling, consistent patterns

---

## 📁 Proposed File Structure

```
user-management/
├── index.ts                          # Main export
├── user-management-view.tsx          # Main orchestrator component (simplified)
│
├── components/                        # UI Components
│   ├── user-stats-cards.tsx          # Stats cards (Total Staff, Cashiers, Managers)
│   ├── user-filters.tsx              # Search and filter controls
│   ├── user-table.tsx                # Staff members table
│   ├── user-table-row.tsx            # Individual table row
│   ├── empty-state.tsx               # Empty state component
│   │
│   ├── dialogs/                      # Dialog components
│   │   ├── add-user-dialog.tsx       # Add new user dialog
│   │   ├── edit-user-dialog.tsx      # Edit user dialog
│   │   ├── view-user-dialog.tsx      # View user details dialog
│   │   └── delete-user-confirm.tsx   # Delete confirmation dialog
│   │
│   └── forms/                        # Form components
│       ├── user-form-fields.tsx      # Reusable form field components
│       ├── add-user-form.tsx         # Add user form (with React Hook Form)
│       └── edit-user-form.tsx        # Edit user form (with React Hook Form)
│
├── hooks/                            # Custom hooks
│   ├── use-staff-users.ts            # Fetch and manage staff users list
│   ├── use-create-user.ts            # Create user mutation hook
│   ├── use-update-user.ts            # Update user mutation hook
│   ├── use-delete-user.ts            # Delete user mutation hook
│   ├── use-user-filters.ts          # Search and filter logic
│   └── use-user-dialogs.ts           # Dialog state management
│
├── schemas/                          # Zod validation schemas
│   ├── user-schema.ts                # User validation schemas
│   └── types.ts                      # TypeScript types (inferred from schemas)
│
└── utils/                            # Utility functions
    ├── user-helpers.ts               # Helper functions (getStaffDisplayName, etc.)
    └── constants.ts                  # Constants (roles, etc.)
```

---

## 🔄 Step-by-Step Refactoring Plan

### Phase 1: Setup Foundation (Prerequisites)

#### Step 1.1: Create Directory Structure
```bash
mkdir -p user-management/{components/{dialogs,forms},hooks,schemas,utils}
```

#### Step 1.2: Install Dependencies (if not already installed)
```bash
npm install zod react-hook-form @hookform/resolvers
```

#### Step 1.3: Create Base Types and Schemas

**File: `schemas/types.ts`**
```typescript
export interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "cashier" | "manager";
  businessId: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}
```

**File: `schemas/user-schema.ts`**
```typescript
import { z } from "zod";
import {
  requiredStringSchema,
  optionalStringSchema,
  emailSchema,
  passwordSchema,
  uuidSchema,
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
 * User create schema (with password)
 * Used for creating new staff accounts
 */
export const userCreateSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema.min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
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
    businessId: uuidSchema,
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

/**
 * User update schema (without password)
 * Used for updating existing staff accounts
 */
export const userUpdateSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.enum(["cashier", "manager"]),
  avatar: optionalStringSchema,
  address: z
    .string()
    .max(200, "Address must not exceed 200 characters")
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => val || ""),
  isActive: z.boolean().default(true),
  businessId: uuidSchema,
});

/**
 * Type exports
 * Inferred from schemas for type safety
 */
export type UserCreateFormData = z.infer<typeof userCreateSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;
```

#### Step 1.4: Create Utility Functions

**File: `utils/user-helpers.ts`**
```typescript
import type { StaffUser } from "../schemas/types";

export const getStaffDisplayName = (staff: StaffUser): string => {
  return `${staff.firstName} ${staff.lastName}`;
};

export const formatUserRole = (role: "cashier" | "manager"): string => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};
```

**File: `utils/constants.ts`**
```typescript
export const USER_ROLES = ["cashier", "manager"] as const;
export const FILTER_ROLES = ["all", "cashier", "manager"] as const;
```

---

### Phase 2: Create Custom Hooks

#### Step 2.1: Create Staff Users Hook

**File: `hooks/use-staff-users.ts`**
```typescript
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { StaffUser } from "../schemas/types";
import { useAuth } from "@/shared/hooks/use-auth";

export function useStaffUsers() {
  const { user } = useAuth();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStaffUsers = async () => {
    if (!user?.businessId) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await window.authAPI.getUsersByBusiness(user.businessId);

      if (response.success && response.users) {
        // Filter out admin users and convert to StaffUser format
        const staffUsers: StaffUser[] = response.users
          .filter((u) => u.role !== "admin")
          .map((u) => ({
            id: u.id,
            email: u.email || "",
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role as "cashier" | "manager",
            businessId: u.businessId,
            avatar: u.avatar,
            createdAt: u.createdAt || new Date().toISOString(),
            isActive: u.isActive !== undefined ? u.isActive : true,
          }));

        setStaffUsers(staffUsers);
      } else {
        const errorMessage = response.message || "Failed to load staff users";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load staff users";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffUsers();
  }, [user?.businessId]);

  return {
    staffUsers,
    isLoading,
    error,
    refetch: loadStaffUsers,
  };
}
```

#### Step 2.2: Create User Mutation Hooks

**File: `hooks/use-create-user.ts`**
```typescript
import { useState } from "react";
import { toast } from "sonner";
import type { UserCreateFormData } from "../schemas/user-schema";
import { useAuth } from "@/shared/hooks/use-auth";

export function useCreateUser() {
  const { createUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createStaffUser = async (data: UserCreateFormData) => {
    setIsLoading(true);
    
    try {
      const userData = {
        businessId: data.businessId,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        avatar: data.avatar || undefined,
        address: data.address || undefined,
        username: data.email, // Use email as username
        pin: "1234", // Default PIN, should be changed by admin/user later
      };

      const response = await createUser(userData);

      if (response.success) {
        toast.success("Staff member created successfully");
        return { success: true };
      } else {
        toast.error(response.message || "Failed to create staff member");
        if (response.errors && response.errors.length > 0) {
          response.errors.forEach((error) => toast.error(error));
        }
        return { success: false, errors: response.errors || [] };
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create staff member");
      return { success: false, errors: ["An unexpected error occurred"] };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createStaffUser,
    isLoading,
  };
}
```

**File: `hooks/use-update-user.ts`**
```typescript
import { useState } from "react";
import { toast } from "sonner";
import type { UserUpdateFormData } from "../schemas/user-schema";

export function useUpdateUser() {
  const [isLoading, setIsLoading] = useState(false);

  const updateStaffUser = async (data: UserUpdateFormData) => {
    setIsLoading(true);
    
    try {
      const updates: Record<string, string | number | boolean> = {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive,
      };

      if (data.avatar) {
        updates.avatar = data.avatar;
      }
      if (data.address) {
        updates.address = data.address;
      }

      const response = await window.authAPI.updateUser(data.id, updates);

      if (response.success) {
        toast.success("Staff member updated successfully");
        return { success: true };
      } else {
        toast.error(response.message || "Failed to update staff member");
        return { success: false, errors: [response.message || "Update failed"] };
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update staff member");
      return { success: false, errors: ["An unexpected error occurred"] };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateStaffUser,
    isLoading,
  };
}
```

**File: `hooks/use-delete-user.ts`**
```typescript
import { useState } from "react";
import { toast } from "sonner";

export function useDeleteUser() {
  const [isLoading, setIsLoading] = useState(false);

  const deleteStaffUser = async (userId: string, userName: string) => {
    setIsLoading(true);
    
    try {
      const response = await window.authAPI.deleteUser(userId);

      if (response.success) {
        toast.success("Staff member deleted successfully");
        return { success: true };
      } else {
        toast.error(response.message || "Failed to delete staff member");
        return { success: false, errors: [response.message || "Delete failed"] };
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete staff member");
      return { success: false, errors: ["An unexpected error occurred"] };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteStaffUser,
    isLoading,
  };
}
```

#### Step 2.3: Create Filter Hook

**File: `hooks/use-user-filters.ts`**
```typescript
import { useState, useMemo } from "react";
import type { StaffUser } from "../schemas/types";

export function useUserFilters(staffUsers: StaffUser[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const filteredUsers = useMemo(() => {
    return staffUsers.filter((staffUser) => {
      const matchesSearch =
        staffUser.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffUser.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffUser.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = filterRole === "all" || staffUser.role === filterRole;

      return matchesSearch && matchesRole;
    });
  }, [staffUsers, searchTerm, filterRole]);

  return {
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    filteredUsers,
  };
}
```

#### Step 2.4: Create Dialog State Hook

**File: `hooks/use-user-dialogs.ts`**
```typescript
import { useState } from "react";
import type { StaffUser } from "../schemas/types";

export function useUserDialogs() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);

  const openAddDialog = () => setIsAddDialogOpen(true);
  const closeAddDialog = () => setIsAddDialogOpen(false);

  const openEditDialog = (user: StaffUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };
  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  const openViewDialog = (user: StaffUser) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };
  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedUser(null);
  };

  return {
    isAddDialogOpen,
    isEditDialogOpen,
    isViewDialogOpen,
    selectedUser,
    openAddDialog,
    closeAddDialog,
    openEditDialog,
    closeEditDialog,
    openViewDialog,
    closeViewDialog,
  };
}
```

---

### Phase 3: Create UI Components

#### Step 3.1: Create Stats Cards Component

**File: `components/user-stats-cards.tsx`**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield } from "lucide-react";
import type { StaffUser } from "../schemas/types";

interface UserStatsCardsProps {
  staffUsers: StaffUser[];
}

export function UserStatsCards({ staffUsers }: UserStatsCardsProps) {
  const cashierCount = staffUsers.filter((u) => u.role === "cashier").length;
  const managerCount = staffUsers.filter((u) => u.role === "manager").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 md:px-6">
          <CardTitle className="text-xs sm:text-sm md:text-base lg:text-base font-medium">
            Total Staff
          </CardTitle>
          <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="px-3 sm:px-4 md:px-6">
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
            {staffUsers.length}
          </div>
          <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
            Active staff members
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 md:px-6">
          <CardTitle className="text-xs sm:text-sm md:text-base lg:text-base font-medium">
            Cashiers
          </CardTitle>
          <Shield className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="px-3 sm:px-4 md:px-6">
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
            {cashierCount}
          </div>
          <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
            Front desk staff
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 md:px-6">
          <CardTitle className="text-xs sm:text-sm md:text-base lg:text-base font-medium">
            Managers
          </CardTitle>
          <Shield className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="px-3 sm:px-4 md:px-6">
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
            {managerCount}
          </div>
          <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
            Management staff
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Step 3.2: Create Filters Component

**File: `components/user-filters.tsx`**
```typescript
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterRole: string;
  onRoleFilterChange: (value: string) => void;
}

export function UserFilters({
  searchTerm,
  onSearchChange,
  filterRole,
  onRoleFilterChange,
}: UserFiltersProps) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                placeholder="Search staff by name or email..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-7 sm:pl-10 h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base"
              />
            </div>
          </div>
          <Select value={filterRole} onValueChange={onRoleFilterChange}>
            <SelectTrigger className="w-full sm:w-48 h-8 sm:h-9 md:h-10 text-xs sm:text-sm md:text-base">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs sm:text-sm md:text-base">
                All Roles
              </SelectItem>
              <SelectItem value="cashier" className="text-xs sm:text-sm md:text-base">
                Cashiers
              </SelectItem>
              <SelectItem value="manager" className="text-xs sm:text-sm md:text-base">
                Managers
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Step 3.3: Create Form Components with React Hook Form

**File: `components/forms/add-user-form.tsx`**
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/shared/components/avatar-upload";
import { userCreateSchema, type UserCreateFormData } from "../../schemas/user-schema";
import { useAuth } from "@/shared/hooks/use-auth";

interface AddUserFormProps {
  onSubmit: (data: UserCreateFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function AddUserForm({ onSubmit, onCancel, isLoading }: AddUserFormProps) {
  const { user } = useAuth();

  const form = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "cashier",
      avatar: "",
      address: "",
      businessId: user?.businessId || "",
    },
  });

  const handleSubmit = async (data: UserCreateFormData) => {
    if (!user?.businessId) {
      form.setError("root", { message: "Business ID not found" });
      return;
    }

    const formData = {
      ...data,
      businessId: user.businessId,
    };

    await onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Avatar Upload */}
        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture (Optional)</FormLabel>
              <FormControl>
                <AvatarUpload
                  label="Profile Picture (Optional)"
                  value={field.value}
                  onChange={field.onChange}
                  type="user"
                  size="md"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                  First Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="John"
                    className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                  Last Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Smith"
                    className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                Email *
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john.smith@example.com"
                  className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                Address
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main Street, City, State"
                  className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                Role *
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cashier">
                    <div className="flex flex-col items-start">
                      <span className="text-xs sm:text-sm md:text-base lg:text-base">Cashier</span>
                      <span className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500">
                        Process sales and view basic reports
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex flex-col items-start">
                      <span className="text-xs sm:text-sm md:text-base lg:text-base">Manager</span>
                      <span className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500">
                        Full sales management and inventory control
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Fields */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                  Password *
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                  Confirm Password *
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
          >
            {isLoading ? "Creating..." : "Create Staff Member"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

#### Step 3.4: Create Dialog Components

**File: `components/dialogs/add-user-dialog.tsx`**
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddUserForm } from "../forms/add-user-form";
import type { UserCreateFormData } from "../../schemas/user-schema";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserCreateFormData) => Promise<void>;
  isLoading: boolean;
  trigger?: React.ReactNode;
}

export function AddUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  trigger,
}: AddUserDialogProps) {
  const handleSubmit = async (data: UserCreateFormData) => {
    await onSubmit(data);
    // Close dialog on success (handle in parent if needed)
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-[95vw] sm:max-w-md mx-2 sm:mx-4">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg md:text-xl lg:text-2xl">
            Add New Staff Member
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base lg:text-base">
            Create a new staff account with role-based permissions.
          </DialogDescription>
        </DialogHeader>
        <AddUserForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

### Phase 4: Refactor Main Component

**File: `user-management-view.tsx` (Refactored)**
```typescript
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus } from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import { Shield } from "lucide-react";
import { UserStatsCards } from "./components/user-stats-cards";
import { UserFilters } from "./components/user-filters";
import { UserTable } from "./components/user-table";
import { AddUserDialog } from "./components/dialogs/add-user-dialog";
import { EditUserDialog } from "./components/dialogs/edit-user-dialog";
import { ViewUserDialog } from "./components/dialogs/view-user-dialog";
import { useStaffUsers } from "./hooks/use-staff-users";
import { useUserFilters } from "./hooks/use-user-filters";
import { useUserDialogs } from "./hooks/use-user-dialogs";
import { useCreateUser } from "./hooks/use-create-user";
import { useUpdateUser } from "./hooks/use-update-user";
import { useDeleteUser } from "./hooks/use-delete-user";

export default function UserManagementView({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const { staffUsers, isLoading: isLoadingUsers, refetch } = useStaffUsers();
  const { searchTerm, setSearchTerm, filterRole, setFilterRole, filteredUsers } =
    useUserFilters(staffUsers);
  const {
    isAddDialogOpen,
    isEditDialogOpen,
    isViewDialogOpen,
    selectedUser,
    openAddDialog,
    closeAddDialog,
    openEditDialog,
    closeEditDialog,
    openViewDialog,
    closeViewDialog,
  } = useUserDialogs();
  const { createStaffUser, isLoading: isCreating } = useCreateUser();
  const { updateStaffUser, isLoading: isUpdating } = useUpdateUser();
  const { deleteStaffUser, isLoading: isDeleting } = useDeleteUser();

  const isAdmin = user?.role === "admin";

  // Handle loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-xs sm:text-sm md:text-base lg:text-base text-gray-600">
            You don't have permission to access user management.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateUser = async (data: any) => {
    const result = await createStaffUser(data);
    if (result.success) {
      await refetch();
      closeAddDialog();
    }
  };

  const handleUpdateUser = async (data: any) => {
    const result = await updateStaffUser(data);
    if (result.success) {
      await refetch();
      closeEditDialog();
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${userName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    const result = await deleteStaffUser(userId, userName);
    if (result.success) {
      await refetch();
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 px-2 sm:px-4 md:px-6">
      {/* Back button */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
        >
          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 break-words">
            User Management
          </h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 mt-1 break-words">
            Manage staff members and their permissions
          </p>
        </div>

        <AddUserDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={handleCreateUser}
          isLoading={isCreating}
          trigger={
            <Button className="text-xs sm:text-sm md:text-base lg:text-base w-full sm:w-auto h-8 sm:h-9 md:h-10">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Staff Member</span>
              <span className="sm:hidden">Add Staff</span>
            </Button>
          }
        />
      </div>

      {/* Stats Cards */}
      <UserStatsCards staffUsers={staffUsers} />

      {/* Filters */}
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterRole={filterRole}
        onRoleFilterChange={setFilterRole}
      />

      {/* Staff Table */}
      <UserTable
        users={filteredUsers}
        isLoading={isLoadingUsers}
        searchTerm={searchTerm}
        filterRole={filterRole}
        onViewUser={openViewDialog}
        onEditUser={openEditDialog}
        onDeleteUser={handleDeleteUser}
        onAddUser={openAddDialog}
      />

      {/* Edit Dialog */}
      {selectedUser && (
        <EditUserDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          user={selectedUser}
          onSubmit={handleUpdateUser}
          isLoading={isUpdating}
        />
      )}

      {/* View Dialog */}
      {selectedUser && (
        <ViewUserDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          user={selectedUser}
          onEdit={() => {
            closeViewDialog();
            openEditDialog(selectedUser);
          }}
        />
      )}
    </div>
  );
}
```

---

## ✅ Best Practices

### 1. **Separation of Concerns**
- **Hooks**: Handle business logic and data fetching
- **Components**: Handle UI rendering and user interactions
- **Schemas**: Handle validation and type safety
- **Utils**: Handle pure functions and helpers

### 2. **Type Safety**
- Use Zod schemas for runtime validation
- Infer TypeScript types from Zod schemas
- Avoid manual type definitions that can drift from validation

### 3. **Error Handling**
- Centralize error handling in hooks
- Provide user-friendly error messages
- Log errors for debugging

### 4. **Performance**
- Use `useMemo` for expensive computations (filtering, sorting)
- Use `useCallback` for event handlers passed to child components
- Lazy load dialog components if needed

### 5. **Testing**
- Test hooks in isolation
- Test components with mocked hooks
- Test schemas with various inputs
- Test form validation flows

### 6. **Accessibility**
- Use proper form labels
- Provide ARIA attributes where needed
- Ensure keyboard navigation works

---

## 🚀 Implementation Order

1. **Phase 1**: Setup foundation (schemas, types, utils)
2. **Phase 2**: Create hooks (data fetching, mutations)
3. **Phase 3**: Create UI components (forms, dialogs, tables)
4. **Phase 4**: Refactor main component to use new structure
5. **Phase 5**: Testing and refinement

---

## 📝 Migration Checklist

- [ ] Create directory structure
- [ ] Install dependencies (zod, react-hook-form, @hookform/resolvers)
- [ ] Create schemas and types
- [ ] Create utility functions
- [ ] Create custom hooks
- [ ] Create form components with React Hook Form
- [ ] Create dialog components
- [ ] Create table and filter components
- [ ] Refactor main component
- [ ] Test all functionality
- [ ] Update imports in parent components
- [ ] Remove old file
- [ ] Code review
- [ ] Documentation update

---

## 🔍 Key Benefits

1. **Maintainability**: Each file has a single responsibility
2. **Reusability**: Hooks and components can be reused
3. **Testability**: Easier to test isolated units
4. **Type Safety**: Zod ensures runtime and compile-time safety
5. **Developer Experience**: Clear structure, better IntelliSense
6. **Performance**: Better code splitting opportunities
7. **Scalability**: Easy to add new features or modify existing ones

---

## 📚 Additional Resources

- [Zod Documentation](https://zod.dev/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Shadcn UI Form Components](https://ui.shadcn.com/docs/components/form)

---

**Note**: This refactoring should be done incrementally, testing after each phase to ensure functionality is maintained throughout the process.

