#!/usr/bin/env node

/**
 * Migration script to add UNIQUE constraint to PLU field
 * This script handles existing databases with duplicate PLU values
 */

import Database from "better-sqlite3";
import { join } from "path";
import { existsSync } from "fs";
import { homedir } from "os";
import { platform } from "process";

// Determine database path based on platform
const getUserDataPath = () => {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return join(process.cwd(), "data");
  }

  // Production paths by platform
  const home = homedir();
  switch (platform) {
    case "darwin": // macOS
      return join(
        home,
        "Library",
        "Application Support",
        "auraswift",
        "AuraSwift"
      );
    case "win32": // Windows
      return join(
        process.env.APPDATA || join(home, "AppData", "Roaming"),
        "auraswift",
        "AuraSwift"
      );
    case "linux": // Linux
      return join(home, ".config", "auraswift", "AuraSwift");
    default:
      return join(home, ".auraswift");
  }
};

const userDataPath = getUserDataPath();
const dbPath = join(userDataPath, "pos_system.db");

console.log("🔧 PLU Unique Constraint Migration");
console.log("==================================");
console.log(`Platform: ${platform}`);
console.log(`Database path: ${dbPath}`);

if (!existsSync(dbPath)) {
  console.log("❌ Database file not found. Nothing to migrate.");
  console.log(`   Looked in: ${dbPath}`);
  console.log(
    "\n💡 If you're in development, make sure the app has been run at least once"
  );
  console.log("   to create the database, or set NODE_ENV=development");
  process.exit(0);
}

const db = new Database(dbPath);

try {
  console.log("\n📊 Checking for duplicate PLU values...");

  // Find duplicate PLUs
  const duplicatePLUs = db
    .prepare(
      `
    SELECT plu, COUNT(*) as count, GROUP_CONCAT(id) as product_ids
    FROM products 
    WHERE plu IS NOT NULL AND plu != ''
    GROUP BY plu 
    HAVING COUNT(*) > 1
  `
    )
    .all();

  if (duplicatePLUs.length > 0) {
    console.log(
      `\n⚠️  Found ${duplicatePLUs.length} duplicate PLU value(s):\n`
    );

    duplicatePLUs.forEach((dup) => {
      console.log(`   PLU: ${dup.plu}`);
      console.log(`   Used by products: ${dup.product_ids}`);
      console.log(`   Count: ${dup.count}\n`);
    });

    console.log("🔄 Resolving duplicates by clearing PLU for duplicates...\n");

    // For each duplicate PLU, keep the first product and clear the rest
    duplicatePLUs.forEach((dup) => {
      const productIds = dup.product_ids.split(",");
      const [keepId, ...clearIds] = productIds;

      console.log(`   Keeping PLU "${dup.plu}" for product: ${keepId}`);

      clearIds.forEach((productId) => {
        db.prepare("UPDATE products SET plu = NULL WHERE id = ?").run(
          productId
        );
        console.log(`   Cleared PLU for product: ${productId}`);
      });
    });

    console.log("\n✅ Duplicates resolved!");
  } else {
    console.log("✅ No duplicate PLU values found.");
  }

  console.log("\n🔨 Creating new products table with UNIQUE constraint...");

  // Disable foreign key constraints during migration
  db.pragma("foreign_keys = OFF");

  // Create backup of products table
  db.exec(`
    DROP TABLE IF EXISTS products_backup;
    CREATE TABLE products_backup AS SELECT * FROM products;
  `);

  console.log("✅ Backup created: products_backup");

  // Create new products table with UNIQUE constraint on PLU
  db.exec(`
    DROP TABLE IF EXISTS products_new;
    CREATE TABLE products_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      costPrice REAL DEFAULT 0,
      taxRate REAL DEFAULT 0,
      sku TEXT UNIQUE NOT NULL,
      plu TEXT UNIQUE,
      image TEXT,
      category TEXT NOT NULL,
      stockLevel INTEGER DEFAULT 0,
      minStockLevel INTEGER DEFAULT 0,
      businessId TEXT NOT NULL,
      isActive BOOLEAN DEFAULT 1,
      requiresWeight BOOLEAN DEFAULT 0,
      unit TEXT DEFAULT 'each',
      pricePerUnit REAL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (businessId) REFERENCES businesses (id),
      FOREIGN KEY (category) REFERENCES categories (id)
    );
  `);

  console.log("✅ New table structure created");

  // Copy data from old table to new table
  console.log("🔄 Migrating data to new table...");

  db.exec(`
    INSERT INTO products_new 
    SELECT * FROM products;
  `);

  console.log("✅ Data migrated successfully");

  // Drop old table and rename new table
  db.exec(`
    DROP TABLE products;
    ALTER TABLE products_new RENAME TO products;
  `);

  console.log("✅ Table replaced");

  // Recreate indexes
  console.log("🔄 Recreating indexes...");

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_businessId ON products(businessId);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_plu ON products(plu);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  `);

  console.log("✅ Indexes recreated");

  // Re-enable foreign key constraints
  db.pragma("foreign_keys = ON");
  console.log("✅ Foreign key constraints re-enabled");

  // Verify the migration
  const productCount = db
    .prepare("SELECT COUNT(*) as count FROM products")
    .get().count;
  const backupCount = db
    .prepare("SELECT COUNT(*) as count FROM products_backup")
    .get().count;

  console.log("\n📈 Migration Summary:");
  console.log(`   Products in new table: ${productCount}`);
  console.log(`   Products in backup: ${backupCount}`);

  if (productCount === backupCount) {
    console.log("\n✅ Migration completed successfully!");
    console.log(
      "\n💡 The backup table 'products_backup' has been kept for safety."
    );
    console.log("   You can drop it manually if everything works fine:");
    console.log("   DROP TABLE products_backup;");
  } else {
    console.log("\n⚠️  Warning: Product counts don't match!");
    console.log("   Please verify the migration manually.");
  }
} catch (error) {
  console.error("\n❌ Migration failed:", error);
  console.log("\n🔄 Attempting to restore from backup...");

  try {
    db.pragma("foreign_keys = OFF");
    db.exec(`
      DROP TABLE IF EXISTS products;
      ALTER TABLE products_backup RENAME TO products;
    `);
    db.pragma("foreign_keys = ON");
    console.log("✅ Backup restored successfully");
  } catch (restoreError) {
    console.error("❌ Failed to restore backup:", restoreError);
    console.log("⚠️  Please restore manually from products_backup table");
  }

  process.exit(1);
} finally {
  db.close();
}

console.log("\n✨ Done!\n");
