# Critical Auth Fixes - Immediate Action Plan

**Date:** November 29, 2025  
**Priority:** 🔴 CRITICAL  
**Timeline:** 3-5 days  
**Risk Level:** Production deployment blocker

---

## 🎯 Overview

This document provides step-by-step instructions to fix the **6 most critical security vulnerabilities** identified in the auth system code review. These must be fixed before any production deployment.

---

## 🔴 CRITICAL FIX #1: Unify User Type Definitions

**Time Required:** 1 hour  
**Risk:** Type safety broken, runtime errors  
**Files Affected:** 3 files only! ✅

### ✅ Good News!

Your database schema is **already clean** - no legacy `role` or `permissions` fields exist in `schema.ts`. Only RBAC fields remain:

- ✅ `primaryRoleId` - references roles table
- ✅ `shiftRequired` - boolean flag
- ✅ `activeRoleContext` - for role switching

### Current Problem

Two User type definitions exist:

1. **`packages/renderer/src/views/auth/types/auth.types.ts`** (has deprecated `role?: "admin" | "manager" | "cashier"`)
2. **`packages/renderer/src/shared/types/user.ts`** (RBAC-compliant, clean) ✅

Only **3 files** import from the old type:

- `packages/renderer/src/views/auth/context/auth-context.tsx` - imports `User` and `AuthContextType`
- `packages/renderer/src/shared/utils/auth.ts` - imports `User`
- `packages/renderer/src/shared/hooks/use-auth.tsx` - imports `AuthContextType`

### Quick Reference: What Needs to Change

| File                        | Current Import                         | New Import                   |
| --------------------------- | -------------------------------------- | ---------------------------- |
| `auth-context.tsx`          | `from "../types/auth.types"`           | `from "@/shared/types/user"` |
| `shared/utils/auth.ts`      | `from "@/views/auth/types/auth.types"` | `from "@/shared/types/user"` |
| `shared/hooks/use-auth.tsx` | `from "@/views/auth/types/auth.types"` | `from "@/shared/types/user"` |

Then delete: `packages/renderer/src/views/auth/types/auth.types.ts`

### Steps to Fix

#### 1. Move AuthContextType to shared types

First, we need to move the type definitions to the shared location.

**Add to `packages/renderer/src/shared/types/user.ts`:**

```typescript
/**
 * User Type Definitions for RBAC System
 */

// ... existing Permission, Role, User interfaces ...

/**
 * User for login screen (simplified display)
 */
export interface UserForLogin {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  roleName?: string; // RBAC: from primaryRole
  color: string;
}

/**
 * Auth Context Type
 */
export interface AuthContextType {
  user: User | null;
  login: (username: string, pin: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string; errors?: string[] }>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    roleId: string; // CHANGED: Use roleId instead of role string
  }) => Promise<{ success: boolean; message: string; errors?: string[] }>;
  registerBusiness: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    avatar?: string;
    businessAvatar?: string;
  }) => Promise<{ success: boolean; message: string; errors?: string[] }>;
  createUser: (userData: {
    businessId: string;
    username: string;
    pin: string;
    email?: string;
    password?: string;
    firstName: string;
    lastName: string;
    roleId: string; // CHANGED: Use roleId instead of role string
    avatar?: string;
    address?: string;
  }) => Promise<{ success: boolean; message: string; errors?: string[] }>;
  logout: (options?: { clockOut?: boolean }) => Promise<{
    needsClockOutWarning?: boolean;
  }>;
  clockIn: (
    userId: string,
    businessId: string
  ) => Promise<{
    success: boolean;
    message?: string;
  }>;
  clockOut: (userId: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  getActiveShift: (userId: string) => Promise<any>;
  isLoading: boolean;
  error: string | null;
  isInitializing: boolean;
}
```

#### 2. Update shared/utils/auth.ts

**In `packages/renderer/src/shared/utils/auth.ts`:**

Change line 1:

```typescript
// OLD (line 1)
import type { User } from "@/views/auth/types/auth.types";

// NEW
import type { User } from "@/shared/types/user";
```

The rest of the file stays the same. This file contains deprecated permission helpers.

#### 3. Update shared/hooks/use-auth.tsx

**In `packages/renderer/src/shared/hooks/use-auth.tsx`:**

Change line 3:

```typescript
// OLD (line 3)
import type { AuthContextType } from "@/views/auth/types/auth.types";

// NEW
import type { AuthContextType } from "@/shared/types/user";
```

The rest of the file stays the same. This is a simple hook that provides access to the auth context.

#### 4. Update auth-context.tsx to use new types

**In `packages/renderer/src/views/auth/context/auth-context.tsx`:**

Change the import at the top of the file (line 2):

```typescript
// OLD
import type { User, AuthContextType } from "../types/auth.types";

// NEW
import type { User, AuthContextType } from "@/shared/types/user";
```

This is the main auth context file that provides the user state and auth functions to the entire app.

#### 5. Delete the old auth.types.ts file

```bash
rm packages/renderer/src/views/auth/types/auth.types.ts
```

#### 6. Verify TypeScript compiles

```bash
npm run type-check
```

### Verification Checklist

- [ ] TypeScript compiles with no errors
- [ ] No imports from `views/auth/types/auth.types` in any file
- [ ] All 3 files updated:
  - [ ] `auth-context.tsx` uses `@/shared/types/user`
  - [ ] `shared/utils/auth.ts` uses `@/shared/types/user`
  - [ ] `shared/hooks/use-auth.tsx` uses `@/shared/types/user`
- [ ] Old file deleted: `packages/renderer/src/views/auth/types/auth.types.ts`
- [ ] Application compiles and starts successfully
- [ ] Login/logout works correctly
- [ ] User registration works
- [ ] Role display shows correctly (using `roleName` field from RBAC)

### Migration Note

If your backend still populates `roleName` field when fetching users (from the LEFT JOIN with roles table), everything will work seamlessly! The `getUserRoleName()` helper in `rbac-helpers.ts` already handles this:

```typescript
// This already exists and works!
export function getUserRoleName(user: User | null | undefined): string {
  if (!user) return "unknown";
  if (user.roleName) return user.roleName; // ✅ From backend join
  if (user.primaryRole?.name) return user.primaryRole.name; // ✅ From populated object
  return "unknown";
}
```

---

## 🔴 CRITICAL FIX #2: Verify Database Schema Consistency

**Time Required:** 1-2 hours  
**Risk:** Data corruption if migration state is unknown  
**Files Affected:** schema.ts ✅ (already clean!), need to verify actual database

### ✅ Good News!

Your **schema.ts is already clean and RBAC-compliant!**

```typescript
export const users = createTable("users", {
  // ... auth fields ...

  // ✅ ONLY RBAC fields, no legacy fields!
  primaryRoleId: text("primary_role_id").references(() => roles.id),
  shiftRequired: integer("shift_required", { mode: "boolean" }),
  activeRoleContext: text("active_role_context"),

  // NO role field ❌
  // NO permissions field ❌
});
```

