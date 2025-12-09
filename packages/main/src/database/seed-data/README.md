# Database Seeding

This module provides tools for seeding your AuraSwift POS database with both essential system data and large test datasets for performance testing and development.

> **✅ AUTOMATIC FIRST-RUN SEEDING**: The app now automatically seeds essential system data (users, roles, business, terminal) on first launch when the database is empty. This ensures production releases work out-of-the-box. Manual seeding commands are still available for development and testing.

## Quick Start

### 1. Essential System Data (Automatic on First Run)

On first launch, the app **automatically** seeds essential system data:

```bash
npm run start  # App will auto-seed on first run
```

For manual seeding (development/testing):

```bash
npm run seed:basic  # Creates users, roles, business, terminal
```

**Note:** The seed command automatically runs database migrations if needed.

This creates:

- ✅ Demo business (AuraSwift Demo Store)
- ✅ Default terminal (Main Counter)
- ✅ 3 roles (Admin, Manager, Cashier)
- ✅ 3 default users (MrAdmin, MrManager, MrCashier)

**Default Login:**

- Username: `MrAdmin`
- Password: `admin123`
- PIN: `1234`

### 2. Seed Test Data (Optional)

Choose a preset based on your testing needs:

```bash
# Just basic data (no products/categories)
npm run seed:basic

# Quick testing (500 products, 50 categories)
npm run seed:minimal

# Realistic testing (2,000 products, 200 categories)
npm run seed:small

# Full testing (10,000 products, 1,000 categories)
npm run seed:medium

# Stress testing (30,000 products, 5,000 categories)
npm run seed:large

# Maximum stress (60,000 products, 10,000 categories)
npm run seed:xlarge
```

**Note**: All presets (except `basic`) automatically include basic system data if it doesn't exist.

### 3. Clean and Reseed

```bash
# Clean database and start fresh
npm run db:dev:clean

# Seed basic data (required)
npm run seed:basic

# Optionally add test data
npm run seed:small

# Now start the app
npm run start
```

## File Structure

```
seed-data/
├── cli.ts                      # Command-line interface
├── config.ts                   # Presets and configuration
├── db-performance.ts           # Performance optimizations
├── index.ts                    # Main orchestrator
├── logger.ts                   # CLI-compatible logger (no Electron deps)
├── generators/
│   ├── basic-data-generator.ts # Essential system data (users, roles, etc.)
│   ├── category-generator.ts   # Category data generation
│   └── product-generator.ts    # Product data generation
└── performance/                # Future: Benchmarking tools
```

## Features

### Realistic Data Generation

- **Categories**: Hierarchical structure (parent/child relationships)
- **Products**: Three types (STANDARD, WEIGHTED, GENERIC)
- **Age Restrictions**: Proper handling for alcohol and tobacco
- **Pricing**: Realistic price ranges based on product type
- **Stock**: Random stock levels with low stock thresholds
- **Unique Identifiers**: Auto-generated SKUs and barcodes

### Performance Optimizations

- **Batch Processing**: Inserts records in configurable batches
- **Transactions**: Uses SQLite transactions for speed
- **WAL Mode**: Enables Write-Ahead Logging for concurrency
- **Progress Tracking**: Real-time progress reporting
- **Memory Management**: Efficient handling of large datasets

### Presets

| Preset  | Categories | Products | Use Case                   |
| ------- | ---------- | -------- | -------------------------- |
| basic   | 0          | 0        | Essential system data only |
| minimal | 50         | 500      | Quick testing              |
| small   | 200        | 2,000    | Development                |
| medium  | 1,000      | 10,000   | Realistic testing          |
| large   | 5,000      | 30,000   | Performance testing        |
| xlarge  | 10,000     | 60,000   | Extreme stress testing     |

**Note**: `basic` preset creates users, roles, business, and terminal only. All other presets include basic data automatically.

## Usage Examples

### Basic Usage

```bash
# First time setup (required)
npm run seed:basic

# Add test data for development
npm run seed:small

# Now start the app
npm run start
```

### Programmatic Usage

```typescript
import { BulkDataSeeder } from "./seed-data/index.js";
import { DBManager } from "./db-manager.js";
import * as schema from "./schema.js";

const dbManager = new DBManager();
await dbManager.initialize();

const seeder = new BulkDataSeeder(db, sqliteDb, schema);

// Use a preset
await seeder.seedWithPreset("medium");

// Or custom configuration
await seeder.seedWithConfig({
  categories: 500,
  products: 5000,
  batchSize: 500,
  clearExisting: false,
});
```

## Performance Tips

1. **Use SSDs**: Bulk inserts are I/O intensive
2. **Increase Batch Size**: Larger batches = faster inserts (try 1000)
3. **Close Other Apps**: Free up memory and CPU
4. **Monitor Progress**: Watch the console for progress updates

## Troubleshooting

### "No business found" Error

**Solution**: This should not happen in normal use as the app auto-seeds on first run. If it does occur:

```bash
npm run db:dev:clean  # Clean database
npm run seed:basic    # Manually seed
```

**Note**: If you see this error after installing a release build, please report it as a bug.

### Slow Performance

**Solutions**:

- Use an SSD instead of HDD
- Increase batch size in config
- Close memory-intensive applications

### Memory Errors

**Solutions**:

```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run seed:large
```

### Duplicate Key Errors

**Solution**: Clear existing data first:

```bash
npm run db:dev:clean
npm run seed:basic
npm run seed:small
```

## Next Steps

After seeding, you can:

1. **Test Performance**: Check how your app handles large datasets
2. **Test Search**: Verify search functionality with realistic data
3. **Test Pagination**: Ensure pagination works smoothly
4. **Profile Queries**: Identify slow queries and optimize

## Development

To modify or extend the seeding:

1. Edit `config.ts` to add new presets
2. Update generators to add new fields
3. Create new generators for other entities (suppliers, etc.)
4. Add performance benchmarks in `performance/` directory

## Best Practices

✅ **DO**:

- Trust the automatic first-run seeding for production releases
- Use `npm run seed:basic` for manual testing/development
- Use appropriate preset for your test scenario
- Monitor memory usage during large dataset seeding
- Clean database between test runs with `npm run db:dev:clean`

❌ **DON'T**:

- Don't manually seed production releases (it's automatic)
- Don't commit generated database files
- Don't run manual seed commands while the app is running
- Don't disable first-run seeding (it's essential for releases)

---

For more details, see the full plan in `docs/A.SeedingThousandsOfRecordPlan.md`
