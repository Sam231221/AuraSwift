# RBAC Debug Guide - Roles Not Loading

## Problem Identified

The issue is **NOT** with the RBAC code itself. The actual problem is:

### Root Cause

**Stale Session Data**: The frontend is using a cached user ID (`64cf50bf-397b-401c-b7e8-f7bfa995820b`) that no longer exists in the database after reseeding.

### What Happened

1. Database was reset/reseeded with new user IDs
2. Frontend still has old user data cached in memory/storage
3. When RBAC tries to fetch roles for the old user ID, it correctly returns 0 roles (because that user doesn't exist)
4. This causes "Unauthorized: Insufficient permissions" errors

### Current Database State

```
✅ Users exist: admin, manager, cashier
✅ Roles exist: admin, manager, cashier
✅ User-role assignments exist for all 3 users
✅ Permissions are correctly defined on roles
```

### The Old "Bootstrap" Approach (Removed)

The bootstrap code was a workaround that tried to auto-assign roles. This is bad practice because:

- It masks the real problem (stale sessions)
- It could cause security issues
- It doesn't solve the underlying issue

## Solution

### Immediate Fix (Do This Now)

**Logout and login again** to get a fresh session with the correct user ID.

### How to Logout/Login

1. In the app, click logout button
2. If that doesn't work, clear the browser storage:
   - Open DevTools (Cmd+Option+I on Mac)
   - Go to Application tab → Local Storage or IndexedDB
   - Clear all storage
3. Reload the app (Cmd+R)
4. Login with seeded credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
   - **PIN**: `1234`

### What the Fix Does

The code now:

1. **Detects stale sessions**: When a user doesn't exist, returns `USER_NOT_FOUND` code
2. **Forces logout**: Frontend automatically logs out and clears stale data
3. **Prompts re-login**: User sees clear message to log in again
4. **Prevents confusion**: No more silent failures or misleading bootstrap attempts

## Verification Steps

After logging in with fresh credentials:

1. **Check Console**: You should see

   ```
   [getActiveRolesByUser] Found 1 roles
   [getUserPermissions] Found 1 active roles for user
   [getUserPermissions] Final aggregated permissions: ["*:*"]
   ```

2. **RBAC Pages Load**: Role Management page should display roles without errors

3. **No More Bootstrap Errors**: No "BOOTSTRAP_ERROR" or "ALREADY_HAS_ROLES" messages

## For Future Development

### Best Practices

1. **Never auto-assign roles** based on "no roles found" - this could be a security issue
2. **Always validate sessions** before checking permissions
3. **Return clear error codes** to help frontend handle stale sessions
4. **Force session refresh** after database resets in development

### Session Management

- Sessions are stored in both `sessions` table and `app_settings` table
- Frontend caches user data in memory (React state)
- After database reset, always clear frontend cache

## Technical Details

### Why Drizzle Queries Were Working

The column name mapping (snake_case → camelCase) in Drizzle was working correctly:

```typescript
// Schema definition
userId: text("user_id"); // Maps DB column user_id to TypeScript property userId
```

### Why getActiveRolesByUser Returned 0 Roles

```sql
-- This query WAS working correctly
SELECT * FROM user_roles WHERE user_id = '64cf50bf-397b-401c-b7e8-f7bfa995820b'
-- Returns 0 rows because this user ID doesn't exist in the database anymore
```

### Current User IDs in Database

```
Admin:   82504440-5e54-4785-9df2-89807fb48d2e
Manager: 34b162ce-ecdf-4077-bb98-640a0b810984
Cashier: 9afa5a87-b0ab-4925-b78c-c8d38693e72d
```

## Files Modified

1. **packages/renderer/.../useRoles.ts**

   - Removed bootstrap logic
   - Added stale session detection
   - Auto-logout on USER_NOT_FOUND

2. **packages/main/src/appStore.ts**

   - Removed rbac:bootstrap handler
   - Added session validation before permission check
   - Better error logging

3. **packages/preload/src/api/rbac.ts**
   - Removed bootstrap API method

## Summary

✅ **Problem**: Stale frontend session referencing non-existent user  
✅ **Solution**: Logout + login to get fresh session  
✅ **Prevention**: Better error handling to auto-detect and clear stale sessions  
✅ **Result**: RBAC system works perfectly once session is fresh
