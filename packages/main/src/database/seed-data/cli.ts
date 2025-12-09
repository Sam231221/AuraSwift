/**
 * CLI Script for Manual Bulk Seeding
 * Usage: tsx packages/main/src/database/seed-data/cli.ts [preset]
 *
 * Standalone script that doesn't require Electron context
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { BulkDataSeeder } from "./index.js";
import * as schema from "../schema.js";
import { getLogger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = getLogger("seed-cli");

/**
 * Get database path for CLI context
 */
function getDatabasePath(): string {
  // Use development data directory
  const dataDir = path.join(process.cwd(), "data");

  // Create directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return path.join(dataDir, "pos_system.db");
}

async function main() {
  const args = process.argv.slice(2);
  const preset = (args[0] || "small") as any;

  logger.info("🚀 Bulk Seeding CLI (Standalone Mode)");
  logger.info(`   Preset: ${preset}`);
  logger.info("");

  try {
    // Get database path
    const dbPath = getDatabasePath();
    logger.info(`📁 Database: ${dbPath}`);

    // Initialize SQLite database directly
    const sqliteDb = new Database(dbPath);

    // Enable WAL mode for better concurrency
    sqliteDb.pragma("journal_mode = WAL");

    // Initialize Drizzle ORM
    const drizzleDb = drizzle(sqliteDb, { schema });

    logger.info("✅ Database initialized");

    // Run migrations to create schema
    const migrationsPath = join(__dirname, "..", "migrations");
    if (fs.existsSync(migrationsPath)) {
      logger.info("🔄 Running migrations...");
      migrate(drizzleDb, { migrationsFolder: migrationsPath });
      logger.info("✅ Migrations completed\n");
    } else {
      logger.warn(`⚠️  Migrations folder not found: ${migrationsPath}`);
      logger.warn("   Database schema may not be initialized\n");
    }

    // Run bulk seeding
    const seeder = new BulkDataSeeder(drizzleDb as any, sqliteDb, schema);
    await seeder.seedWithPreset(preset);

    // Close database
    sqliteDb.close();

    logger.info(
      "\n✅ Done! You can now start the app and test with seeded data."
    );
    logger.info("   Run: npm run start\n");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