### ⚠️ Potential Problem

Your **initial SQL migration file** (`0000_friendly_sunset_bain.sql`) shows the database structure was created with these columns:

```sql
CREATE TABLE `users` (
  -- ... other fields ...
  `role` text NOT NULL,              -- ⚠️ Legacy field
  `permissions` text NOT NULL,       -- ⚠️ Legacy field
  `primary_role_id` text,            -- ✅ RBAC field
  `shift_required` integer,          -- ✅ RBAC field
  -- ...
);
```

This means your **actual database likely still has these columns**, even though your schema.ts doesn't define them!

### Steps to Fix

#### 1. Create verification script to check actual database

Create `scripts/verify-user-schema.mjs`:

```javascript
import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "pos_system.db");

try {
  const db = new Database(dbPath, { readonly: true });

  console.log("📊 Checking users table structure...\n");

  const columns = db.pragma("table_info(users)");

  console.log("=== Users Table Columns ===");
  console.table(
    columns.map((c) => ({
      name: c.name,
      type: c.type,
      required: c.notnull ? "YES" : "NO",
      defaultValue: c.dflt_value || "NULL",
    }))
  );

  // Check for specific columns
  const columnNames = columns.map((c) => c.name);
  const hasRole = columnNames.includes("role");
  const hasPermissions = columnNames.includes("permissions");
  const hasPrimaryRoleId = columnNames.includes("primary_role_id");
  const hasShiftRequired = columnNames.includes("shift_required");

  console.log("\n📋 Migration Status:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Legacy 'role' column:        ${hasRole ? "⚠️  EXISTS (needs migration)" : "✅ REMOVED"}`);
  console.log(`Legacy 'permissions' column: ${hasPermissions ? "⚠️  EXISTS (needs migration)" : "✅ REMOVED"}`);
  console.log(`RBAC 'primary_role_id':      ${hasPrimaryRoleId ? "✅ EXISTS" : "❌ MISSING"}`);
  console.log(`RBAC 'shift_required':       ${hasShiftRequired ? "✅ EXISTS" : "❌ MISSING"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Check if data exists
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  console.log(`👥 Total users in database: ${userCount.count}`);

  if (hasRole || hasPermissions) {
    console.log("\n⚠️  CRITICAL: Legacy columns still exist!");
    console.log("   Your schema.ts is clean, but database has old columns.");
    console.log("   This mismatch can cause issues.\n");
    console.log("📝 Recommended actions:");
    console.log("   1. Backup database first");
    console.log("   2. Verify all users have primary_role_id set");
    console.log("   3. Run migration to drop legacy columns");
    console.log("   4. OR: Add them back to schema.ts temporarily\n");
  } else {
    console.log("\n✅ EXCELLENT: Schema is clean and matches database!");
    console.log("   No migration needed for user table structure.\n");
  }

  db.close();
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
```

Run it:

```bash
node scripts/verify-user-schema.mjs
```

#### 2A. If legacy columns EXIST: Add them back to schema temporarily

**Update `packages/main/src/database/schema.ts`:**

```typescript
// packages/main/src/database/schema.ts

export const users = createTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  pinHash: text("pin_hash").notNull(),
  salt: text("salt").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  businessName: text("businessName").notNull(),

  businessId: text("businessId")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),

  // ⚠️ DEPRECATED FIELDS - Match actual database during migration
  // TODO: Drop these columns after verifying all data migrated
  role: text("role", {
    enum: ["cashier", "supervisor", "manager", "admin", "owner"],
  }).notNull(),

  permissions: text("permissions", { mode: "json" }).$type<Permission[]>().notNull(),

  // ✅ RBAC fields (active)
  primaryRoleId: text("primary_role_id").references(() => roles.id),
  shiftRequired: integer("shift_required", { mode: "boolean" }),
  activeRoleContext: text("active_role_context"),

  isActive: integer("isActive", { mode: "boolean" }).default(true),
  address: text("address").default(""),
  ...timestampColumns,
});
```

**Why do this?**

- Prevents Drizzle query errors
- Makes schema match reality
- Allows gradual migration
- Can still use old fields if needed

#### 2B. If legacy columns DON'T EXIST: You're done! ✅

If the verification script shows no legacy columns, your database is already migrated and you can skip this fix entirely!

#### 3. Create data migration script (if columns exist)

**Only proceed if legacy columns exist and data needs migration!**

Create `scripts/migrate-to-rbac.mjs`:

```javascript
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "pos_system.db");
const db = new Database(dbPath);

console.log("🔄 Starting RBAC Migration...\n");

try {
  // Check if migration needed
  const users = db.prepare("SELECT id, role, permissions, businessId, primary_role_id FROM users").all();
  console.log(`Found ${users.length} users\n`);

  let migrated = 0;
  let alreadyMigrated = 0;

  for (const user of users) {
    // Skip if already has primary_role_id
    if (user.primary_role_id) {
      alreadyMigrated++;
      continue;
    }

    console.log(`Migrating user ${user.id} (${user.role})...`);

    // Find or create role
    let role = db.prepare("SELECT id FROM roles WHERE name = ? AND business_id = ?").get(user.role, user.businessId);

    if (!role) {
      const roleId = uuidv4();
      const displayName = user.role.charAt(0).toUpperCase() + user.role.slice(1);

      let permissions = [];
      try {
        permissions = JSON.parse(user.permissions || "[]");
      } catch (e) {
        console.warn(`  Warning: Could not parse permissions`);
      }

      db.prepare(
        `
        INSERT INTO roles (id, name, display_name, description, business_id, permissions, is_system_role, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?)
      `
      ).run(roleId, user.role, displayName, `Auto-migrated ${user.role} role`, user.businessId, JSON.stringify(permissions), Date.now());

      role = { id: roleId };
      console.log(`  ✓ Created role ${user.role}`);
    }

    // Set primary_role_id
    db.prepare("UPDATE users SET primary_role_id = ? WHERE id = ?").run(role.id, user.id);

    // Assign role in user_roles
    const userRoleId = uuidv4();
    db.prepare(
      `
      INSERT OR IGNORE INTO user_roles (id, user_id, role_id, assigned_at, is_active)
      VALUES (?, ?, ?, ?, 1)
    `
    ).run(userRoleId, user.id, role.id, Date.now());

    migrated++;
    console.log(`  ✓ Migrated\n`);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Migration complete!`);
  console.log(`   Migrated: ${migrated} users`);
  console.log(`   Already had RBAC: ${alreadyMigrated} users`);
  console.log(`   Total: ${users.length} users\n`);

  // Verify all users now have primary_role_id
  const unmigrated = db.prepare("SELECT COUNT(*) as count FROM users WHERE primary_role_id IS NULL").get();

  if (unmigrated.count > 0) {
    console.log(`⚠️  WARNING: ${unmigrated.count} users still without primary_role_id!`);
  } else {
    console.log("✅ All users have primary_role_id\n");
    console.log("📝 Next steps:");
    console.log("   1. Test application thoroughly");
    console.log("   2. If everything works, you can drop legacy columns:");
    console.log("      - Run migration to ALTER TABLE users DROP COLUMN role");
    console.log("      - Run migration to ALTER TABLE users DROP COLUMN permissions");
  }
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
} finally {
  db.close();
}
```

Run migration:

```bash
# CRITICAL: Backup first!
cp data/pos_system.db data/pos_system.db.backup-$(date +%Y%m%d-%H%M%S)

