// Cash Drawer IPC Handlers
import { ipcMain } from "electron";
import { getDatabase } from "../database/index.js";
import { getLogger } from "../utils/logger.js";

const logger = getLogger("dbHandlers");
let db: any = null;

export function registerDbHandlers() {
  ipcMain.handle("database:getInfo", async () => {
    try {
      const db = await getDatabase();
      const info = db.getDatabaseInfo();

      return {
        success: true,
        data: info,
      };
    } catch (error) {
      logger.error("Get database info IPC error:", error);
      return {
        success: false,
        message: "Failed to get database information",
      };
    }
  });

  // Database Backup IPC Handler - Save database to user-selected location
  ipcMain.handle("database:backup", async (event) => {
    try {
      const { dialog, BrowserWindow } = await import("electron");
      const fs = await import("fs/promises");
      const path = await import("path");

      const db = await getDatabase();
      const info = db.getDatabaseInfo();

      // Generate default filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")[0];
      const timeStr = new Date()
        .toTimeString()
        .split(" ")[0]
        .replace(/:/g, "-");
      const defaultFilename = `auraswift-backup-${timestamp}-${timeStr}.db`;

      // Show save dialog
      const focusedWindow = BrowserWindow.getFocusedWindow();
      const result = await dialog.showSaveDialog(focusedWindow!, {
        title: "Save Database Backup",
        defaultPath: defaultFilename,
        filters: [
          { name: "Database Files", extensions: ["db"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return {
          success: false,
          message: "Backup cancelled by user",
          cancelled: true,
        };
      }

      // Copy database file to selected location
      await fs.copyFile(info.path, result.filePath);

      // Get file stats for confirmation
      const stats = await fs.stat(result.filePath);

      return {
        success: true,
        data: {
          path: result.filePath,
          size: stats.size,
          timestamp: new Date().toISOString(),
        },
        message: "Database backed up successfully",
      };
    } catch (error) {
      logger.error("Database backup error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to backup database",
      };
    }
  });

  // Database Empty IPC Handler - Delete all data from all tables (keep structure)
  ipcMain.handle("database:empty", async (event) => {
    try {
      const db = await getDatabase();
      const info = db.getDatabaseInfo();

      // Create automatic backup before emptying
      const fs = await import("fs/promises");
      const path = await import("path");

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")[0];
      const timeStr = new Date()
        .toTimeString()
        .split(" ")[0]
        .replace(/:/g, "-");
      const backupPath = info.path.replace(
        ".db",
        `-backup-before-empty-${timestamp}-${timeStr}.db`
      );

      // Create backup
      await fs.copyFile(info.path, backupPath);
      logger.info(`Backup created before emptying: ${backupPath}`);

      // Get backup file stats
      const backupStats = await fs.stat(backupPath);
      const backupSize = backupStats.size;

      // Empty all tables using the public method
      const result = await db.emptyAllTables();

      if (!result.success) {
        return {
          success: false,
          message: result.error || "Failed to empty database",
        };
      }

      return {
        success: true,
        data: {
          backupPath,
          backupSize,
          tablesEmptied: result.tablesEmptied.length,
          totalRowsDeleted: result.rowsDeleted,
          tableList: result.tablesEmptied,
        },
        message: "Database emptied successfully",
      };
    } catch (error) {
      logger.error("Database empty error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to empty database",
      };
    }
  });

  // Database Import IPC Handler - Import database from a file
  ipcMain.handle("database:import", async (event) => {
    try {
      const { dialog, app: electronApp } = await import("electron");
      const fs = await import("fs/promises");
      const path = await import("path");

      // Show open file dialog to select database file
      const result = await dialog.showOpenDialog({
        title: "Select Database File to Import",
        buttonLabel: "Import",
        filters: [
          { name: "Database Files", extensions: ["db", "sqlite", "sqlite3"] },
          { name: "All Files", extensions: ["*"] },
        ],
        properties: ["openFile"],
      });

      // Check if user cancelled
      if (
        result.canceled ||
        !result.filePaths ||
        result.filePaths.length === 0
      ) {
        return {
          success: false,
          cancelled: true,
          message: "Import cancelled by user",
        };
      }

      const importPath = result.filePaths[0];
      logger.info("Importing database from:", importPath);

      // Verify the file exists and is readable
      try {
        await fs.access(importPath);
      } catch (error) {
        return {
          success: false,
          message: "Selected file does not exist or is not accessible",
        };
      }

      // Get file stats
      const importStats = await fs.stat(importPath);
      const importSize = importStats.size;

      // Get current database info (before closing)
      const db = await getDatabase();
      const info = db.getDatabaseInfo();

      // Create backup of current database before importing
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")[0];
      const timeStr = new Date()
        .toTimeString()
        .split(" ")[0]
        .replace(/:/g, "-");
      const backupPath = info.path.replace(
        ".db",
        `-backup-before-import-${timestamp}-${timeStr}.db`
      );

      // Backup current database
      if (info.exists) {
        await fs.copyFile(info.path, backupPath);
        logger.info(`Current database backed up to: ${backupPath}`);
      }

      // Close current database connection
      const { closeDatabase } = await import("../database/index.js");
      closeDatabase();
      logger.info("Database connection closed");

      // Wait a bit to ensure database is fully closed
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Copy imported file to database location
      await fs.copyFile(importPath, info.path);
      logger.info(`Database imported from: ${importPath}`);

      // Get stats of imported database
      const newStats = await fs.stat(info.path);

      // Return success (app will restart from renderer side)
      return {
        success: true,
        data: {
          importedFrom: importPath,
          importSize,
          backupPath: info.exists ? backupPath : undefined,
          newSize: newStats.size,
        },
        message: "Database imported successfully",
      };
    } catch (error) {
      logger.error("Database import error:", error);

      // Try to reinitialize database if import failed
      try {
        const { getDatabase: getNewDatabase } = await import(
          "../database/index.js"
        );
        await getNewDatabase();
      } catch (reinitError) {
        logger.error(
          "Failed to reinitialize database after error:",
          reinitError
        );
      }

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to import database",
      };
    }
  });

  // App Restart IPC Handler - Restart the application
  ipcMain.handle("app:restart", async () => {
    try {
      const { app: electronApp } = await import("electron");

      logger.info("Restarting application...");

      // Close database connection before restart
      const { closeDatabase } = await import("../database/index.js");
      closeDatabase();

      // Relaunch and exit
      electronApp.relaunch();
      electronApp.exit(0);

      return { success: true };
    } catch (error) {
      logger.error("App restart error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to restart app",
      };
    }
  });
}
