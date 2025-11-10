#!/usr/bin/env node

/**
 * Migration Bridge Script for AuraSwift
 *
 * This script helps convert Drizzle Kit generated migrations to the custom
 * versioning system format used for runtime migrations in production.
 *
 * Usage:
 *   npm run db:bridge              # Interactive mode
 *   npm run db:bridge -- --auto    # Auto-convert latest migration
 *   npm run db:bridge -- --help    # Show help
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Paths
const DRIZZLE_MIGRATIONS_DIR = join(
  rootDir,
  "packages/main/src/database/migrations"
);
const VERSIONING_MIGRATIONS_FILE = join(
  rootDir,
  "packages/main/src/database/versioning/migrations.ts"
);

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

/**
 * Get all SQL migration files from Drizzle migrations directory
 */
function getDrizzleMigrations() {
  if (!existsSync(DRIZZLE_MIGRATIONS_DIR)) {
    return [];
  }

  return readdirSync(DRIZZLE_MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({
      filename: file,
      path: join(DRIZZLE_MIGRATIONS_DIR, file),
      timestamp: file.split("_")[0],
    }));
}

/**
 * Read the current versioning migrations file
 */
function getCurrentMigrations() {
  if (!existsSync(VERSIONING_MIGRATIONS_FILE)) {
    error("Versioning migrations file not found!");
    process.exit(1);
  }

  const content = readFileSync(VERSIONING_MIGRATIONS_FILE, "utf-8");

  // Extract existing migration versions
  const versionMatches = [...content.matchAll(/version:\s*(\d+)/g)];
  const versions = versionMatches.map((match) => parseInt(match[1], 10));
  const lastVersion = versions.length > 0 ? Math.max(...versions) : 0;

  return {
    content,
    lastVersion,
    versions,
  };
}

/**
 * Parse SQL migration file
 */
function parseSQLMigration(filepath) {
  const content = readFileSync(filepath, "utf-8");
  const filename = filepath.split("/").pop();

  // Extract migration name from filename (e.g., "0001_add_suppliers.sql" -> "add_suppliers")
  const namePart = filename.replace(/^\d+_/, "").replace(".sql", "");
  const name = namePart.replace(/_/g, " ");

  return {
    sql: content.trim(),
    name,
    filename,
  };
}

/**
 * Generate TypeScript migration code
 */
function generateMigrationCode(version, migration) {
  const { sql, name } = migration;

  // Escape backticks and template literals in SQL
  const escapedSQL = sql.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

  return `  {
    version: ${version},
    name: "${migration.filename.replace(".sql", "")}",
    description: "${name}",
    up: (db) => {
      // Check if changes already exist
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all()
        .map((t: any) => t.name);
      
      // Execute migration SQL
      try {
        db.exec(\`
${escapedSQL
  .split("\n")
  .map((line) => "          " + line)
  .join("\n")}
        \`);
        console.log("      ✅ Migration '${
          migration.filename
        }' applied successfully");
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log("      ℹ️  Migration '${
            migration.filename
          }' - changes already exist");
        } else {
          throw error;
        }
      }
    },
    down: (db) => {
      // Optional: Add rollback logic here
      console.log("      ⚠️  Rollback not implemented for '${
        migration.filename
      }'");
    },
  },`;
}

/**
 * Add migration to versioning system
 */
function addMigrationToVersioning(newMigration, version) {
  const { content, lastVersion } = getCurrentMigrations();

  // Find the MIGRATIONS array
  const migrationsArrayMatch = content.match(
    /export const MIGRATIONS: Migration\[\] = \[([\s\S]*?)\];/
  );

  if (!migrationsArrayMatch) {
    error("Could not find MIGRATIONS array in versioning file");
    process.exit(1);
  }

  const currentMigrations = migrationsArrayMatch[1];
  const migrationCode = generateMigrationCode(version, newMigration);

  // Insert the new migration
  let newContent;
  if (currentMigrations.trim() === "") {
    // Empty array, just add the migration
    newContent = content.replace(
      /export const MIGRATIONS: Migration\[\] = \[([\s\S]*?)\];/,
      `export const MIGRATIONS: Migration[] = [\n${migrationCode}\n];`
    );
  } else {
    // Add to end of array
    newContent = content.replace(
      /export const MIGRATIONS: Migration\[\] = \[([\s\S]*?)\];/,
      `export const MIGRATIONS: Migration[] = [$1\n${migrationCode}\n];`
    );
  }

  return newContent;
}

