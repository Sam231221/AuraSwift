# RBAC System Fix Plan

## Problem Analysis

The RBAC UI pages show "Unauthorized: Insufficient permissions" even though:

- ✅ Roles exist in database with correct permissions
- ✅ Users have roles assigned (both `primary_role_id` and `user_roles` table)
- ✅ Admin role has `["*:*"]` permission
- ✅ Manager role has `["manage:users"]` permission
- ✅ `getUserPermissions()` function is correctly implemented

### Root Cause Investigation Needed

The issue appears to be in the permission resolution chain. Need to verify:

1. Is `getUserPermissions()` being called correctly?
2. Is role.permissions being parsed correctly (it's stored as JSON string)?
3. Is the permission cache working correctly?

## Systematic Fix Strategy

### Phase 1: Critical Fixes (Immediate - Unblock RBAC Pages)

#### 1.1 Add Debug Logging to Permission System

**File**: `packages/main/src/utils/rbacHelpers.ts`
**Changes**:

- Add console.log in `getUserPermissions()` to show:
  - userId being checked
  - userRoles found
  - Permissions from each role
  - Final aggregated permissions
- This will help identify where the permission resolution is failing

#### 1.2 Check JSON Parsing of Role Permissions

**Issue**: `role.permissions` is stored as JSON string `"[\"*:*\"]"` but code expects array
**File**: `packages/main/src/database/managers/roleManager.ts`
**Changes**:

- Verify `getRoleById()` parses the JSON string to array
- If not, add parsing logic

#### 1.3 Fix Audit Log Timestamp Error

**Error**: `TypeError: value.getTime is not a function`
**File**: `packages/main/src/utils/authHelpers.ts` line ~305
**Issue**: Passing `new Date().toISOString()` to details object, but schema expects timestamp as number
**Fix**:

```typescript
details: {
  permission: requiredPermission,
  reason: permissionCheck.reason,
  timestamp: Date.now(), // Use number instead of ISO string
}
```

### Phase 2: Schema & Manager Fixes

#### 2.1 Fix TimeTracking System

**Files**:

- `packages/main/src/database/managers/timeTrackingManager.ts`
- `packages/main/src/database/managers/timeTrackingReportManager.ts`

**Issues**:

- References `schema.timeShifts` which doesn't exist
- Should use `schema.shifts` instead
- Field names need updating (camelCase → snake_case):
  - `clockInId` → `clock_in_id`
  - `userId` → `user_id`
  - `businessId` → `business_id`
  - `shiftStart` → `shift_start`
  - `shiftEnd` → `shift_end`

**Impact**: Prevents "Get active shift IPC error" and shift cleanup errors

#### 2.2 Fix Shift Cleanup Query

**Error**: `SqliteError: near "=": syntax error`
**File**: `packages/main/src/database/managers/shiftManager.ts`
**Method**: `autoCloseOldActiveShifts()`
**Issue**: Malformed SQL query, likely using wrong field names or syntax

### Phase 3: Authentication & Session Management

#### 3.1 Update User Authentication Response

**File**: `packages/main/src/utils/authHelpers.ts`
**Method**: `validateSession()` and `createSession()`
**Changes**:

- Ensure user object returned includes:
  - `primaryRoleId`
  - Populated `primaryRole` object with `name` field
  - Aggregated `permissions` array from RBAC system
- Update session creation to cache user permissions

#### 3.2 Fix Dashboard Routing Logic

**Files**: Search for all files using `user.role` string pattern
**Changes**:

- Replace `user.role === 'admin'` with `user.primaryRole?.name === 'admin'`
- Or use permission-based checks: `hasPermission(user, PERMISSIONS.ADMIN_ACCESS)`

**Files Likely Affected**:

- `packages/renderer/src/views/dashboard/*`
- `packages/renderer/src/shared/hooks/use-auth.ts`
- Navigation guards/route protection

### Phase 4: Frontend Updates

#### 4.1 Update Auth Store Type

**File**: `packages/renderer/src/shared/types/global.d.ts`
**Changes**:

- Update `User` interface to include:
  ```typescript
  interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    businessId: string;
    primaryRoleId: string;
    primaryRole?: {
      id: string;
      name: string;
      displayName: string;
    };
    permissions: string[];
    role: string; // Keep for backward compatibility, derived from primaryRole.name
    isActive: boolean;
    createdAt: number;
  }
  ```

#### 4.2 Update useAuth Hook

**File**: `packages/renderer/src/shared/hooks/use-auth.ts`
**Changes**:

- Ensure hook provides user with complete role and permission data
- Add helper methods: `hasPermission(permission)`, `hasAnyPermission(permissions[])`

### Phase 5: Testing & Validation

#### 5.1 Test Permission Flow

1. Admin user should have `["*:*"]` permission
2. Manager user should have `["manage:users"]` among others
3. Cashier user should have limited permissions
4. Verify RBAC pages load for admin/manager
5. Verify role assignment/revocation works

#### 5.2 Test Dashboard Routing

1. Admin sees all menu items
2. Manager sees limited menu items
3. Cashier sees minimal menu items
4. Verify clock in/clock out works
5. Verify no console errors

## Execution Order

### Immediate (Do First)

1. ✅ Add debug logging to `getUserPermissions()`
2. ✅ Fix JSON parsing in `getRoleById()`
3. ✅ Fix audit log timestamp error
4. ✅ Test RBAC pages load

### High Priority (Next)

5. Fix timeTracking managers (`timeShifts` → `shifts`)
6. Fix shift cleanup SQL error
7. Update user authentication to include role data

### Medium Priority

8. Update dashboard routing logic
9. Update frontend User interface
10. Add permission helper methods to useAuth

### Final

11. Remove console.log debug statements
12. Full end-to-end testing
13. Document new RBAC patterns for team

## Success Criteria

- ✅ RBAC management pages load without permission errors
- ✅ Admin can view/create/edit/delete roles
- ✅ Admin/Manager can assign/revoke user roles
- ✅ No "Get active shift IPC error" in console
- ✅ No "Failed to log permission denial" errors
- ✅ Dashboard routing works based on user role
- ✅ Clock in/clock out system functional

## Risk Assessment

**Low Risk**: Debug logging, audit log fix
**Medium Risk**: TimeTracking fixes (isolated system)
**High Risk**: Authentication/session changes (affects all authenticated flows)

## Rollback Strategy

1. Keep backup of current database
2. Git commit after each phase
3. If authentication changes cause issues, revert to previous session structure
4. Cache can be cleared via `clearPermissionCache()` if needed