# Run migration
node scripts/migrate-to-rbac.mjs
```

#### 4. ✅ Verify getUserById loads RBAC data (ALREADY IMPLEMENTED!)

**Good news!** The `getUserById` method in `packages/main/src/database/managers/userManager.ts` (lines 93-123) **already correctly implements RBAC data loading**.

**Verified implementation (lines 93-123):**

```typescript
getUserById(id: string): User | null {
  const [user] = this.db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      email: schema.users.email,
      // ... other basic fields ...
      businessId: schema.users.businessId,
      businessName: schema.users.businessName,

      // ✅ RBAC fields ARE included:
      primaryRoleId: schema.users.primaryRoleId,      // Line 106 ✅
      shiftRequired: schema.users.shiftRequired,      // Line 107 ✅

      // ... other fields ...
      roleName: schema.roles.name,                    // Line 112 ✅ CRITICAL!
    })
    .from(schema.users)
    .leftJoin(schema.roles, eq(schema.users.primaryRoleId, schema.roles.id)) // Line 115 ✅
    .where(and(eq(schema.users.id, id), eq(schema.users.isActive, true)))
    .limit(1)
    .all();

  if (!user) return null;
  return user as User;
}
```

**✅ What's working:**

- Selects `primaryRoleId` from users table
- Selects `shiftRequired` from users table
- LEFT JOIN with roles table to get role name
- Populates `roleName` field from `schema.roles.name`
- This allows frontend to access `user.roleName` directly

**✅ Also verified: All user retrieval methods are consistent!**

- `getUserById()` (lines 93-123) ✅ Has RBAC fields + JOIN
- `getUserByEmail()` (lines 59-89) ✅ Has RBAC fields + JOIN
- `getUserByUsername()` (lines 165-195) ✅ Has RBAC fields + JOIN

All three methods consistently load RBAC data, so users will have `roleName` populated regardless of how they're fetched (by ID, email, or username).

**No changes needed!** Skip to step 5.

#### 5. (Optional) Drop legacy columns after successful migration

**Only after thorough testing and verification!**

Create a new Drizzle migration:

```bash
# Generate migration
npx drizzle-kit generate:sqlite
```

Or manually create `migrations/0001_drop_legacy_columns.sql`:

```sql
-- Drop legacy columns from users table
-- Run ONLY after data migration is complete and tested!

PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

-- Create new table without legacy columns
CREATE TABLE users_new (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  pin_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  businessName TEXT NOT NULL,
  businessId TEXT NOT NULL,
  primary_role_id TEXT,
  shift_required INTEGER,
  active_role_context TEXT,
  isActive INTEGER DEFAULT 1,
  address TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  FOREIGN KEY (businessId) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (primary_role_id) REFERENCES roles(id)
);

-- Copy data
INSERT INTO users_new
SELECT
  id, username, email, password_hash, pin_hash, salt,
  firstName, lastName, businessName, businessId,
  primary_role_id, shift_required, active_role_context,
  isActive, address, created_at, updated_at
FROM users;

-- Replace old table
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes
CREATE UNIQUE INDEX users_username_unique ON users(username);
CREATE UNIQUE INDEX users_email_unique ON users(email);

COMMIT;

PRAGMA foreign_keys=on;
```

Run migration:

```bash
# Verify migration SQL is correct first!
# Then apply it
npm run db:migrate
```

### Verification Checklist

- [ ] Verification script shows database structure
- [ ] If legacy columns exist, they're added to schema.ts temporarily
- [ ] If migration needed, data migration completed successfully
- [ ] All users have `primaryRoleId` set
- [ ] All users have at least one entry in `user_roles`
- [ ] `getUserById()` includes LEFT JOIN with roles table
- [ ] Login works and returns user with `roleName` populated
- [ ] TypeScript compiles
- [ ] Application starts without database errors

### Summary

**Best Case:** Your database is already clean → Skip to next fix ✅  
**Common Case:** Database has legacy columns → Add to schema temporarily, migrate later  
**Migration Path:** Run data migration → Test → Drop columns when confident

---

## 🔴 CRITICAL FIX #3: Add Permission Cache Invalidation

**Time Required:** 1 hour  
**Risk:** Stale permissions, privilege escalation  
**Files Affected:** rbacHelpers.ts (add logging), userManager.ts (add to login/logout), appStore.ts (add to roles:update)

### Current Status ✅⚠️

**What's already implemented:**

- ✅ Cache invalidation functions exist in `rbacHelpers.ts`
- ✅ `userRoles:assign` handler (line 4153) - **Already has cache invalidation!**
- ✅ `userRoles:revoke` handler (line 4201) - **Already has cache invalidation!**

**What's missing:**

- ⚠️ No cache invalidation on **login** (userManager.ts ~line 546)
- ⚠️ No cache invalidation on **logout** (userManager.ts ~line 758)
- ⚠️ No cache invalidation in **roles:update** handler (appStore.ts ~line 4062)
- ⚠️ No logging in invalidation functions (rbacHelpers.ts lines 165-182)

### Steps to Fix

#### 1. Add logging to rbacHelpers invalidation functions

**Update `packages/main/src/utils/rbacHelpers.ts` (lines 165-182):**

```typescript
/**
 * Invalidate permission cache for a user
 * Call this when user's roles or permissions change
 */
export function invalidateUserPermissionCache(userId: string): void {
  permissionCache.delete(userId);
  logger.info(`[Cache] Invalidated permission cache for user ${userId}`);
}

/**
 * Invalidate permission cache for all users with a specific role
 * Call this when role permissions change
 */
