# Permission Constants Documentation

## 📋 Overview

`packages/shared/src/constants/permissions.ts` is the **single source of truth** for all permission definitions in the AuraSwift POS system. This file defines what permissions exist, how they're structured, and provides utilities for working with them.

## 🎯 What It Is

This file contains:
- **Permission Constants** (`PERMISSIONS`) - All available permissions in the system
- **Helper Functions** - Utilities to work with permissions
- **Type Definitions** - TypeScript types for type-safe permission handling

## 🏗️ Permission Format

All permissions follow the format: `"action:resource"`

### Actions:
- `read` - View/read data
- `write` - Create/modify data
- `manage` - Full CRUD operations
- `view` - View-only access
- `override` - Override normal restrictions
- `refund` - Issue refunds
- `discount` - Apply discounts

### Resources:
- `sales` - Sales transactions
- `reports` - Reports and analytics
- `inventory` - Inventory management
- `users` - User management
- `settings` - System settings
- `analytics` - Analytics dashboard
- `transactions` - Transaction operations
- `products` - Product management
- `categories` - Category management
- `suppliers` - Supplier management
- `customers` - Customer management

### Special Permission:
- `*:*` - Wildcard permission that grants all permissions (admin/owner only)

## 📦 What's Exported

### Constants

```typescript
PERMISSIONS.SALES_READ          // "read:sales"
PERMISSIONS.SALES_WRITE         // "write:sales"
PERMISSIONS.INVENTORY_MANAGE    // "manage:inventory"
PERMISSIONS.USERS_MANAGE        // "manage:users"
PERMISSIONS.REPORTS_READ        // "read:reports"
PERMISSIONS.REPORTS_WRITE       // "write:reports"
PERMISSIONS.ANALYTICS_VIEW      // "view:analytics"
PERMISSIONS.TRANSACTIONS_OVERRIDE // "override:transactions"
PERMISSIONS.TRANSACTIONS_REFUND // "refund:transactions"
PERMISSIONS.DISCOUNTS_APPLY    // "discount:apply"
PERMISSIONS.SETTINGS_MANAGE     // "manage:settings"
PERMISSIONS.PRODUCTS_MANAGE     // "manage:products"
PERMISSIONS.CATEGORIES_MANAGE   // "manage:categories"
PERMISSIONS.SUPPLIERS_MANAGE    // "manage:suppliers"
PERMISSIONS.CUSTOMERS_MANAGE    // "manage:customers"
PERMISSIONS.ALL                 // "*:*" (all permissions)
```

### Functions

#### `getAllAvailablePermissions(): string[]`
Returns all available permissions as an array, sorted with `*:*` first, then alphabetically.

**Usage:**
```typescript
import { getAllAvailablePermissions } from "@app/shared/constants/permissions";

const permissions = getAllAvailablePermissions();
// Returns: ["*:*", "discount:apply", "manage:categories", ...]
```

#### `isValidPermission(permission: string): boolean`
Validates if a permission string is a valid permission defined in the system.

**Usage:**
```typescript
import { isValidPermission } from "@app/shared/constants/permissions";

if (isValidPermission("read:sales")) {
  // Valid permission
}
```

### Types

#### `Permission`
Type-safe permission string type derived from `PERMISSIONS` object.

**Usage:**
```typescript
import type { Permission } from "@app/shared/constants/permissions";

const perm: Permission = PERMISSIONS.SALES_READ; // Type-safe
```

## 🔄 How It Works

### 1. **Single Source of Truth**
- All permissions are defined in ONE place
- Both frontend and backend import from this file
- No duplication or sync issues

### 2. **Type Safety**
- TypeScript ensures only valid permissions are used
- Compile-time checking prevents typos
- IDE autocomplete for all permissions

### 3. **Runtime Validation**
- `isValidPermission()` can validate permissions at runtime
- Backend validates permissions before saving to database
- Prevents invalid permissions from being stored

## 📍 Where It's Used

### Frontend (Renderer Process)

#### 1. **Role Management UI**
**Files:**
- `packages/renderer/src/views/dashboard/pages/admin/views/rbac-management/components/create-role-dialog.tsx`
- `packages/renderer/src/views/dashboard/pages/admin/views/rbac-management/components/edit-role-dialog.tsx`

**Usage:**
```typescript
import { getAllAvailablePermissions } from "@app/shared/constants/permissions";

const AVAILABLE_PERMISSIONS = getAllAvailablePermissions();
// Used to populate permission checkboxes in role creation/editing dialogs
```

