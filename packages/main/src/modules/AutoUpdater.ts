import { AppModule } from "../AppModule.js";
import electronUpdater, {
  type AppUpdater,
  type Logger,
  type UpdateInfo,
} from "electron-updater";
import { app, dialog, Notification, shell } from "electron";

type DownloadNotification = Parameters<
  AppUpdater["checkForUpdatesAndNotify"]
>[0];

export class AutoUpdater implements AppModule {
  readonly #logger: Logger | null;
  readonly #notification: DownloadNotification;
  #updateCheckInterval: NodeJS.Timeout | null = null;
  #postponedUpdateInfo: UpdateInfo | null = null;
  #remindLaterTimeout: NodeJS.Timeout | null = null;

  // Configurable reminder intervals (in milliseconds)
  readonly #REMIND_LATER_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours (best practice)
  readonly #MAX_POSTPONE_COUNT = 3; // Maximum times user can postpone before forcing notification
  #postponeCount = 0;

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
    // Handle Squirrel events FIRST (Windows only)
    // This must run before any other app logic
    if (await this.handleSquirrelEvents()) {
      return; // Exit if Squirrel event was handled
    }

    await this.runAutoUpdater();
    this.schedulePeriodicChecks();
  }

  async disable(): Promise<void> {
    if (this.#updateCheckInterval) {
      clearInterval(this.#updateCheckInterval);
      this.#updateCheckInterval = null;
      console.log("⏹️ Stopped periodic update checks");
    }

    if (this.#remindLaterTimeout) {
      clearTimeout(this.#remindLaterTimeout);
      this.#remindLaterTimeout = null;
      console.log("⏹️ Cleared reminder timeout");
    }
  }

  /**
   * Handle Squirrel.Windows installation events
   * Must be called at app startup before any other logic
   * Returns true if a Squirrel event was handled (app should quit)
   */
  private async handleSquirrelEvents(): Promise<boolean> {
    // Only handle on Windows
    if (process.platform !== "win32") {
      return false;
    }

    // Check if running from Squirrel installer
    const squirrelCommand = process.argv[1];
    if (!squirrelCommand || !squirrelCommand.startsWith("--squirrel")) {
      return false;
    }

    console.log("🔧 Handling Squirrel event:", squirrelCommand);

    // Dynamically import modules to avoid loading them unnecessarily
    const { spawn } = await import("node:child_process");
    const path = await import("node:path");

    // Get paths for Update.exe
    const appFolder = path.dirname(process.execPath);
    const rootFolder = path.resolve(appFolder, "..");
    const updateExe = path.resolve(rootFolder, "Update.exe");
    const exeName = path.basename(process.execPath);

    // Helper to spawn Update.exe commands
    const spawnUpdate = (args: string[]): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        try {
          console.log(`  Running: ${updateExe} ${args.join(" ")}`);
          const child = spawn(updateExe, args, { detached: true });

          child.on("close", (code) => {
            if (code === 0) {
              console.log("  ✅ Squirrel command completed successfully");
              resolve();
            } else {
              console.log(`  ⚠️ Squirrel command exited with code ${code}`);
              resolve(); // Don't reject, just log
            }
          });

          child.on("error", (error) => {
            console.error("  ❌ Squirrel command error:", error);
            resolve(); // Don't reject, just log
          });
        } catch (error) {
          console.error("  ❌ Failed to spawn Update.exe:", error);
          resolve(); // Don't reject, just log
        }
      });
    };

    try {
      switch (squirrelCommand) {
        case "--squirrel-install":
          console.log("📦 Installing: Creating shortcuts...");
          await spawnUpdate(["--createShortcut", exeName]);
          break;

        case "--squirrel-updated":
          console.log("🔄 Updated: Creating shortcuts...");
          await spawnUpdate(["--createShortcut", exeName]);
          break;

        case "--squirrel-uninstall":
          console.log("🗑️ Uninstalling: Removing shortcuts...");
          await spawnUpdate(["--removeShortcut", exeName]);
          break;

        case "--squirrel-obsolete":
          console.log("📴 Obsolete: Old version shutting down...");
          break;

        default:
          console.log("⚠️ Unknown Squirrel event:", squirrelCommand);
          return false;
      }

      // All Squirrel events require the app to quit
      console.log("👋 Quitting app after Squirrel event");
      app.quit();
      return true;
    } catch (error) {
      console.error("❌ Error handling Squirrel event:", error);
      app.quit();
      return true;
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

  /**
   * Schedule a reminder notification for postponed updates
   * Implements exponential backoff with max postpone limit
   */
  private scheduleReminder(updateInfo: UpdateInfo): void {
    // Clear any existing reminder timeout
    if (this.#remindLaterTimeout) {
      clearTimeout(this.#remindLaterTimeout);
      this.#remindLaterTimeout = null;
    }

    // Store the update info for later reference
    this.#postponedUpdateInfo = updateInfo;
    this.#postponeCount++;

    const hours = this.#REMIND_LATER_INTERVAL / (60 * 60 * 1000);
    console.log(
      `⏰ Reminder scheduled in ${hours} hours (postpone count: ${
        this.#postponeCount
      }/${this.#MAX_POSTPONE_COUNT})`
    );

    // Schedule the reminder
    this.#remindLaterTimeout = setTimeout(() => {
      this.showReminderNotification(updateInfo);
    }, this.#REMIND_LATER_INTERVAL);
  }

  /**
   * Show reminder notification for postponed updates
   * Uses native notifications for less intrusive UX
   */
  private showReminderNotification(updateInfo: UpdateInfo): void {
    const newVersion = updateInfo.version;
    const hasReachedLimit = this.#postponeCount >= this.#MAX_POSTPONE_COUNT;

    console.log(
      `🔔 Showing reminder for version ${newVersion} (attempt ${
        this.#postponeCount
      }/${this.#MAX_POSTPONE_COUNT})`
    );

    if (Notification.isSupported()) {
      const title = hasReachedLimit
        ? "Important: Update Available"
        : "Update Reminder";
      const body = hasReachedLimit
        ? `AuraSwift ${newVersion} is ready. Please update to continue receiving updates.`
        : `AuraSwift ${newVersion} is available. Click to download.`;

      const notification = new Notification({
        title,
        body,
        urgency: hasReachedLimit ? "critical" : "normal",
        silent: false,
      });

      notification.on("click", () => {
        console.log("🖱️ User clicked reminder notification");
        this.showUpdateAvailableDialog(updateInfo, true);
      });

      notification.show();
    } else {
      // Fallback to dialog if notifications not supported
      this.showUpdateAvailableDialog(updateInfo, true);
    }
  }

  /**
   * Show update available dialog
   * Centralized dialog logic for initial notification and reminders
   */
  private showUpdateAvailableDialog(
    info: UpdateInfo,
    isReminder: boolean = false
  ): void {
    const currentVersion = app.getVersion();
    const newVersion = info.version;
    const releaseNotes = this.formatReleaseNotes(info);
    const hasReachedLimit = this.#postponeCount >= this.#MAX_POSTPONE_COUNT;

    const buttons = hasReachedLimit
      ? ["Download Now", "View Release Notes"] // No more "Remind Later" after limit
      : ["Download Now", "View Release Notes", "Remind Me Later"];

    const reminderText = isReminder
      ? `\n\n⏰ This is a reminder about the available update.\n${
          hasReachedLimit
            ? "⚠️ You've postponed this update multiple times. Please consider updating soon."
            : `You can postpone ${
                this.#MAX_POSTPONE_COUNT - this.#postponeCount
              } more time(s).`
        }`
      : "";

    dialog
      .showMessageBox({
        type: hasReachedLimit ? "warning" : "info",
        title: isReminder ? "Update Reminder" : "Update Available",
        message: `A new version of AuraSwift is available!`,
        detail: `Current version: ${currentVersion}\nNew version: ${newVersion}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nWhat's New:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${releaseNotes}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reminderText}\n\nWould you like to download this update now?\n(The download will happen in the background.)`,
        buttons,
        defaultId: 0,
        cancelId: buttons.length - 1,
        noLink: true,
      })
      .then((result) => {
        if (result.response === 0) {
          // Download Update
          console.log("📥 User initiated download for version", newVersion);
          this.#postponeCount = 0; // Reset postpone count
          this.#postponedUpdateInfo = null;

          const updater = this.getAutoUpdater();
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

          // Re-show dialog after viewing release notes (non-blocking)
          setTimeout(() => {
            this.showUpdateAvailableDialog(info, isReminder);
          }, 1000);
        } else if (result.response === 2 && !hasReachedLimit) {
          // Remind Me Later (only available if limit not reached)
          console.log(
            `⏰ User chose to be reminded later (${this.#postponeCount}/${
              this.#MAX_POSTPONE_COUNT
            })`
          );
          this.scheduleReminder(info);

          // Show confirmation notification
          if (Notification.isSupported()) {
            const hours = this.#REMIND_LATER_INTERVAL / (60 * 60 * 1000);
            const notification = new Notification({
              title: "Reminder Set",
              body: `We'll remind you about AuraSwift ${newVersion} in ${hours} hours.`,
              silent: true,
            });
            notification.show();
          }
        }
      })
      .catch((error) => {
        console.error("Error showing update dialog:", error);
      });
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

      // Check if this is the same update we already postponed
      if (
        this.#postponedUpdateInfo &&
        this.#postponedUpdateInfo.version === info.version
      ) {
        console.log(
          "ℹ️ Update already postponed, skipping duplicate notification"
        );
        return;
      }

      // Show update dialog (initial notification)
      this.showUpdateAvailableDialog(info, false);
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

      // Clear any pending reminders since update is now downloaded
      if (this.#remindLaterTimeout) {
        clearTimeout(this.#remindLaterTimeout);
        this.#remindLaterTimeout = null;
      }
      this.#postponedUpdateInfo = null;
      this.#postponeCount = 0;

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