export function invalidateRolePermissionCache(db: DatabaseManagers, roleId: string): void {
  const userRoles = db.userRoles.getUsersByRole(roleId, true);

  let count = 0;
  for (const userRole of userRoles) {
    permissionCache.delete(userRole.userId);
    count++;
  }

  logger.info(`[Cache] Invalidated permission cache for ${count} users with role ${roleId}`);
}
```

#### 2. Add cache invalidation to login method

**Update `packages/main/src/database/managers/userManager.ts` (after line 622):**

Add import at top of file:

```typescript
import { invalidateUserPermissionCache } from "../../utils/rbacHelpers.js";
```

Then add cache invalidation right after user authentication succeeds (after line 622, before creating session):

```typescript
async login(data: {
  email?: string;
  password?: string;
  username?: string;
  pin?: string;
  rememberMe?: boolean;
  terminalId?: string;
  ipAddress?: string;
  locationId?: string;
  autoClockIn?: boolean;
}): Promise<AuthResponse> {
  try {
    let user: User | null = null;
    let rememberMe = data.rememberMe || false;

    // ... existing authentication logic (lines 562-622) ...

    // 🔥 NEW: Clear any stale permission cache for this user
    // Add AFTER successful authentication, BEFORE creating session
    invalidateUserPermissionCache(user.id);
    logger.info(`[Login] Cleared permission cache for user ${user.id}`);

    // Create session with custom expiry if rememberMe is set
    if (!this.sessionManager) {
      throw new Error("Session manager not initialized");
    }
    const session = this.sessionManager.createSession(
      user.id,
      rememberMe ? 30 : 0.5
    );

    // ... rest of login logic ...
  }
}
```

**Why:** Clears any stale cached permissions from previous sessions before creating new session.

#### 3. Add cache invalidation to logout method

**Update `packages/main/src/database/managers/userManager.ts` (around line 780):**

Add after getting user from session, before any clock-out logic:

```typescript
async logout(
  token: string,
  options?: {
    terminalId?: string;
    ipAddress?: string;
    autoClockOut?: boolean;
  }
): Promise<AuthResponse> {
  try {
    if (!this.sessionManager) {
      throw new Error("Session manager not initialized");
    }

    // Get user from session before deleting
    const session = this.sessionManager.getSessionByToken(token);
    if (!session) {
      return {
        success: false,
        message: "Session not found",
      };
    }

    const user = this.getUserById(session.userId);

    // 🔥 NEW: Clear permission cache on logout
    invalidateUserPermissionCache(session.userId);
    logger.info(`[Logout] Cleared permission cache for user ${session.userId}`);

    // Check if user is clocked in (for warning, but don't force clock-out)
    let activeShift = null;
    let isClockedIn = false;

    // ... rest of existing logout logic (lines 786-843) ...
  }
}
```

**Why:** Ensures permissions are cleared when user logs out, preventing the next user from inheriting cached permissions.

#### 4. ✅ Verify role assignment handlers (ALREADY IMPLEMENTED!)

**Good news!** Cache invalidation is already implemented for role assignments.

**In `packages/main/src/appStore.ts`:**

- **`userRoles:assign` handler** (lines 4153-4199) ✅  
  Already has cache invalidation on line 4175-4178

- **`userRoles:revoke` handler** (lines 4201-4242) ✅  
  Already has cache invalidation on lines 4219-4223

Both handlers correctly:

1. Validate session and permissions
2. Perform the role change
3. **Invalidate the user's permission cache**
4. Log the action to audit trail

**No changes needed!** Skip to step 5.

#### 5. Add cache invalidation to roles:update handler

**Update `packages/main/src/appStore.ts` (line 4062):**

Add import at the top with other imports:

```typescript
import { invalidateRolePermissionCache } from "./utils/rbacHelpers.js";
```

Then update the handler:

```typescript
ipcMain.handle("roles:update", async (event, sessionToken, roleId, updates) => {
  if (!db) db = await getDatabase();

  const auth = await validateSessionAndPermission(db, sessionToken, PERMISSIONS.USERS_MANAGE);

  if (!auth.success) {
    return { success: false, message: auth.message, code: auth.code };
  }

  try {
    const role = db.roles.updateRole(roleId, updates);

    // 🔥 NEW: If permissions changed, invalidate cache for all users with this role
    if (updates.permissions) {
      invalidateRolePermissionCache(db, roleId);
      logger.info(`[RBAC] Invalidated permission cache for all users with role ${roleId}`);
    }

    await logAction(db, auth.user!, "update", "roles", roleId, { updates });

    return { success: true, data: role };
  } catch (error) {
    logger.error("Update role IPC error:", error);
    return {
      success: false,
      message: "Failed to update role",
    };
  }
});
```

**Why:** When a role's permissions are updated, all users with that role need their cached permissions invalidated so they get the new permissions immediately.

### Verification Checklist

#### Code Changes

- [ ] Added logging to `invalidateUserPermissionCache()` in rbacHelpers.ts
- [ ] Added logging to `invalidateRolePermissionCache()` in rbacHelpers.ts
- [ ] Added `invalidateUserPermissionCache` import to userManager.ts
- [ ] Added cache invalidation call in `login()` method
- [ ] Added cache invalidation call in `logout()` method
- [ ] Added `invalidateRolePermissionCache` import to appStore.ts
- [ ] Added cache invalidation in `roles:update` handler

#### Runtime Testing

- [ ] **Login Test:** Log in → Check logs for cache invalidation message
- [ ] **Logout Test:** Log out → Check logs for cache invalidation message
- [ ] **Role Assignment Test:** Assign role to user → Check logs (should see message from existing handler)
- [ ] **Role Permission Update Test:** Update role permissions → Check logs for cache invalidation
- [ ] **Permission Refresh Test:**
  1. User logs in as cashier
  2. Admin assigns admin role to user (while still logged in)
  3. User refreshes or re-checks permissions
  4. User should immediately have admin permissions (cache was invalidated)

#### Log Messages to Look For

```
[Cache] Invalidated permission cache for user {userId}
[Login] Cleared permission cache for user {userId}
[Logout] Cleared permission cache for user {userId}
[RBAC] Invalidated permission cache for all users with role {roleId}
```

### Summary of Changes

| Location                   | Change                                           | Status  |
| -------------------------- | ------------------------------------------------ | ------- |
| `rbacHelpers.ts` line 166  | Add logging to `invalidateUserPermissionCache()` | ⚠️ TODO |
| `rbacHelpers.ts` line 180  | Add logging to `invalidateRolePermissionCache()` | ⚠️ TODO |
| `userManager.ts` line ~1   | Add import for `invalidateUserPermissionCache`   | ⚠️ TODO |
| `userManager.ts` line ~623 | Add cache invalidation in `login()`              | ⚠️ TODO |
| `userManager.ts` line ~780 | Add cache invalidation in `logout()`             | ⚠️ TODO |
| `appStore.ts` line ~1      | Add import for `invalidateRolePermissionCache`   | ⚠️ TODO |
| `appStore.ts` line ~4076   | Add cache invalidation in `roles:update`         | ⚠️ TODO |
| `appStore.ts` line 4175    | Cache invalidation in `userRoles:assign`         | ✅ DONE |
| `appStore.ts` line 4220    | Cache invalidation in `userRoles:revoke`         | ✅ DONE |

**Total Work:** 7 small changes across 3 files (2 already complete)

---

## 🔴 CRITICAL FIX #4: Remove Admin Fallback Bypass

**Time Required:** 1 hour  
**Risk:** Security backdoor in production  
**Files Affected:** authHelpers.ts, index.ts (or main entry point)

### Current Problem

**Critical Security Issue:** Admin users bypass ALL permission checks even if they don't have the specific permission, creating a security backdoor.

**Current Implementation (lines 182-203 in `authHelpers.ts`):**

- Admin fallback is **always enabled** (no environment check)
- Any user with "admin" or "owner" role gets **unlimited access**
- No audit logging when fallback is used
- No warning on application startup
- Works in **production** (major security risk!)

**Why This Is Dangerous:**

1. Admin role can access anything without proper permissions
2. If admin role permissions are accidentally removed, admin still has full access
3. Makes RBAC system optional, not enforced
4. No audit trail for when fallback is used
5. Could allow privilege escalation if role name is changed

### Steps to Fix

#### 1. Add environment flag at top of authHelpers.ts

**Update `packages/main/src/utils/authHelpers.ts` (add after imports, before functions):**

```typescript
// ============================================================================
// ADMIN FALLBACK CONFIGURATION
// ============================================================================

