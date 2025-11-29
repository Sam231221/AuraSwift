# Permission Constants - Clean Architecture

## ✅ Migration Complete

All old permission code has been removed. Everything now uses the shared package directly.

## 📦 Single Source of Truth

**Edit permissions in ONE place only:**
```
packages/shared/src/constants/permissions.ts
```

## 📝 Current File Structure

### Shared Package (Core Permissions)
- `packages/shared/src/constants/permissions.ts` - **SINGLE SOURCE OF TRUTH**
  - `PERMISSIONS` - All permission constants
  - `getAllAvailablePermissions()` - Get all permissions for UI
  - `isValidPermission()` - Validate permission strings
  - `Permission` type - Type-safe permission type

### Main Process (Backend-Specific Metadata)
- `packages/main/src/constants/permissions.ts` - Backend metadata only
  - `PERMISSION_GROUPS` - Role permission groups (used in seed.ts)
  - `PERMISSION_DESCRIPTIONS` - Permission metadata for backend
  - `getPermissionsForRole()` - Backend helper
  - `getPermissionInfo()` - Backend helper
  - `getPermissionsByRiskLevel()` - Backend helper

### Renderer Process
- No permission constants file (deleted)
- All components import directly from `@app/shared/constants/permissions`

## ✅ Files Using Shared Package

### Main Process:
1. ✅ `packages/main/src/ipc/role.handlers.ts`
2. ✅ `packages/main/src/utils/rbacHelpers.ts`
3. ✅ `packages/main/src/ipc/auth.handlers.ts`
4. ✅ `packages/main/src/ipc/transaction.handler.ts`
5. ✅ `packages/main/src/database/schema.ts`

### Renderer Process:
1. ✅ `packages/renderer/src/views/dashboard/pages/admin/views/rbac-management/components/create-role-dialog.tsx`
2. ✅ `packages/renderer/src/views/dashboard/pages/admin/views/rbac-management/components/edit-role-dialog.tsx`

### Backend Metadata (Main Only):
- `packages/main/src/database/seed.ts` - Uses `PERMISSION_GROUPS` from main constants

## 🎯 Usage

**All code should import from shared package:**
```typescript
import { PERMISSIONS, getAllAvailablePermissions } from "@app/shared/constants/permissions";
```

**Backend-specific metadata (if needed):**
```typescript
import { PERMISSION_GROUPS } from "../constants/permissions";
```

## 🗑️ Removed Files

- ❌ `packages/renderer/src/shared/constants/permissions.ts` - **DELETED** (no longer needed)
