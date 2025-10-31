import { AppModule } from "../AppModule.js";
import electronUpdater, {
  type AppUpdater,
  type Logger,
  type UpdateInfo,
} from "electron-updater";
import { app, dialog, Notification, shell } from "electron";
import { spawn } from "child_process";
import { resolve, basename, join } from "path";

type DownloadNotification = Parameters<
  AppUpdater["checkForUpdatesAndNotify"]
>[0];

export class AutoUpdater implements AppModule {
  readonly #logger: Logger | null;
  readonly #notification: DownloadNotification;
  #updateCheckInterval: NodeJS.Timeout | null = null;

  constructor({
    logger = null,
    downloadNotification = undefined,
  }: {
    logger?: Logger | null | undefined;
    downloadNotification?: DownloadNotification;
  } = {}) {
    this.#logger = logger;
    this.#notification = downloadNotification;
  }

  async enable(): Promise<void> {
    // Handle Squirrel.Windows events first (for auto-updates)
    if (this.handleSquirrelEvents()) {
      return; // If Squirrel event handled, exit early
    }

    await this.runAutoUpdater();
    this.schedulePeriodicChecks();
  }

  /**
   * Handle Squirrel.Windows installation events
   * Returns true if a Squirrel event was handled (app should quit)
   */
  private handleSquirrelEvents(): boolean {
    if (process.platform !== "win32") {
      return false;
    }

    // Squirrel events are passed via command line arguments
    if (process.argv.length === 1) {
      return false;
    }

    const appFolder = resolve(process.execPath, "..");
    const rootAtomFolder = resolve(appFolder, "..");
    const updateExe = resolve(join(rootAtomFolder, "Update.exe"));
    const exeName = basename(process.execPath);

    const squirrelEvent = process.argv[1];

    switch (squirrelEvent) {
      case "--squirrel-install":
      case "--squirrel-updated":
        console.log("🔧 Squirrel: Creating shortcuts...");
        // Create desktop and start menu shortcuts
        spawn(updateExe, ["--createShortcut", exeName], { detached: true });
        setTimeout(() => {
          app.quit();
        }, 1000);
        return true;

      case "--squirrel-uninstall":
        console.log("🗑️ Squirrel: Removing shortcuts...");
        // Remove desktop and start menu shortcuts
        spawn(updateExe, ["--removeShortcut", exeName], { detached: true });
        setTimeout(() => {
          app.quit();
        }, 1000);
        return true;

      case "--squirrel-obsolete":
        console.log("🔄 Squirrel: Obsolete version, quitting...");
        // This version is being replaced, quit immediately
        app.quit();
        return true;

      case "--squirrel-firstrun":
        console.log("🎉 Squirrel: First run after installation");
        // Optional: Show welcome screen or onboarding
        return false; // Don't quit, continue with normal startup
    }

    return false;
  }

  async disable(): Promise<void> {
    if (this.#updateCheckInterval) {
      clearInterval(this.#updateCheckInterval);
      this.#updateCheckInterval = null;
      console.log("⏹️ Stopped periodic update checks");
    }
  }

  private schedulePeriodicChecks(): void {
    // Check for updates every 4 hours (best practice)
    const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

    this.#updateCheckInterval = setInterval(() => {
      console.log("🔄 Performing periodic update check...");
      const updater = this.getAutoUpdater();
      updater.checkForUpdates().catch((error) => {
        // Silent fail for periodic checks (don't bother user)
        console.error("Periodic update check failed:", error);
      });
    }, CHECK_INTERVAL);