/**
 * Admin fallback bypass - TEMPORARY MIGRATION FEATURE
 *
 * ⚠️ SECURITY WARNING: This allows admin users to bypass RBAC permission checks.
 *
 * Options:
 * 1. Development only: Only enable in development environment
 * 2. Feature flag: Use environment variable to control
 * 3. Hard deadline: Set a date when this MUST be removed
 *
 * RECOMMENDED: Use option 1 (development only) for safety
 */
const ENABLE_ADMIN_FALLBACK = process.env.NODE_ENV === "development" || process.env.RBAC_ADMIN_FALLBACK === "true";

// Alternative: Hard deadline approach (uncomment to use)
// const FALLBACK_DEADLINE = new Date("2025-12-31");
// const ENABLE_ADMIN_FALLBACK = Date.now() < FALLBACK_DEADLINE.getTime() &&
//                                process.env.NODE_ENV !== "production";
```

**Best Practice:** Use environment-based check so it's automatically disabled in production builds.

#### 2. Update hasPermission function with environment check

**Update `packages/main/src/utils/authHelpers.ts` (lines 182-203):**

Replace the existing fallback block with this improved version:

```typescript
export async function hasPermission(db: DatabaseManagers, user: User, requiredPermission: string): Promise<PermissionCheckResult> {
  logger.info(`[hasPermission] Checking permission "${requiredPermission}" for user ${user.id}`);

  if (!user) {
    return {
      granted: false,
      reason: "User not provided",
    };
  }

  // Get aggregated permissions from RBAC system
  const userPermissions = await getUserPermissions(db, user.id);
  logger.info(`[hasPermission] User ${user.id} has ${userPermissions.length} permissions:`, userPermissions);

  // Check for exact match
  if (userPermissions.includes(requiredPermission)) {
    logger.info(`[hasPermission] ✅ Exact match found: ${requiredPermission}`);
    return { granted: true };
  }

  // Check for wildcard permission (admin has all)
  if (userPermissions.includes("*:*")) {
    logger.info(`[hasPermission] ✅ Wildcard *:* found - granting access`);
    return { granted: true };
  }

  // Check for action wildcard (e.g., "manage:*" covers "manage:users")
  const [action, resource] = requiredPermission.split(":");
  if (userPermissions.includes(`${action}:*`)) {
    logger.info(`[hasPermission] ✅ Action wildcard ${action}:* found`);
    return { granted: true };
  }

  // Check for resource wildcard (e.g., "*:users" covers "manage:users")
  if (userPermissions.includes(`*:${resource}`)) {
    logger.info(`[hasPermission] ✅ Resource wildcard *:${resource} found`);
    return { granted: true };
  }

  // 🔥 CHANGED: Admin fallback ONLY if enabled (development or feature flag)
  if (ENABLE_ADMIN_FALLBACK) {
    try {
      const userRoles = await db.userRoles.getActiveRolesByUser(user.id);

      for (const userRole of userRoles) {
        const role = await db.roles.getRoleById(userRole.roleId);

        if (role && (role.name === "admin" || role.name === "owner")) {
          // ⚠️ SECURITY WARNING LOG
          logger.warn(
            `⚠️ [SECURITY] Admin fallback used for user ${user.id} to grant ${requiredPermission}. ` +
              `This is a temporary migration feature. ` +
              `Please assign proper permissions to admin role. ` +
              `Fallback enabled: ${ENABLE_ADMIN_FALLBACK}, Environment: ${process.env.NODE_ENV}`
          );

          // 🔥 CRITICAL: Log to audit trail for security monitoring
          try {
            await db.audit.createAuditLog({
              userId: user.id,
              action: "admin_fallback_used",
              entityType: "permission",
              entityId: requiredPermission,
              details: {
                roleName: role.name,
                roleId: role.id,
                permission: requiredPermission,
                timestamp: Date.now(),
                environment: process.env.NODE_ENV,
                WARNING: "SECURITY: Admin fallback bypass used - ensure admin role has proper permissions",
              },
            });
          } catch (auditError) {
            // Don't fail permission check if audit logging fails, but log it
            logger.error("[hasPermission] Failed to log admin fallback to audit:", auditError);
          }

          return { granted: true };
        }
      }
    } catch (error) {
      logger.error("[hasPermission] Error checking admin role fallback:", error);
      // Don't grant permission if there's an error checking roles
    }
  }

  logger.info(`[hasPermission] ❌ Permission denied: ${requiredPermission} for user ${user.id}`);
  return {
    granted: false,
    reason: `User lacks required permission: ${requiredPermission}`,
  };
}
```

**Key Changes:**

1. ✅ Wrapped fallback in `ENABLE_ADMIN_FALLBACK` check
2. ✅ Added environment info to warning log
3. ✅ Added audit logging with error handling
4. ✅ Made role lookups async (if needed)
5. ✅ Better error handling

#### 3. Add startup warning

**Find your main entry point** (likely `packages/main/src/index.ts` or `packages/main/src/main.ts`):

Add this after imports and before app initialization:

```typescript
import { getLogger } from "./utils/logger.js";
const logger = getLogger("startup");

// Import the flag from authHelpers (or define it here if shared)
// Option 1: Import from authHelpers (if exported)
// import { ENABLE_ADMIN_FALLBACK } from './utils/authHelpers.js';

// Option 2: Define here (must match authHelpers exactly)
const ENABLE_ADMIN_FALLBACK = process.env.NODE_ENV === "development" || process.env.RBAC_ADMIN_FALLBACK === "true";

