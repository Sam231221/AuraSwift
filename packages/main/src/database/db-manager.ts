import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { app, dialog } from "electron";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runDrizzleMigrations } from "./drizzle-migrator.js";
import Database from "better-sqlite3";
import semver from "semver";
import * as schema from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Manager
 *
 * Handles low-level database initialization and schema creation.
 *
 * Initialization Flow:
 * 1. Connect to SQLite database
 * 2. Create baseline schema via initializeTables() (if needed)
 * 3. Run Drizzle ORM migrations automatically
 *
 * Migration System:
 * - Uses Drizzle Kit's built-in migrator
 * - Migrations tracked in __drizzle_migrations table
 * - .sql files in migrations/ folder are auto-applied
 * - No manual copying of SQL needed!
 *
 * To add a new migration:
 * 1. Update schema.ts
 * 2. Run: npm run db:generate
 * 3. Commit the generated .sql file
 * 4. Migration auto-runs on client update
 *
 * For database operations, use DatabaseManager from database.ts
 * which provides manager classes for domain-specific operations.
 */
export class DBManager {
  private db: Database.Database | null = null;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    // Return existing promise if initialization is in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.initialized) {
      return;
    }

    // Start initialization and store the promise to prevent concurrent initializations
    this.initializationPromise = (async (): Promise<void> => {
      try {
        const dbPath = this.getDatabasePath();
        console.log("Database path:", dbPath);

        // Ensure the directory exists
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }

        this.db = new Database(dbPath);

        // Initialize Drizzle ORM wrapper with schema
        const drizzleDb = drizzle(this.db, { schema });

        // Check for downgrade scenario (newer database, older app)
        const isDowngradeAttempt = this.checkForDowngrade(this.db, dbPath);
        if (isDowngradeAttempt) {
          console.error(
            "❌ Database downgrade detected - app version is older than database schema"
          );
          // Close database connection before quitting
          this.db.close();
          this.db = null;
          dialog.showErrorBox(
            "Cannot Open Database",
            "This database was created with a newer version of AuraSwift.\n\n" +
              "Please update the application to the latest version to continue.\n\n" +
              `Current app version: ${app.getVersion()}\n` +
              "Database requires a newer version."
          );
          app.quit();
          return;
        }

        // Run Drizzle migrations automatically
        // Pass both Drizzle wrapper (for migrate()) and raw DB (for transactions/integrity checks)
        const migrationSuccess = await runDrizzleMigrations(
          drizzleDb,
          this.db,
          dbPath
        );

        if (!migrationSuccess) {
          const errorMessage = `Database migration failed. Check the migration logs above for details. Database path: ${dbPath}`;
          console.error(`❌ ${errorMessage}`);
          throw new Error(errorMessage);
        }

        this.initialized = true;
        console.log("✅ Database initialized successfully\n");
      } catch (error) {
        // Reset state on error to allow retry
        this.initialized = false;
        this.initializationPromise = null;
        if (this.db) {
          this.db.close();
          this.db = null;
        }

        // Provide detailed error context
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        const dbPath = this.getDatabasePath();

        console.error("❌ Database initialization error:");
        console.error(`   Path: ${dbPath}`);
        console.error(`   Error: ${errorMessage}`);
        if (errorStack) {
          console.error(`   Stack: ${errorStack}`);
        }

        throw new Error(
          `Database initialization failed at ${dbPath}: ${errorMessage}`,
          { cause: error }
        );
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Check if user is trying to open a newer database with an older app version
   * This prevents crashes from schema mismatches during downgrades
   */
  private checkForDowngrade(db: Database.Database, dbPath: string): boolean {
    try {
      // Get app version
      const appVersion = app.getVersion();

      // Check if database has migration tracking table
      const tableExists = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'"
        )
        .get();

      if (!tableExists) {
        // No migrations applied yet - fresh database, no downgrade risk
        return false;
      }

      // Get the latest migration applied to database
      const latestMigration = db
        .prepare(
          "SELECT created_at FROM __drizzle_migrations ORDER BY id DESC LIMIT 1"
        )
        .get() as { created_at: number } | undefined;

      if (!latestMigration) {
        // No migrations applied yet
        return false;
      }

      // Store app version in a custom table for version tracking
      // This allows us to detect downgrades across updates
      const versionTableExists = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='_app_version'"
        )
        .get();

      if (!versionTableExists) {
        // Create version tracking table
        db.exec(`
          CREATE TABLE IF NOT EXISTS _app_version (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            version TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `);

        // Store current version
        db.prepare(
          "INSERT OR REPLACE INTO _app_version (id, version, updated_at) VALUES (1, ?, ?)"
        ).run(appVersion, Date.now());

        return false; // First time tracking, no downgrade
      }

      // Get stored version
      const storedVersion = db
        .prepare("SELECT version FROM _app_version WHERE id = 1")
        .get() as { version: string } | undefined;

      if (!storedVersion) {
        // No version stored, store current and continue
        db.prepare(
          "INSERT OR REPLACE INTO _app_version (id, version, updated_at) VALUES (1, ?, ?)"
        ).run(appVersion, Date.now());
        return false;
      }

      // Compare versions (simple string comparison works for semver if formatted correctly)
      const isDowngrade = this.isVersionDowngrade(
        storedVersion.version,
        appVersion
      );

      if (!isDowngrade) {
        // Update stored version to current
        db.prepare(
          "UPDATE _app_version SET version = ?, updated_at = ? WHERE id = 1"
        ).run(appVersion, Date.now());
      }

      return isDowngrade;
    } catch (error) {
      console.error("Error checking for downgrade:", error);
      // On error, allow to proceed (don't block legitimate updates)
      return false;
    }
  }

  /**
   * Compare two semver version strings
   * Returns true if newVersion < storedVersion (downgrade attempt)
   * Uses semver library for proper version comparison
   */
  private isVersionDowngrade(
    storedVersion: string,
    newVersion: string
  ): boolean {
    try {
      // Validate versions are valid semver
      if (!semver.valid(storedVersion) || !semver.valid(newVersion)) {
        console.warn(
          `Invalid semver format - stored: ${storedVersion}, current: ${newVersion}. Falling back to simple comparison.`
        );
        // Fallback to simple comparison for non-semver versions
        const stored = storedVersion.split(".").map(Number);
        const current = newVersion.split(".").map(Number);

        for (let i = 0; i < Math.max(stored.length, current.length); i++) {
          const s = stored[i] || 0;
          const c = current[i] || 0;

          if (c < s) return true; // Downgrade detected
          if (c > s) return false; // Upgrade, OK
        }

        return false; // Same version, OK
      }

      // Use semver for proper comparison (handles pre-release, build metadata, etc.)
      return semver.lt(newVersion, storedVersion);
    } catch (error) {
      console.error(
        `Version comparison error - stored: ${storedVersion}, current: ${newVersion}:`,
        error
      );
      // On error, don't block (allow to proceed)
      return false;
    }
  }

  public getDatabasePath(): string {
    // Multiple ways to detect development mode
    const isDev =
      process.env.NODE_ENV === "development" ||
      process.env.ELECTRON_IS_DEV === "true" ||
      !app.isPackaged;

    // Allow override via environment variable for testing
    const customDbPath = process.env.POS_DB_PATH;
    if (customDbPath) {
      console.log("Using custom database path:", customDbPath);
      return customDbPath;
    }

    if (isDev) {
      // Development: Store in project directory
      // app.getAppPath() returns the project root in development
      const projectRoot = app.getAppPath();
      const devDbPath = path.join(projectRoot, "data", "pos_system.db");
      console.log("Development mode: Using project directory for database");
      console.log("Database at:", devDbPath);
      return devDbPath;
    } else {
      // Production: Use proper user data directory based on platform
      const userDataPath = app.getPath("userData");
      const prodDbPath = path.join(userDataPath, "AuraSwift", "pos_system.db");
      console.log("Production mode: Using user data directory for database");
      console.log("Database at:", prodDbPath);
      return prodDbPath;
    }
  }

  getDb(): Database.Database {
    if (!this.initialized || !this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.initialized = false;
    }
  }
}
