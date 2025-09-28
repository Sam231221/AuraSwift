/**
 * Database Path Test Utility
 *
 * This script helps verify the database path logic works correctly
 * in different environments.
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function simulateDatabasePath(isPackaged, nodeEnv, electronIsDev, customPath) {
  console.log("\n--- Simulating Database Path ---");
  console.log(`isPackaged: ${isPackaged}`);
  console.log(`NODE_ENV: ${nodeEnv}`);
  console.log(`ELECTRON_IS_DEV: ${electronIsDev}`);
  console.log(`POS_DB_PATH: ${customPath || "not set"}`);

  // Simulate the logic from database.ts
  if (customPath) {
    console.log(`🎯 Result: Custom path - ${customPath}`);
    return customPath;
  }

  const isDev =
    nodeEnv === "development" || electronIsDev === "true" || !isPackaged;

  if (isDev) {
    const projectRoot = path.join(__dirname, "..");
    const devDbPath = path.join(projectRoot, "dev-data", "pos_system.db");
    console.log(`🔧 Result: Development path - ${devDbPath}`);
    return devDbPath;
  } else {
    // Simulate getUserDataPath for different platforms
    const userHome = process.env.HOME || process.env.USERPROFILE || "/tmp";
    let userDataPath;

    if (process.platform === "win32") {
      userDataPath = path.join(userHome, "AppData", "Roaming");
    } else if (process.platform === "darwin") {
      userDataPath = path.join(userHome, "Library", "Application Support");
    } else {
      userDataPath = path.join(userHome, ".config");
    }

    const prodDbPath = path.join(userDataPath, "NepStoresPos", "pos_system.db");
    console.log(`🚀 Result: Production path - ${prodDbPath}`);
    return prodDbPath;
  }
}

// Test different scenarios
console.log("🧪 Database Path Logic Test\n");

// Development scenarios
simulateDatabasePath(false, "development", undefined, undefined);
simulateDatabasePath(true, "development", undefined, undefined);
simulateDatabasePath(false, undefined, "true", undefined);

// Production scenarios
simulateDatabasePath(true, "production", "false", undefined);
simulateDatabasePath(true, undefined, undefined, undefined);

// Custom path scenario
simulateDatabasePath(false, "development", undefined, "/custom/db/path.db");

// Test with actual existing database if provided via command line
if (process.env.POS_DB_PATH) {
  console.log("\n--- Testing with Existing Database ---");
  const existingDbPath = process.env.POS_DB_PATH;
  console.log(`Testing path: ${existingDbPath}`);

  if (fs.existsSync(existingDbPath)) {
    console.log("✅ Database file exists");

    const stats = fs.statSync(existingDbPath);
    console.log(`📁 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`📅 Modified: ${stats.mtime.toISOString()}`);

    // Check if it's readable
    try {
      fs.accessSync(existingDbPath, fs.constants.R_OK);
      console.log("✅ Database file is readable");
    } catch (err) {
      console.log("❌ Database file is not readable");
      console.log(`   Error: ${err.message}`);
    }

    // Check if it's writable
    try {
      fs.accessSync(existingDbPath, fs.constants.W_OK);
      console.log("✅ Database file is writable");
    } catch (err) {
      console.log("⚠️  Database file is not writable (read-only mode)");
    }
  } else {
    console.log("❌ Database file does not exist");
    console.log("   Make sure the path is correct and the file exists");
  }
}

console.log("\n✅ Database path logic test completed!");
console.log("\n📋 Usage Examples:");
console.log("\nDevelopment (default):");
console.log("  npm start");
console.log("\nUsing existing database:");
console.log("  export POS_DB_PATH='/path/to/your/existing/database.db'");
console.log("  npm start");
console.log("\nDatabase management:");
console.log("  npm run db:dev:clean    # Remove development database");
console.log("  npm run db:dev:backup   # Backup development database");
console.log("  npm run db:info         # Show database info help");
console.log("\nTest with existing database:");
console.log("  POS_DB_PATH='/your/path/database.db' node test-db-path.mjs");