/**
 * Interactive migration selection
 */
async function interactiveMode() {
  const drizzleMigrations = getDrizzleMigrations();

  if (drizzleMigrations.length === 0) {
    warning("No Drizzle migrations found!");
    info('Run "npm run db:generate" to create a migration first.');
    process.exit(0);
  }

  log("\n" + colors.bright + "🔄 Migration Bridge Tool" + colors.reset);
  log("═".repeat(50));
  log("\nAvailable Drizzle migrations:\n");

  drizzleMigrations.forEach((mig, idx) => {
    log(`  ${idx + 1}. ${colors.cyan}${mig.filename}${colors.reset}`);
  });

  const { lastVersion } = getCurrentMigrations();
  log(
    `\nCurrent migration version: ${colors.yellow}${lastVersion}${colors.reset}`
  );
  log(
    `Next version will be: ${colors.green}${lastVersion + 1}${colors.reset}\n`
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      'Select migration number to convert (or "q" to quit): ',
      (answer) => {
        rl.close();

        if (answer.toLowerCase() === "q") {
          info("Cancelled");
          process.exit(0);
        }

        const index = parseInt(answer, 10) - 1;

        if (isNaN(index) || index < 0 || index >= drizzleMigrations.length) {
          error("Invalid selection");
          process.exit(1);
        }

        resolve(drizzleMigrations[index]);
      }
    );
  });
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const isAuto = args.includes("--auto");
  const showHelp = args.includes("--help") || args.includes("-h");

  if (showHelp) {
    log("\n" + colors.bright + "Migration Bridge Tool - Help" + colors.reset);
    log("═".repeat(50));
    log(
      "\nConverts Drizzle Kit generated SQL migrations to custom versioning system.\n"
    );
    log("Usage:");
    log("  npm run db:bridge              Interactive mode");
    log("  npm run db:bridge -- --auto    Auto-convert latest migration");
    log("  npm run db:bridge -- --help    Show this help\n");
    log("Workflow:");
    log("  1. Update schema.ts with your changes");
    log("  2. Run: npm run db:generate (creates SQL migration)");
    log("  3. Run: npm run db:bridge (converts to TypeScript migration)");
    log("  4. Test: npm start (migration runs automatically)\n");
    process.exit(0);
  }

  const drizzleMigrations = getDrizzleMigrations();

  if (drizzleMigrations.length === 0) {
    warning("No Drizzle migrations found!");
    info('Run "npm run db:generate" to create a migration first.');
    process.exit(0);
  }

  let selectedMigration;

  if (isAuto) {
    // Get the latest migration
    selectedMigration = drizzleMigrations[drizzleMigrations.length - 1];
    info(`Auto-selecting latest migration: ${selectedMigration.filename}`);
  } else {
    // Interactive selection
    selectedMigration = await interactiveMode();
  }

  // Parse the migration
  const migration = parseSQLMigration(selectedMigration.path);
  const { lastVersion } = getCurrentMigrations();
  const newVersion = lastVersion + 1;

  log("\n" + colors.bright + "Converting Migration" + colors.reset);
  log("═".repeat(50));
  log(`Migration: ${colors.cyan}${migration.filename}${colors.reset}`);
  log(`Version:   ${colors.green}${newVersion}${colors.reset}`);
  log(`Name:      ${colors.yellow}${migration.name}${colors.reset}\n`);

  // Generate and update versioning file
  try {
    const newContent = addMigrationToVersioning(migration, newVersion);
    writeFileSync(VERSIONING_MIGRATIONS_FILE, newContent, "utf-8");

    success("Migration successfully added to versioning system!");
    log("\n" + colors.bright + "Next Steps:" + colors.reset);
    log("  1. Review the generated migration in:");
    log(
      `     ${colors.cyan}packages/main/src/database/versioning/migrations.ts${colors.reset}`
    );
    log("  2. Test the migration:");
    log(`     ${colors.yellow}npm start${colors.reset}`);
    log("  3. The migration will run automatically on app startup\n");
  } catch (err) {
    error("Failed to update versioning file");
    console.error(err);
    process.exit(1);
  }
}

// Run the script
main().catch((err) => {
  error("Unexpected error:");
  console.error(err);
  process.exit(1);
});
