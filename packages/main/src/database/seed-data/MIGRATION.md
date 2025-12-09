# Migration Guide: Automatic Seeding Disabled

## What Changed?

**Automatic database seeding on `npm run start` has been disabled.**

Previously, when you ran `npm run start`, the app would automatically create:

- Default business
- Default terminal
- 3 roles (Admin, Manager, Cashier)
- 3 users (MrAdmin, MrManager, MrCashier)

This automatic behavior has been **moved to manual control** for better flexibility and control.

## Why This Change?

1. **Better Control**: You decide when and what to seed
2. **Faster Startup**: App starts immediately without seeding delays
3. **Testing Flexibility**: Easy to test with different data configurations
4. **Production Safety**: No accidental seeding in production environments

## Migration Steps

### If You're Starting Fresh

```bash
# 1. Clean any existing database
npm run db:dev:clean

# 2. Seed essential system data (REQUIRED)
npm run seed:basic

# 3. Optionally add test data
npm run seed:small  # or medium, large, xlarge

# 4. Start the app
npm run start
```

### If You Have an Existing Database

Your existing data is safe! No action needed unless you want to reseed:

```bash
# Continue using your existing database
npm run start

# OR reseed if you want fresh data
npm run db:dev:clean
npm run seed:basic
npm run start
```

## New Commands

### Basic Seeding (Required for New Databases)

```bash
npm run seed:basic
```

Creates:

- ✅ Business: AuraSwift Demo Store
- ✅ Terminal: Main Counter
- ✅ Roles: Admin, Manager, Cashier (with permissions)
- ✅ Users: MrAdmin, MrManager, MrCashier

**Default Credentials:**

| User    | Username  | Password   | PIN  |
| ------- | --------- | ---------- | ---- |
| Admin   | MrAdmin   | admin123   | 1234 |
| Manager | MrManager | manager123 | 1234 |
| Cashier | MrCashier | cashier123 | 1234 |

### Test Data Seeding (Optional)

```bash
npm run seed:minimal  # 500 products, 50 categories
npm run seed:small    # 2,000 products, 200 categories
npm run seed:medium   # 10,000 products, 1,000 categories
npm run seed:large    # 30,000 products, 5,000 categories
npm run seed:xlarge   # 60,000 products, 10,000 categories
```

All these commands automatically include basic data if it doesn't exist.

## Common Workflows

### Daily Development

```bash
# Start the app
npm run start

# Your existing data is preserved
```

### Fresh Start

```bash
# Clean and reseed
npm run db:dev:clean
npm run seed:basic
npm run seed:small
npm run start
```

### Testing Different Scenarios

```bash
# Test with minimal data
npm run db:dev:clean
npm run seed:minimal
npm run start

# Test with large dataset
npm run db:dev:clean
npm run seed:large
npm run start
```

### Production-Like Testing

```bash
# Just basic data, no test products
npm run db:dev:clean
npm run seed:basic
npm run start
```

## Troubleshooting

### "No business found" Error

**Cause**: Database is empty, no basic data seeded.

**Solution**:

```bash
npm run seed:basic
```

### App Starts But Can't Login

**Cause**: No users exist in database.

**Solution**:

```bash
npm run seed:basic
```

### Want Old Automatic Behavior?

If you really need automatic seeding (not recommended), you can re-enable it:

1. Open `packages/main/src/database/index.ts`
2. Find the commented-out seeding block (around line 111)
3. Uncomment the try-catch block

**Note**: This is NOT recommended for production or CI environments.

## Benefits of Manual Seeding

### ✅ Advantages

- **Faster startup** - No seeding delays
- **Better testing** - Choose data size per test
- **Clear control** - Know exactly what's in your DB
- **Production safe** - No accidental data creation
- **Flexible workflows** - Seed once, test multiple times

### ⚠️ Migration Considerations

- You must manually seed new databases
- CI/CD pipelines need `npm run seed:basic` before tests
- Team members need to run `npm run seed:basic` after `git pull` if DB schema changed

## Team Communication

**Share this with your team:**

> 🚨 **Important Update**: Automatic database seeding has been disabled.
>
> **For new databases**, run:
>
> ```bash
> npm run seed:basic
> ```
>
> **For existing databases**, no action needed.
>
> See `packages/main/src/database/seed-data/MIGRATION.md` for details.

## CI/CD Updates

If you have CI/CD pipelines, update them:

```yaml
# Before
- npm run start

# After
- npm run seed:basic # Add this line
- npm run start
```

Or for E2E tests:

```yaml
# Before
- npm run test:e2e:clean

# After
- npm run db:dev:clean
- npm run seed:basic
- npm run test:e2e
```

## Questions?

See the full documentation:

- `packages/main/src/database/seed-data/README.md` - Complete guide
- `docs/A.SeedingThousandsOfRecordPlan.md` - Implementation details

## Rollback (Emergency)

If something goes wrong and you need the old behavior temporarily:

1. Open `packages/main/src/database/index.ts`
2. Uncomment lines 126-148 (the try-catch block)
3. Save and restart

Then file an issue so we can help debug the problem!