// Startup security check
if (ENABLE_ADMIN_FALLBACK) {
  const env = process.env.NODE_ENV || "unknown";
  logger.warn(
    "\n" +
      "⚠️  ═══════════════════════════════════════════════════════════════\n" +
      "⚠️  SECURITY WARNING: ADMIN PERMISSION FALLBACK IS ENABLED\n" +
      "⚠️  \n" +
      "⚠️  This is a temporary migration feature that allows admin users\n" +
      "⚠️  to bypass RBAC permission checks.\n" +
      "⚠️  \n" +
      "⚠️  Current Environment: " +
      env +
      "\n" +
      "⚠️  \n" +
      "⚠️  ⚠️  DO NOT USE IN PRODUCTION! ⚠️\n" +
      "⚠️  \n" +
      "⚠️  To disable:\n" +
      "⚠️    - Set NODE_ENV=production\n" +
      "⚠️    - Remove RBAC_ADMIN_FALLBACK environment variable\n" +
      "⚠️    - Or remove the fallback code entirely\n" +
      "⚠️  \n" +
      "⚠️  ═══════════════════════════════════════════════════════════════\n"
  );

  // Also log to console for visibility
  console.warn("⚠️  SECURITY: Admin fallback is ENABLED in", env, "environment!");
}
```

**Best Practice:** This warning ensures developers are immediately aware of the security risk on startup.

### Verification Checklist

#### Code Changes

- [ ] Added `ENABLE_ADMIN_FALLBACK` constant at top of `authHelpers.ts`
- [ ] Wrapped admin fallback code in `if (ENABLE_ADMIN_FALLBACK)` check
- [ ] Added audit logging when fallback is used
- [ ] Added startup warning in main entry point
- [ ] Verified fallback is disabled when `NODE_ENV=production`

#### Environment Testing

**Development Environment:**

- [ ] Set `NODE_ENV=development`
- [ ] Start application
- [ ] Verify startup warning appears
- [ ] Test: Admin user without specific permission can access (fallback works)
- [ ] Check logs for fallback usage warnings
- [ ] Check audit logs for `admin_fallback_used` entries

**Production Environment:**

- [ ] Set `NODE_ENV=production`
- [ ] Start application
- [ ] Verify NO startup warning appears
- [ ] Test: Admin user without specific permission CANNOT access (fallback disabled)
- [ ] Test: Admin user with `*:*` permission CAN access (proper RBAC works)
- [ ] Verify no fallback warnings in logs

**Feature Flag Testing:**

- [ ] Set `RBAC_ADMIN_FALLBACK=true` in production
- [ ] Verify fallback is enabled (should see warning)
- [ ] Test fallback works
- [ ] Remove flag and verify fallback is disabled

#### Security Verification

- [ ] **Critical:** Production build has fallback disabled
- [ ] **Critical:** No fallback warnings in production logs
- [ ] **Critical:** Audit logs capture all fallback usage
- [ ] Admin role with proper `*:*` permission works without fallback
- [ ] Admin role without permissions cannot access (when fallback disabled)

#### Test Scenarios

**Scenario 1: Admin with proper permissions (should NOT use fallback)**

1. Ensure admin role has `["*:*"]` permission
2. Admin user logs in
3. Admin tries to access protected resource
4. ✅ Should work via `*:*` permission (not fallback)
5. ✅ No fallback warnings in logs

**Scenario 2: Admin without permissions (fallback in dev only)**

1. Remove all permissions from admin role
2. Admin user logs in
3. Admin tries to access protected resource
4. **Development:** ✅ Should work via fallback (with warnings)
5. **Production:** ❌ Should be denied (fallback disabled)

**Scenario 3: Non-admin user (should never use fallback)**

1. Cashier user logs in
2. Cashier tries to access admin-only resource
3. ❌ Should be denied (no fallback for non-admin)
4. ✅ No fallback warnings in logs

### Summary of Changes

| Location                   | Change                                        | Status  |
| -------------------------- | --------------------------------------------- | ------- |
| `authHelpers.ts` line ~1   | Add `ENABLE_ADMIN_FALLBACK` constant          | ⚠️ TODO |
| `authHelpers.ts` line 182  | Wrap fallback in `if (ENABLE_ADMIN_FALLBACK)` | ⚠️ TODO |
| `authHelpers.ts` line ~195 | Add audit logging for fallback usage          | ⚠️ TODO |
| `index.ts` or `main.ts`    | Add startup warning                           | ⚠️ TODO |

**Total Work:** 4 changes across 2 files

### Long-term Goal

**Remove the fallback entirely** once you've verified:

1. ✅ All admin roles have proper `*:*` permissions assigned
2. ✅ All admin users can access required resources via RBAC
3. ✅ No fallback usage in production logs for 30+ days
4. ✅ Team is trained on proper RBAC permission assignment

**Recommended Timeline:**

- **Week 1:** Implement environment check (this fix)
- **Week 2-4:** Monitor fallback usage, assign proper permissions
- **Month 2:** Remove fallback code entirely

---

## 🔴 CRITICAL FIX #5: Implement Secure Token Storage

**Time Required:** 2 hours  
**Risk:** Session hijacking, token theft  
**Files Affected:** appStore.ts (IPC handlers), settingsManager.ts (optional)

### Current Problem

**Security Risk:** Session tokens and user data are stored in **plaintext** in the `app_settings` database table.

**Current Implementation (lines 35-67 in `appStore.ts`):**

- Tokens stored via `db.settings.setSetting(key, value)` - plaintext
- User data stored as JSON string - plaintext
- No encryption at rest
- Accessible to anyone with database access
- Renderer process can read tokens via IPC

**Why This Is Dangerous:**

1. Database file can be read directly (SQLite)
2. Tokens can be extracted and reused
3. User data exposed if database is compromised
4. No protection against session hijacking
5. Violates security best practices for sensitive data

### Steps to Fix

#### 1. Verify current storage implementation

**Current IPC handlers in `packages/main/src/appStore.ts` (lines 35-67):**

```typescript
// Current implementation - stores in plaintext
ipcMain.handle("auth:set", async (event, key: string, value: string) => {
  if (!db) db = await getDatabase();
  db.settings.setSetting(key, value); // ⚠️ Plaintext storage
  return true;
});

ipcMain.handle("auth:get", async (event, key: string) => {
  if (!db) db = await getDatabase();
  const value = db.settings.getSetting(key); // ⚠️ Plaintext retrieval
  return value;
});

ipcMain.handle("auth:delete", async (event, key: string) => {
  if (!db) db = await getDatabase();
  db.settings.deleteSetting(key);
  return true;
});
```

**Preload API in `packages/preload/src/api/auth.ts` (lines 74-79):**

```typescript
export const authStore = {
  set: (key: string, value: string) => ipcRenderer.invoke("auth:set", key, value),
  get: (key: string) => ipcRenderer.invoke("auth:get", key),
  delete: (key: string) => ipcRenderer.invoke("auth:delete", key),
};
```

#### 2. Update main process handlers to use Electron safeStorage

**Update `packages/main/src/appStore.ts` (replace lines 35-67):**

Add import at top of file:

```typescript
import { safeStorage } from "electron";
```

Then replace the handlers:

```typescript
import { safeStorage } from "electron";

