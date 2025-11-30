# Authentication State Management Documentation

## Overview

This document describes how authentication state is managed across the application, including session storage, state synchronization, and cache management.

## State Storage Locations

Authentication state is stored in multiple locations for different purposes:

### 1. Database 

**Location:** `packages/main/src/database/schema.ts` - `sessions` table

**Purpose:**

- Authoritative session data
- Server-side validation
- Session expiry tracking

**Fields:**

- `id` - Session ID
- `userId` - User ID
- `token` - Access token
- `refreshToken` - Refresh token (optional, for desktop EPOS typically not used)
- `expiresAt` - Token expiry timestamp
- `refreshExpiresAt` - Refresh token expiry (optional)
- `createdAt`, `updatedAt` - Timestamps

**Access:** Only via backend IPC handlers

---

### 2. Electron SafeStorage (Secure Local Storage)

**Location:** `packages/renderer/src/views/auth/context/auth-context.tsx`

**Purpose:**

- Secure token storage (OS-level encryption)
- Session restoration on app restart
- Fast access without database queries

**Storage Keys:**

- `token` - Session token (encrypted)
- `user` - User object (encrypted)
- `salesMode` - Sales mode (admin/cashier)
- `requiresShift` - Shift requirement flag
- `clockEvent` - Current clock event
- `activeShift` - Active time shift

**Access:** Via `window.authStore` API (IPC to main process)

**Security:**

- Uses Electron's `safeStorage` API
- Encrypted at OS level (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- Automatically encrypted/decrypted by Electron

---

### 3. React Context (In-Memory State)

**Location:** `packages/renderer/src/views/auth/context/auth-context.tsx`

**Purpose:**

- Current user state for UI components
- Loading/error states
- Real-time state updates

**State:**

- `user` - Current user object (or null)
- `isLoading` - Loading state for auth operations
- `isInitializing` - Initial session validation state
- `error` - Error message (if any)

**Lifecycle:**

- Initialized on app start
- Updated on login/logout
- Cleared on logout

---

### 4. Permission Cache (In-Memory)

**Location:**

- Backend: `packages/main/src/utils/rbacHelpers.ts`
- Frontend: `packages/renderer/src/features/dashboard/hooks/use-user-permissions.ts`

**Purpose:**

- Performance optimization
- Reduce database queries
- Fast permission checks

**Cache Details:**

- **Backend:** 5-minute TTL, per-user cache
- **Frontend:** 5-minute TTL, per-user cache
- **Invalidation:** On login, logout, role/permission changes

**Storage:**

- In-memory `Map<string, { permissions: string[], timestamp: number }>`
- Not persisted (cleared on app restart)

---

## State Synchronization Flow

### Login Flow

```
1. User selects user + enters PIN
2. Frontend calls authAPI.login()
3. Backend validates credentials
4. Backend creates session in database
5. Backend returns token + user
6. Frontend stores in safeStorage (encrypted)
7. Frontend updates React context
8. Frontend clears permission cache
9. Backend invalidates permission cache
```

### Session Validation Flow (App Start)

```
1. App starts, AuthProvider mounts
2. Check if auth operation in progress (ref flag)
3. If not, read token from safeStorage
4. Call authAPI.validateSession(token)
5. Backend validates against database
6. If valid: Update React context + safeStorage
7. If invalid: Clear safeStorage + React context
```

### Logout Flow

```
1. User clicks logout
2. Frontend calls authAPI.logout(token)
3. Backend deletes session from database
4. Backend invalidates permission cache
5. Frontend clears safeStorage
6. Frontend clears React context
7. Frontend clears permission cache
```

### Permission Check Flow

```
1. Component calls useUserPermissions() hook
2. Hook checks frontend cache (5min TTL)
3. If cache hit: Return cached permissions
4. If cache miss: Call rbacAPI.getUserPermissions()
5. Backend checks backend cache (5min TTL)
6. If backend cache miss: Query database (RBAC aggregation)
7. Backend returns permissions
8. Frontend updates cache
9. Hook returns permissions to component
```

---

## Cache Invalidation Strategy

### When Backend Cache is Invalidated:

1. **User login** - `auth.handlers.ts:186`
2. **User logout** - `auth.handlers.ts:401`
3. **Role assignment** - `role.handlers.ts:438`
4. **Role update** - `role.handlers.ts` (when permissions change)
5. **User update** - `auth.handlers.ts:549` (when role changes)
6. **Permission grant/revoke** - `permission.handlers.ts` (if exists)

### When Frontend Cache is Invalidated:

1. **User login** - `auth-context.tsx:54`
2. **User logout** - `use-user-permissions.ts:53`
3. **User changes** - `use-user-permissions.ts:146`

### Cache Locking (Backend)

- Uses promise-based locking to prevent race conditions
- Multiple concurrent requests share the same load promise
- Prevents duplicate database queries

---

## State Consistency Guarantees

### Single Source of Truth

- **Database** is the authoritative source for sessions
- **SafeStorage** is a secure cache for fast access
- **React Context** is the UI state representation
- **Permission Cache** is a performance optimization

### Synchronization Points

1. **On Login:** All storage locations updated atomically
2. **On Logout:** All storage locations cleared atomically
3. **On Session Validation:** Database → SafeStorage → React Context
4. **On Permission Check:** Database → Backend Cache → Frontend Cache

### Race Condition Prevention

- **Auth Operations:** Use refs to prevent concurrent operations
- **Session Validation:** AbortController cancels validation during login
- **Permission Loading:** Promise-based locking prevents duplicate loads

---

## Best Practices

### ✅ DO:

- Always validate sessions via backend API
- Use `useUserPermissions()` hook for permission checks
- Clear caches on login/logout
- Use React context for UI state
- Store sensitive data in safeStorage (encrypted)

### ❌ DON'T:

- Don't check permissions locally (use backend RBAC)
- Don't trust frontend state for security decisions
- Don't bypass session validation
- Don't store tokens in plain localStorage
- Don't use deprecated `hasPermission()` from `auth.ts`

---

## Troubleshooting

### Issue: User logged out but still sees UI

**Solution:** Check if React context is cleared on logout

### Issue: Permissions not updating after role change

**Solution:** Verify cache invalidation is called in role update handler

### Issue: Session validation fails after login

**Solution:** Check race condition handling (should be fixed with refs)

### Issue: Token stored but user not authenticated

**Solution:** Verify session validation runs on app start

---

## Migration Notes

### From Deprecated System:

- ❌ `user.role` → ✅ `getUserRoleName(user)`
- ❌ `user.permissions` → ✅ `useUserPermissions()` hook
- ❌ `hasPermission(user, action, resource)` → ✅ `hasPermission(permission)` from hook
- ❌ Local permission checks → ✅ Backend RBAC checks

---

**Last Updated:** 2025-01-XX  
**Maintainer:** Development Team
