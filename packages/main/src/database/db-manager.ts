import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { app } from "electron";
import { createRequire } from "module";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runDrizzleMigrations } from "./drizzle-migrator.js";

const require = createRequire(import.meta.url);
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
  private db: any;
  private initialized: boolean = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const Database = require("better-sqlite3");
      const dbPath = this.getDatabasePath();
      console.log("Database path:", dbPath);

      // Ensure the directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(dbPath);

      // Initialize Drizzle ORM wrapper
      const drizzleDb = drizzle(this.db);

      // Run Drizzle migrations automatically
      // This handles ALL schema creation from .sql files (no manual table creation needed!)
      const migrationSuccess = await runDrizzleMigrations(drizzleDb, dbPath);

      if (!migrationSuccess) {
        throw new Error("Database migration failed");
      }

      this.initialized = true;
      console.log("✅ Database initialized successfully\n");
    } catch (error) {
      console.error("Database initialization error:", error);
      throw error;
    }
  }

  private getDatabasePath(): string {
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

  getDb(): any {
    if (!this.initialized) {
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