**What it does:**
- Displays all available permissions as checkboxes
- Users can select which permissions to assign to a role
- The list automatically updates when permissions are added/removed from this file

### Backend (Main Process)

#### 1. **Authorization Checks**
**Files:**
- `packages/main/src/ipc/role.handlers.ts`
- `packages/main/src/ipc/auth.handlers.ts`
- `packages/main/src/ipc/transaction.handler.ts`
- `packages/main/src/utils/authHelpers.ts`

**Usage:**
```typescript
import { PERMISSIONS } from "@app/shared/constants/permissions";

// Check if user has permission to manage users
const auth = await validateSessionAndPermission(
  db,
  sessionToken,
  PERMISSIONS.USERS_MANAGE
);

if (!auth.success) {
  return { success: false, message: "Unauthorized" };
}
```

**What it does:**
- Validates user permissions before allowing actions
- Protects API endpoints and IPC handlers
- Ensures only authorized users can perform sensitive operations

#### 2. **Database Schema**
**File:**
- `packages/main/src/database/schema.ts`

**Usage:**
```typescript
import type { Permission } from "@app/shared/constants/permissions";

permissions: text("permissions", { mode: "json" })
  .$type<Permission[]>()
  .notNull(),
```

**What it does:**
- Defines the type for permissions stored in the database
- Ensures type safety when working with role permissions
- Validates that stored permissions match the defined types

#### 3. **RBAC Helpers**
**File:**
- `packages/main/src/utils/rbacHelpers.ts`

**Usage:**
```typescript
import type { Permission } from "@app/shared/constants/permissions";

// Used in getUserPermissions() to aggregate permissions from roles
```

**What it does:**
- Aggregates permissions from multiple roles
- Resolves user permissions for authorization checks
- Caches permissions for performance

## 🎨 Why This Architecture?

### Benefits:

1. **Single Source of Truth**
   - No duplication - permissions defined once
   - No sync issues between frontend and backend
   - Easy to maintain and update

2. **Type Safety**
   - TypeScript catches permission typos at compile time
   - IDE autocomplete for all permissions
   - Prevents runtime errors from invalid permissions

3. **Consistency**
   - Frontend and backend always use the same permissions
   - UI automatically reflects permission changes
   - No manual updates needed in multiple files

4. **Security**
   - Centralized validation
   - Easy to audit what permissions exist
   - Prevents unauthorized permissions from being created

5. **Developer Experience**
   - Clear, documented permission structure
   - Easy to add new permissions
   - Self-documenting code

## 🔧 How to Add/Edit/Delete Permissions

### Adding a New Permission

1. **Edit `packages/shared/src/constants/permissions.ts`**
   ```typescript
   export const PERMISSIONS = {
     // ... existing permissions
     
     /** New permission description */
     NEW_PERMISSION: "action:resource",
   } as const;
   ```

2. **That's it!** The permission is now:
   - Available in the frontend UI (role dialogs)
   - Available for backend authorization checks
   - Type-safe and validated

### Editing a Permission

1. **Edit the permission value in `packages/shared/src/constants/permissions.ts`**
   ```typescript
   // Change from "old:permission" to "new:permission"
   OLD_PERMISSION: "new:permission",
   ```

2. **Note:** This will affect existing roles in the database. You may need to:
   - Update existing roles manually
   - Create a migration script
   - Update permission checks in code

### Deleting a Permission

1. **Remove the permission from `packages/shared/src/constants/permissions.ts`**

2. **Clean up references:**
   - Remove from any hardcoded permission lists
   - Update roles that use this permission
   - Remove permission checks in code

## 📊 Permission Flow

```
┌─────────────────────────────────────┐
│  packages/shared/src/constants/     │
│  permissions.ts                     │
│  (Single Source of Truth)           │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Frontend   │   │  Backend     │
│  (Renderer) │   │  (Main)      │
└─────────────┘   └─────────────┘
       │                 │
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Role       │   │  Auth       │
│  Dialogs    │   │  Checks     │
│  (UI)       │   │  (API/IPC)  │
└─────────────┘   └─────────────┘
       │                 │
       │                 │
       └────────┬────────┘
                │
                ▼
        ┌───────────────┐
        │   Database    │
        │   (Roles)     │
        └───────────────┘
```

## 🔒 Security Considerations

