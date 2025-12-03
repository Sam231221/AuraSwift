/**
 * IPC handlers for update functionality
 * Handles update actions from renderer process
 */

import { ipcMain, BrowserWindow } from "electron";
import type { UpdateCheckResult } from "electron-updater";
import { getAutoUpdaterInstance } from "../index.js";
import { getLogger } from "../utils/logger.js";

const logger = getLogger("update-handlers");

/**
 * Register IPC handlers for update functionality
 */
export function registerUpdateHandlers(): void {
  /**
   * Handle manual update check request
   */
  ipcMain.handle("update:check", async () => {
    try {
      const updaterInstance = getAutoUpdaterInstance();
      if (!updaterInstance) {
        return { hasUpdate: false, error: "Auto-updater not available" };
      }

      const result =
        (await updaterInstance.runAutoUpdater()) as UpdateCheckResult | null;

      if (result?.updateInfo) {
        // Update is available
        const allWindows = BrowserWindow.getAllWindows();
        allWindows.forEach((window) => {
          if (window && !window.isDestroyed()) {
            window.webContents.send(
              "update:check-complete",
              true,
              result.updateInfo.version
            );
          }
        });
        return { hasUpdate: true, version: result.updateInfo.version };
      } else {
        // No update available
        const allWindows = BrowserWindow.getAllWindows();
        allWindows.forEach((window) => {
          if (window && !window.isDestroyed()) {
            window.webContents.send("update:check-complete", false);
          }
        });
        return { hasUpdate: false };
      }
    } catch (error) {
      logger.error("Error checking for updates:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Send error to renderer
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach((window) => {
        if (window && !window.isDestroyed()) {
          window.webContents.send("update:error", {
            message: errorMessage,
            type: "check",
            timestamp: new Date(),
          });
        }
      });

      return { hasUpdate: false, error: errorMessage };
    }
  });

  /**
   * Handle download update request
   */
  ipcMain.handle("update:download", async () => {
    try {
      const updaterInstance = getAutoUpdaterInstance();
      if (!updaterInstance) {
        throw new Error("Auto-updater not available");
      }

      const updater = updaterInstance.getAutoUpdater();

      // Check if update is already downloaded
      // Note: We check if update is available first, then download
      const checkResult =
        (await updaterInstance.runAutoUpdater()) as UpdateCheckResult | null;

      if (!checkResult?.updateInfo) {
        throw new Error("No update available to download");
      }

      // Start download
      updaterInstance.setDownloading(true);
      updater.downloadUpdate();

      return { success: true };
    } catch (error) {
      logger.error("Error downloading update:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Send error to renderer
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach((window) => {
        if (window && !window.isDestroyed()) {
          window.webContents.send("update:error", {
            message: errorMessage,
            type: "download",
            timestamp: new Date(),
          });
        }
      });

      throw error;
    }
  });

  /**
   * Handle install update request (Cursor-style: immediate quit + silent install)
   */
  ipcMain.handle("update:install", async () => {
    try {
      const updaterInstance = getAutoUpdaterInstance();
      if (!updaterInstance) {
        throw new Error("Auto-updater not available");
      }

      const updater = updaterInstance.getAutoUpdater();

      // Check if update is downloaded
      if (!updaterInstance.isUpdateDownloaded()) {
        throw new Error("Update not downloaded yet");
      }

      logger.info("Starting silent installation (Cursor-style)...");

      // Cursor-style: Immediate quit with silent install
      // quitAndInstall(isSilent, isForceRunAfter)
      // - isSilent = true: No installer UI shown
      // - isForceRunAfter = true: Auto-restart app after install
      updater.quitAndInstall(true, true);

      // Note: This will trigger app.quit() immediately
      // The installation happens after app closes
      return { success: true };
    } catch (error) {
      logger.error("Error installing update:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Send error to renderer
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach((window) => {
        if (window && !window.isDestroyed()) {
          window.webContents.send("update:error", {
            message: errorMessage,
            type: "install",
            timestamp: new Date(),
          });
        }
      });

      throw error;
    }
  });

  /**
   * Handle postpone update request
   */
  ipcMain.handle("update:postpone", async () => {
    try {
      const updaterInstance = getAutoUpdaterInstance();
      if (!updaterInstance) {
        return { success: false, error: "Auto-updater not available" };
      }

      // Get current update info if available
      const updateInfo = updaterInstance.getPendingUpdateInfo();

      if (updateInfo) {
        updaterInstance.postponeUpdate(updateInfo);
        return { success: true };
      }

      return { success: false, error: "No update to postpone" };
    } catch (error) {
      logger.error("Error postponing update:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * Handle dismiss error request
   */
  ipcMain.handle("update:dismiss-error", async () => {
    try {
      const updaterInstance = getAutoUpdaterInstance();
      if (updaterInstance) {
        updaterInstance.clearLastError();
      }
      return { success: true };
    } catch (error) {
      logger.error("Error dismissing update error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  logger.info("Update IPC handlers registered");
}