// Check if encryption is available (done once at module load)
const isEncryptionAvailable = safeStorage.isEncryptionAvailable();

if (!isEncryptionAvailable) {
  logger.warn("⚠️  Safe storage encryption not available on this platform! " + "Tokens will be stored in plaintext. Consider using a different encryption method.");
}

// Keys that should be encrypted
const ENCRYPTED_KEYS = ["token", "user", "refreshToken"];

// IPC handlers for persistent key-value storage using app_settings table
ipcMain.handle("auth:set", async (event, key: string, value: string) => {
  try {
    if (!db) db = await getDatabase();

    // Determine if this key should be encrypted
    const shouldEncrypt = ENCRYPTED_KEYS.includes(key);

    let storedValue = value;
    let isEncrypted = false;

    // Encrypt sensitive data if encryption is available
    if (shouldEncrypt && isEncryptionAvailable) {
      try {
        const buffer = safeStorage.encryptString(value);
        // Store as base64 to save in text field
        storedValue = buffer.toString("base64");
        isEncrypted = true;

        // Mark as encrypted for later decryption
        db.settings.setSetting(`${key}_encrypted`, "true");
      } catch (encryptError) {
        logger.error(`Failed to encrypt ${key}, storing in plaintext:`, encryptError);
        // Fallback to plaintext if encryption fails
        isEncrypted = false;
      }
    }

    // Store the value (encrypted or plaintext)
    db.settings.setSetting(key, storedValue);

    if (shouldEncrypt && !isEncrypted) {
      logger.warn(`⚠️  Storing ${key} in plaintext (encryption unavailable or failed)`);
    }

    return true;
  } catch (error) {
    logger.error("Error setting auth data:", error);
    return false;
  }
});

ipcMain.handle("auth:get", async (event, key: string) => {
  try {
    if (!db) db = await getDatabase();

    const value = db.settings.getSetting(key);

    if (!value) return null;

    // Check if this was encrypted
    const isEncrypted = db.settings.getSetting(`${key}_encrypted`) === "true";

    // Decrypt if needed
    if (isEncrypted && isEncryptionAvailable) {
      try {
        const buffer = Buffer.from(value, "base64");
        const decrypted = safeStorage.decryptString(buffer);
        return decrypted;
      } catch (decryptError) {
        logger.error(`Failed to decrypt ${key}:`, decryptError);
        // If decryption fails, return null (data is corrupted)
        return null;
      }
    }

    // Return plaintext value
    return value;
  } catch (error) {
    logger.error("Error getting auth data:", error);
    return null;
  }
});

ipcMain.handle("auth:delete", async (event, key: string) => {
  try {
    if (!db) db = await getDatabase();

    // Delete both the value and encryption marker
    db.settings.deleteSetting(key);
    db.settings.deleteSetting(`${key}_encrypted`);

    return true;
  } catch (error) {
    logger.error("Error deleting auth data:", error);
    return false;
  }
});
```

**Key Changes:**

1. ✅ Uses actual IPC channel names (`auth:set`, `auth:get`, `auth:delete`)
2. ✅ Uses `db.settings.setSetting()` / `getSetting()` / `deleteSetting()` methods
3. ✅ Encrypts sensitive keys: `token`, `user`, `refreshToken`
4. ✅ Stores encryption marker separately
5. ✅ Graceful fallback to plaintext if encryption fails
6. ✅ Proper error handling and logging

#### 3. (Optional) Add token validation on app startup

**Update `packages/renderer/src/views/auth/context/auth-context.tsx`:**

If you want to add token format validation, update the session validation logic:

```typescript
useEffect(() => {
  const validateSession = async () => {
    setIsInitializing(true);
    try {
      const token = await window.authStore.get("token");
      const storedUser = await window.authStore.get("user");

      if (token && storedUser) {
        // 🔥 NEW: Validate token format (basic sanity check)
        if (!token || typeof token !== "string" || token.length < 10) {
          logger.warn("Invalid token format, clearing session");
          await window.authStore.delete("user");
          await window.authStore.delete("token");
          return;
        }

        const response = await window.authAPI.validateSession(token);

        if (response.success && response.user) {
          setUser(response.user);
          // Update stored user data (will be encrypted automatically)
          await window.authStore.set("user", JSON.stringify(response.user));
        } else {
          // Session is invalid, clear stored data
          logger.info("Session validation failed, clearing stored data");
          await window.authStore.delete("user");
          await window.authStore.delete("token");
        }
      }
    } catch (error) {
      logger.error("Session validation error:", error);
      // Clear stored data on error
      await window.authStore.delete("user");
      await window.authStore.delete("token");
    } finally {
      setIsInitializing(false);
    }
  };

  validateSession();
}, []);
```

**Note:** This is optional - the main security improvement is encryption. Token validation is a nice-to-have.

### Verification Checklist

#### Code Changes

- [ ] Added `safeStorage` import to `appStore.ts`
- [ ] Added `ENCRYPTED_KEYS` constant
- [ ] Updated `auth:set` handler to encrypt sensitive keys
- [ ] Updated `auth:get` handler to decrypt when needed
- [ ] Updated `auth:delete` handler to remove encryption markers
- [ ] (Optional) Added token validation in auth-context.tsx

#### Security Testing

**Encryption Verification:**

- [ ] **Test 1:** Store token → Check database → Should see encrypted base64 string
- [ ] **Test 2:** Retrieve token → Should decrypt automatically
- [ ] **Test 3:** Check `token_encrypted` flag → Should be "true"
- [ ] **Test 4:** Delete token → Both `token` and `token_encrypted` should be removed

**Platform Testing:**

- [ ] **macOS:** Encryption should work (uses Keychain)
- [ ] **Windows:** Encryption should work (uses Credential Manager)
- [ ] **Linux:** May not work - should fallback to plaintext with warning

**Fallback Testing:**

- [ ] **Test:** Disable encryption (if possible) → Should store plaintext with warning
- [ ] **Test:** Corrupted encrypted data → Should return null gracefully

**Integration Testing:**

- [ ] **Login:** Store token → Should be encrypted
- [ ] **Session Validation:** Retrieve token → Should decrypt correctly
- [ ] **Logout:** Delete token → Should remove both value and marker
- [ ] **App Restart:** Token should still decrypt correctly

#### Log Messages to Look For

**On Startup (if encryption unavailable):**

```
⚠️  Safe storage encryption not available on this platform!
```

**When Storing (if encryption fails):**

```
Failed to encrypt token, storing in plaintext: [error]
⚠️  Storing token in plaintext (encryption unavailable or failed)
```

**When Retrieving (if decryption fails):**

```
Failed to decrypt token: [error]
```

### Summary of Changes

| Location               | Change                                             | Status      |
| ---------------------- | -------------------------------------------------- | ----------- |
| `appStore.ts` line ~1  | Add `safeStorage` import                           | ⚠️ TODO     |
| `appStore.ts` line ~35 | Add encryption check and `ENCRYPTED_KEYS` constant | ⚠️ TODO     |
| `appStore.ts` line 35  | Update `auth:set` to encrypt sensitive keys        | ⚠️ TODO     |
| `appStore.ts` line 47  | Update `auth:get` to decrypt when needed           | ⚠️ TODO     |
| `appStore.ts` line 58  | Update `auth:delete` to remove encryption markers  | ⚠️ TODO     |
| `auth-context.tsx`     | (Optional) Add token format validation             | ⚠️ OPTIONAL |

**Total Work:** 5 required changes + 1 optional

### Platform Compatibility

| Platform    | Encryption Support          | Fallback               |
| ----------- | --------------------------- | ---------------------- |
| **macOS**   | ✅ Yes (Keychain)           | N/A                    |
| **Windows** | ✅ Yes (Credential Manager) | N/A                    |
| **Linux**   | ⚠️ Limited                  | Plaintext with warning |

**Best Practice:** On Linux, consider using a custom encryption key stored in a secure location, or accept the security limitation with clear warnings.

---

## 🔴 CRITICAL FIX #6: Add Business Isolation Validation

**Time Required:** 2 hours  
**Risk:** Multi-tenant data leakage  
**Files Affected:** authHelpers.ts, all IPC handlers

### Current Problem

No validation that user belongs to same business as resources they're accessing. Cross-business data access possible.

### Steps to Fix

#### 1. Add business validation helper

In `packages/main/src/utils/authHelpers.ts`:

```typescript
/**
 * Validate that user can access a business resource
 * Returns validation result with specific error codes
 */