1. **Validation**
   - Always validate permissions before saving to database
   - Use `isValidPermission()` to check permissions
   - Reject invalid permissions with clear error messages

2. **Authorization**
   - Never trust client-side permission checks alone
   - Always validate permissions on the backend
   - Use `PERMISSIONS` constants, not hardcoded strings

3. **Audit**
   - All permission changes should be logged
   - Track who assigned what permissions to which roles
   - Monitor permission usage for security

## 📝 Examples

### Example 1: Frontend - Display Permissions in UI

```typescript
import { getAllAvailablePermissions } from "@app/shared/constants/permissions";

function PermissionSelector() {
  const permissions = getAllAvailablePermissions();
  
  return (
    <div>
      {permissions.map(permission => (
        <Checkbox key={permission} value={permission}>
          {permission}
        </Checkbox>
      ))}
    </div>
  );
}
```

### Example 2: Backend - Check Permission

```typescript
import { PERMISSIONS } from "@app/shared/constants/permissions";

ipcMain.handle("users:delete", async (event, sessionToken, userId) => {
  const auth = await validateSessionAndPermission(
    db,
    sessionToken,
    PERMISSIONS.USERS_MANAGE
  );
  
  if (!auth.success) {
    return { success: false, message: "Unauthorized" };
  }
  
  // User has permission, proceed with deletion
  // ...
});
```

### Example 3: Validate Permissions Before Saving

```typescript
import { isValidPermission } from "@app/shared/constants/permissions";

function createRole(roleData) {
  // Validate all permissions
  const invalidPermissions = roleData.permissions.filter(
    perm => !isValidPermission(perm)
  );
  
  if (invalidPermissions.length > 0) {
    throw new Error(`Invalid permissions: ${invalidPermissions.join(", ")}`);
  }
  
  // All permissions are valid, proceed
  // ...
}
```

## 🚀 Best Practices

1. **Always use constants, never hardcode**
   ```typescript
   // ✅ Good
   if (user.permissions.includes(PERMISSIONS.USERS_MANAGE)) { ... }
   
   // ❌ Bad
   if (user.permissions.includes("manage:users")) { ... }
   ```

2. **Import from shared package**
   ```typescript
   // ✅ Good
   import { PERMISSIONS } from "@app/shared/constants/permissions";
   
   // ❌ Bad
   import { PERMISSIONS } from "../constants/permissions";
   ```

3. **Validate permissions before saving**
   ```typescript
   // ✅ Good
   if (!isValidPermission(permission)) {
     throw new Error("Invalid permission");
   }
   ```

4. **Use type-safe Permission type**
   ```typescript
   // ✅ Good
   const permissions: Permission[] = [PERMISSIONS.SALES_READ];
   
   // ❌ Bad
   const permissions: string[] = ["read:sales"];
   ```

## 📚 Related Files

- **Backend Metadata:** `packages/main/src/constants/permissions.ts`
  - Contains `PERMISSION_GROUPS` (role templates)
  - Contains `PERMISSION_DESCRIPTIONS` (metadata)
  - Backend-specific helpers

- **Database Schema:** `packages/main/src/database/schema.ts`
  - Defines how permissions are stored in database
  - Uses `Permission` type from shared package

- **Role Management:** `packages/main/src/database/managers/roleManager.ts`
  - Creates and updates roles with permissions
  - Parses permissions from database

## 🔄 Migration Notes

If you're migrating from old permission code:
- All imports should use `@app/shared/constants/permissions`
- Old re-export files have been removed
- No backward compatibility - use shared package directly

## ❓ FAQ

**Q: Can I add custom permissions?**  
A: Yes! Just add them to `PERMISSIONS` object in this file. They'll automatically appear in the UI and be available for validation.

**Q: What happens if I delete a permission?**  
A: Existing roles with that permission will still have it in the database, but it won't be available for new roles. You may need to clean up existing roles.

**Q: Can I use wildcard permissions?**  
A: Yes, `PERMISSIONS.ALL` (`*:*`) grants all permissions. Use sparingly, typically only for admin roles.

**Q: How do I check if a user has a permission?**  
A: Use `validateSessionAndPermission()` in backend, or check `user.permissions.includes(PERMISSIONS.XXX)` in frontend.

**Q: Where are permissions stored?**  
A: Permissions are stored in the `roles` table in the database as a JSON array. They're aggregated from all user roles when checking authorization.