    console.log("✅ Scheduled periodic update checks (every 4 hours)");
  }

  getAutoUpdater(): AppUpdater {
    // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
    // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
    const { autoUpdater } = electronUpdater;
    return autoUpdater;
  }

  async runAutoUpdater() {
    const updater = this.getAutoUpdater();
    try {
      updater.logger = this.#logger || null;
      updater.fullChangelog = true;
      updater.autoDownload = false; // Don't auto-download, let user confirm first
      updater.autoInstallOnAppQuit = true; // Install update when app quits naturally

      // Allow downgrade for testing (disable in production if needed)
      updater.allowDowngrade = false;

      // Explicitly set channel to 'latest' to match electron-builder config
      updater.channel = "latest";

      // Set up event listeners for update flow
      this.setupUpdateListeners(updater);

      // Check for updates (initial check on startup)
      console.log("🔍 Checking for updates on startup...");
      const result = await updater.checkForUpdates();

      if (result === null) {
        console.log(
          "ℹ️ No update check result - likely already on latest version"
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;

        // These are expected situations, not real errors
        if (errorMessage.includes("No published versions")) {
          console.log(
            "ℹ️ No published versions found on GitHub - this is expected during development"
          );
          return null;
        }

        if (errorMessage.includes("Cannot find latest")) {
          console.log(
            "ℹ️ No newer version available - you're already on the latest version"
          );
          return null;
        }

        if (
          errorMessage.includes("ENOTFOUND") ||
          errorMessage.includes("ETIMEDOUT") ||
          errorMessage.includes("ECONNREFUSED")
        ) {
          console.log(
            "⚠️ Network error while checking for updates - will retry during periodic checks"
          );
          return null;
        }
      }

      // Re-throw other unexpected errors
      console.error("❌ Unexpected error in auto-updater:", error);
      throw error;
    }
  }

  private setupUpdateListeners(updater: AppUpdater): void {
    // When update is available
    updater.on("update-available", (info: UpdateInfo) => {
      console.log("✨ Update available:", info.version);

      const currentVersion = app.getVersion();
      const newVersion = info.version;
      const releaseNotes = this.formatReleaseNotes(info);

      dialog
        .showMessageBox({
          type: "info",
          title: "Update Available",
          message: `A new version of AuraSwift is available!`,
          detail: `Current version: ${currentVersion}\nNew version: ${newVersion}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nWhat's New:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${releaseNotes}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nWould you like to download this update now?\nThe download will happen in the background.`,
          buttons: ["Download Now", "View Release Notes", "Remind Me Later"],
          defaultId: 0,
          cancelId: 2,
          noLink: true,
        })
        .then((result) => {
          if (result.response === 0) {
            // Download Update
            console.log("📥 User initiated download for version", newVersion);
            updater.downloadUpdate();

            // Show notification that download started
            if (Notification.isSupported()) {
              const notification = new Notification({
                title: "Downloading Update",
                body: `AuraSwift ${newVersion} is downloading in the background...`,
                silent: false,
              });
              notification.show();
            }
          } else if (result.response === 1) {
            // View Release Notes
            console.log("👁️ Opening release notes for version", newVersion);
            shell.openExternal(
              `https://github.com/Sam231221/AuraSwift/releases/tag/v${newVersion}`
            );
          } else {
            console.log("⏰ User chose to be reminded later");
          }
        })
        .catch((error) => {
          console.error("Error showing update dialog:", error);
        });
    });

    // When update is not available
    updater.on("update-not-available", (info: UpdateInfo) => {
      console.log("✅ You're up to date! Current version:", info.version);
    });

    // Download progress
    updater.on("download-progress", (progressInfo) => {
      const percent = Math.round(progressInfo.percent);
      const transferredMB = (progressInfo.transferred / 1024 / 1024).toFixed(2);
      const totalMB = (progressInfo.total / 1024 / 1024).toFixed(2);
      const speedMBps = (progressInfo.bytesPerSecond / 1024 / 1024).toFixed(2);

      console.log(
        `📊 Download progress: ${percent}% | ${transferredMB}MB / ${totalMB}MB | Speed: ${speedMBps} MB/s`
      );
    });

    // When update is downloaded and ready to install
    updater.on("update-downloaded", (info: UpdateInfo) => {
      console.log("✅ Update downloaded successfully:", info.version);

      const newVersion = info.version;
      const releaseNotes = this.formatReleaseNotes(info);

      dialog
        .showMessageBox({
          type: "info",
          title: "Update Ready",
          message: `AuraSwift ${newVersion} is ready to install!`,
          detail: `The new version has been downloaded successfully.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nWhat's New:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${releaseNotes}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nThe update will be installed when you restart AuraSwift.\n\nWould you like to restart and install now?`,
          buttons: ["Restart Now", "Install on Next Restart"],
          defaultId: 0,
          cancelId: 1,
          noLink: true,
        })
        .then((result) => {
          if (result.response === 0) {
            // Restart and install update
            console.log("🔄 Restarting to install update...");
            // false = don't force close, true = restart after quit
            updater.quitAndInstall(false, true);
          } else {
            console.log("⏰ Update will be installed on next restart");
            // Show notification as reminder
            if (Notification.isSupported()) {
              const notification = new Notification({
                title: "Update Pending",
                body: `AuraSwift ${newVersion} will be installed when you next restart the app.`,
                silent: true,
              });
              notification.show();
            }
          }
        })
        .catch((error) => {
          console.error("Error showing update ready dialog:", error);
        });
    });

    // Error handling
    updater.on("error", (error) => {
      console.error("❌ Auto-updater error:", error);

      // Don't show error dialog for these common non-error cases:
      const errorMessage = error.message || String(error);
      const shouldSkipDialog =
        errorMessage.includes("No published versions") ||
        errorMessage.includes("Cannot find latest") ||
        errorMessage.includes("No updates available") ||
        errorMessage.includes("net::ERR_INTERNET_DISCONNECTED") ||
        !import.meta.env.PROD;

      if (!shouldSkipDialog) {
        // Check if it's a network-related error (non-critical)
        const isNetworkError =
          errorMessage.includes("ENOTFOUND") ||
          errorMessage.includes("ETIMEDOUT") ||
          errorMessage.includes("ECONNREFUSED") ||
          errorMessage.includes("Network Error");

        if (isNetworkError) {
          // Network errors are common and expected - just log them
          console.log(
            "⚠️ Network error during update check - will retry later:",
            errorMessage
          );
          return;
        }

        // Only show dialog for unexpected errors
        dialog
          .showMessageBox({
            type: "info",
            title: "Update Check Issue",
            message: "Unable to check for updates at this time",
            detail: `The update check encountered an issue:\n\n${errorMessage}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nThis is not critical:\n• Your app will continue working normally\n• You can check manually later from Help menu\n• Automatic checks will retry in 4 hours\n\nWould you like to view releases on GitHub?`,
            buttons: ["OK", "Open GitHub Releases"],
            defaultId: 0,
            cancelId: 0,
            noLink: true,
          })
          .then((result) => {
            if (result.response === 1) {
              shell.openExternal(
                "https://github.com/Sam231221/AuraSwift/releases"
              );
            }
          });
      }
    });
  }

  private formatReleaseNotes(info: UpdateInfo): string {
    if (!info.releaseNotes) {
      return "• See full release notes on GitHub";
    }

    // If releaseNotes is a string
    if (typeof info.releaseNotes === "string") {
      let notes = info.releaseNotes;

      // Step 1: Decode HTML entities first (e.g., &lt; &gt; &amp; &quot;)
      notes = notes
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");

      // Step 2: Remove all HTML tags (including multiline tags)
      notes = notes.replace(/<[^>]*>/gs, "");

      // Step 3: Clean up extra whitespace and normalize line breaks
      notes = notes
        .replace(/\r\n/g, "\n") // Normalize line endings
        .replace(/\n{3,}/g, "\n\n") // Max 2 consecutive newlines
        .trim();

      // Step 4: Extract meaningful lines
      const lines = notes
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => {
          // Skip empty lines, markdown headers, and separator lines
          return (
            line &&
            line.length > 3 &&
            !line.startsWith("#") &&
            !line.match(/^[-=_*]{3,}$/) &&
            !line.toLowerCase().includes("what's changed") &&
            !line.toLowerCase().includes("full changelog")
          );
        })
        .slice(0, 15); // Show up to 15 meaningful lines

      // Step 5: Format as bullet points
      const formattedLines = lines.map((line) => {
        // If line already has a bullet, emoji, or markdown list marker, keep it
        if (line.match(/^[•\-*✨🐛⚡🔥📦🎨♻️⬆️⬇️]/)) {
          return line;
        }
        // Otherwise add a bullet
        return `• ${line}`;
      });

      const result = formattedLines.join("\n");

      // Step 6: Truncate if too long
      if (result.length > 500) {
        return (
          result.substring(0, 500) + "\n\n... see full release notes on GitHub"
        );
      }

      return result || "• See full release notes on GitHub";
    }

    // If releaseNotes is an array
    if (Array.isArray(info.releaseNotes)) {
      const formatted = info.releaseNotes
        .slice(0, 15)
        .map((note: any) => {
          let text = note.note || note;

          // Clean HTML from array items too
          if (typeof text === "string") {
            text = text
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&amp;/g, "&")
              .replace(/<[^>]*>/gs, "")
              .trim();
          }

          // Add bullet if not present
          return text.match(/^[•\-*✨🐛⚡🔥]/) ? text : `• ${text}`;
        })
        .join("\n");

      return formatted || "• See full release notes on GitHub";
    }

    return "• See full release notes on GitHub";
  }
}

export function autoUpdater(
  ...args: ConstructorParameters<typeof AutoUpdater>
) {
  return new AutoUpdater(...args);
}