export function validateBusinessAccess(user: User, resourceBusinessId: string | null | undefined): AuthValidationResult {
  // Allow null businessId (system resources)
  if (!resourceBusinessId) {
    return { success: true };
  }

  if (user.businessId !== resourceBusinessId) {
    logger.warn(`[Security] Business access violation: User ${user.id} (business ${user.businessId}) ` + `attempted to access resource from business ${resourceBusinessId}`);

    return {
      success: false,
      message: "Access denied: Resource belongs to a different business",
      code: "BUSINESS_MISMATCH",
    };
  }

  return { success: true };
}

/**
 * Combined validation: session + permission + business access
 */
export async function validateSessionPermissionAndBusiness(
  db: DatabaseManagers,
  sessionToken: string | null | undefined,
  requiredPermission: string,
  resourceBusinessId?: string
): Promise<AuthValidationResult> {
  // First validate session and permission
  const auth = await validateSessionAndPermission(db, sessionToken, requiredPermission);

  if (!auth.success) {
    return auth;
  }

  // Then validate business access if businessId provided
  if (resourceBusinessId) {
    const businessCheck = validateBusinessAccess(auth.user!, resourceBusinessId);

    if (!businessCheck.success) {
      // Log security event
      await db.audit.createAuditLog({
        userId: auth.user!.id,
        action: "business_access_denied",
        entityType: "security",
        entityId: resourceBusinessId,
        details: {
          userBusinessId: auth.user!.businessId,
          attemptedBusinessId: resourceBusinessId,
          permission: requiredPermission,
          timestamp: Date.now(),
        },
      });

      return businessCheck;
    }
  }

  return auth;
}
```

#### 2. Update critical IPC handlers

Example for transactions:

```typescript
ipcMain.handle("transactions:createFromCart", async (event, sessionToken, data) => {
  if (!db) db = await getDatabase();

  // 🔥 CHANGED: Validate session, permission AND business access
  const auth = await validateSessionPermissionAndBusiness(
    db,
    sessionToken,
    PERMISSIONS.SALES_WRITE,
    data.businessId // Validate user belongs to this business
  );

  if (!auth.success) {
    return { success: false, message: auth.message, code: auth.code };
  }

  // ... rest of handler ...
});
```

#### 3. Add to all resource access handlers

Update these handlers to include business validation:

- `transactions:*`
- `products:*`
- `users:*` (when accessing users from a business)
- `reports:*`
- `inventory:*`
- `shifts:*`

Pattern for each:

```typescript
// Get resource first
const resource = await db.resources.getById(resourceId);

if (!resource) {
  return { success: false, message: "Resource not found" };
}

// Validate business access
const businessCheck = validateBusinessAccess(auth.user!, resource.businessId);

if (!businessCheck.success) {
  return { success: false, message: businessCheck.message, code: businessCheck.code };
}
```

### Verification

- [ ] User can only access their own business resources
- [ ] Cross-business access attempts are logged in audit
- [ ] Error message doesn't reveal other business exists
- [ ] System resources (null businessId) are accessible
- [ ] All resource access handlers include validation

---

## 🎯 TESTING CHECKLIST

After implementing all critical fixes:

### Functional Tests

- [ ] User can log in with correct credentials
- [ ] User cannot log in with wrong credentials
- [ ] Session validates correctly after login
- [ ] User sees correct permissions for their role
- [ ] Admin can access admin pages
- [ ] Cashier cannot access admin pages
- [ ] Manager can access appropriate pages

### Security Tests

- [ ] Admin fallback is disabled in production
- [ ] Permission cache clears on logout
- [ ] Permission cache clears on role change
- [ ] Tokens are encrypted at rest
- [ ] User cannot access other business data
- [ ] Session expires after configured time
- [ ] Expired sessions are rejected

### Regression Tests

- [ ] Existing features still work
- [ ] Transaction creation works
- [ ] Product management works
- [ ] User management works
- [ ] Reports generation works
- [ ] No TypeScript compilation errors
- [ ] No runtime errors in console

---

## 📋 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All 6 critical fixes implemented
- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] Database backup created
- [ ] Admin fallback is DISABLED
- [ ] Token encryption is ENABLED
- [ ] Audit logging is ACTIVE
- [ ] Permission cache invalidation is WORKING
- [ ] Business isolation is ENFORCED
- [ ] User types are UNIFIED
- [ ] Documentation updated
- [ ] Team trained on RBAC system

---

## 🚨 ROLLBACK PLAN

If critical issues are found after deployment:

1. **Stop all access to application**
2. **Restore database from backup**
3. **Revert code to previous stable version**
4. **Investigate issue in development**
5. **Fix and re-test before redeployment**

---

## 📞 SUPPORT

If you encounter issues:

1. Check logs in `packages/main/logs/`
2. Review audit logs in database
3. Check permission cache stats
4. Verify user role assignments
5. Confirm session token encryption

---

**Action Plan Complete**  
**Estimated Total Time:** 14-16 hours  
**Recommended:** Complete over 3-4 days with thorough testing between each fix
