# Category & Product Seeding - Quick Usage Guide

## TL;DR

```bash
# Terminal
npm run start

# DevTools Console (open with View → Toggle Developer Tools)
await seedAPI.runPreset("small");
```

## Available Commands

### In DevTools Console

```javascript
// Quick presets
await seedAPI.runPreset("minimal"); // 50 categories, 500 products
await seedAPI.runPreset("small"); // 200 categories, 2,000 products
await seedAPI.runPreset("medium"); // 1,000 categories, 10,000 products
await seedAPI.runPreset("large"); // 5,000 categories, 30,000 products
await seedAPI.runPreset("xlarge"); // 10,000 categories, 60,000 products

// Custom configuration
await seedAPI.runCustom({
  categories: 100,
  products: 500,
  batchSize: 200,
  clearExisting: true,
});
```

## Common Scenarios

### First Time Setup

1. Start app: `npm run start`
2. Open DevTools Console
3. Run: `await seedAPI.runPreset("small")`
4. Navigate to Product Management

### Adding More Data

```javascript
// Adds to existing data
await seedAPI.runPreset("medium");
```

### Replacing All Data

```javascript
// Clears and reseeds
await seedAPI.runCustom({
  categories: 200,
  products: 2000,
  clearExisting: true,
});
```

### Performance Testing

```javascript
// Large dataset for testing
await seedAPI.runPreset("large");
```

## Why No CLI?

CLI scripts like `npm run seed:small` don't work because Electron compiles native modules differently than Node.js. The in-app method is the proper solution.

## File Structure

```
seed-data/
├── index.ts              # Main CategoryProductSeeder class
├── config.ts             # Preset configurations & templates
├── generators/
│   ├── category-generator.ts  # Category data generation
│   └── product-generator.ts   # Product data generation
├── README.md             # Full documentation
└── USAGE.md             # This quick guide
```

## Need Help?

See [README.md](./README.md) for full documentation, troubleshooting, and advanced usage.
