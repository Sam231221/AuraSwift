# Database Refactoring Plan

## Current Issues

### 1. Redundant Code in database.ts (6,700 lines)

**Problem**: Triple implementation of every database operation:

- Inline raw SQL methods
- Inline Drizzle methods (`*Drizzle` suffix)
- Manager methods (proper location)

**Example - User Operations:**

```typescript
// Method 1: Inline raw SQL (database.ts line ~1473)
getUserByEmail(email: string): User | null {
  const user = this.db.prepare("SELECT...").get(email);
  // ... 10 lines
}

// Method 2: Inline Drizzle (database.ts line ~1874)
async getUserByEmailDrizzle(email: string): Promise<User | null> {
  const user = await this.drizzle.select()...;
  // ... 20 lines
}

// Method 3: Manager (userManager.ts line ~192)
getUserByEmail(email: string): User | null {
  // Actual implementation used by code
}
```

**Result**: ~4,000 lines of dead code in database.ts

### 2. Inconsistent Usage Patterns

**Current Usage:**

```typescript
// authApi.ts uses direct db methods:
const user = await db.authenticateUser(username, pin);
const session = db.createSession(userId);

// But these methods exist in managers:
db.users.authenticateUser(username, pin);
db.sessions.createSession(userId);
```

### 3. Demo Users as Inline Code

**Problem**: `createDefaultDemoUsers()` is inline in `initializeTables()`

- Should be version-controlled migration
- Not tracked in PRAGMA user_version
- Runs every time, not idempotent properly

### 4. Unused database/index.ts Entry Point

**Problem**: Alternative initialization system exists but unused:

- `database/index.ts` exports `initializeDatabase()`
- `database/db-manager.ts` has separate DBManager class
- Main code imports from `database.ts` only

## Refactoring Strategy

### Phase 1: Clean database.ts (IMMEDIATE)

**Actions:**

1. Remove all inline CRUD methods (lines ~1370-6500)
2. Keep only:

   - Manager initialization
   - Path management
   - Schema creation (initializeTables)
   - Versioning setup
   - Essential facade methods that delegate to managers

3. For methods like `authenticateUser` and `createSession` used by authApi:
   - Keep as thin facade: `authenticateUser(...) { return this.users.authenticateUser(...); }`
   - OR update authApi to use managers directly: `db.users.authenticateUser(...)`

**Expected Reduction**: 6,700 lines → ~2,000 lines

### Phase 2: Move Demo Users to Migration

**Actions:**

1. Remove `createDefaultDemoUsers()` from database.ts
2. Create migration v3 in `database/versioning/migrations.ts`:

```typescript
{
  version: 3,
  name: "0003_create_demo_users",
  description: "Create default demo users (admin, john, sarah, emma)",
  up: (db) => {
    // Check if users exist
    const existingUsers = db.prepare("SELECT COUNT(*) as count FROM users").get();
    if (existingUsers.count === 0) {
      // Create admin, john, sarah, emma with PIN 1234
    }
  }
}
```

### Phase 3: Standardize Manager Usage

**Actions:**

1. Update authApi.ts to use managers:

```typescript
// Before:
const user = await db.authenticateUser(username, pin);

// After:
const user = await db.users.authenticateUser(username, pin);
```

2. Remove facade methods from database.ts
3. Export managers from getDatabase()

### Phase 4: Documentation Cleanup

**Actions:**

1. Remove verbose migration system comments from database.ts
2. Keep single source of truth in `database/versioning/` docs
3. Add brief comment: "// See database/versioning/ for migration system"

## Implementation Order

1. ✅ **Phase 2 First** - Move demo users to migration (safe, additive)
2. ✅ **Phase 1** - Remove redundant methods (big cleanup)
3. ✅ **Phase 3** - Update usage patterns (requires testing)
4. ✅ **Phase 4** - Documentation (polish)

## Testing Checklist

After each phase:

- [ ] App starts successfully
- [ ] Login works with PIN
- [ ] Demo users load correctly
- [ ] No TypeScript errors
- [ ] No runtime errors in console

## Files to Modify

1. **packages/main/src/database.ts** - Major cleanup
2. **packages/main/src/database/versioning/migrations.ts** - Add v3
3. **packages/main/src/authApi.ts** - Use managers directly
4. **packages/main/src/authStore.ts** - Use managers directly

## Files to Review (No Changes)

- database/managers/\* - Already correct
- database/versioning/index.ts - Already correct
- database/drizzle.ts - Already correct
- database/schema.ts - Already correct
