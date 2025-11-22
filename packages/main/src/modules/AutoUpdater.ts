import { AppModule } from "../AppModule.js";
import electronUpdater, {
  type AppUpdater,
  type Logger,
  type UpdateInfo,
  type ProgressInfo,
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
  #isDownloading = false;
  #downloadStartTime: number | null = null;
  #lastError: { message: string; timestamp: Date; type: string } | null = null;

  readonly #REMIND_LATER_INTERVAL = 2 * 60 * 60 * 1000;
  readonly #MAX_POSTPONE_COUNT = 3;
  readonly #GITHUB_REPO_URL = "https://github.com/Sam231221/AuraSwift";
  readonly #GITHUB_RELEASES_URL = `${this.#GITHUB_REPO_URL}/releases`;
  #postponeCount = 0;
  #isCheckingForUpdates = false;
  #updateListeners: Array<{
    event: string;
    listener: (...args: any[]) => void;
  }> = [];
  #hasShownProgressNotification = false;

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

  /**
   * Enable the auto-updater module
   * Checks for updates on startup and schedules periodic checks
   */
  async enable(): Promise<void> {
    if (await this.handleSquirrelEvents()) {
      return;
    }

    await this.runAutoUpdater();
    this.schedulePeriodicChecks();
  }

  /**
   * Disable the auto-updater module
   * Cleans up intervals, timeouts, and event listeners
   */
  async disable(): Promise<void> {
    if (this.#updateCheckInterval) {
      clearInterval(this.#updateCheckInterval);
      this.#updateCheckInterval = null;
    }

    if (this.#remindLaterTimeout) {
      clearTimeout(this.#remindLaterTimeout);
      this.#remindLaterTimeout = null;
    }

    // Remove all event listeners
    const updater = this.getAutoUpdater();
    this.removeUpdateListeners(updater);
  }

  private async handleSquirrelEvents(): Promise<boolean> {
    if (process.platform !== "win32") {
      return false;
    }

    const squirrelCommand = process.argv[1];
    if (!squirrelCommand || !squirrelCommand.startsWith("--squirrel")) {
      return false;
    }

    const { spawn } = await import("node:child_process");
    const path = await import("node:path");

    const appFolder = path.dirname(process.execPath);
    const rootFolder = path.resolve(appFolder, "..");
    const updateExe = path.resolve(rootFolder, "Update.exe");
    const exeName = path.basename(process.execPath);

    const spawnUpdate = (args: string[]): Promise<void> => {
      return new Promise<void>((resolve) => {
        try {
          const child = spawn(updateExe, args, { detached: true });

          child.on("close", () => {
            resolve();
          });

          child.on("error", () => {
            resolve();
          });
        } catch {
          resolve();
        }
      });
    };

    try {
      switch (squirrelCommand) {
        case "--squirrel-install":
          await spawnUpdate(["--createShortcut", exeName]);
          break;
        case "--squirrel-updated":
          await spawnUpdate(["--createShortcut", exeName]);
          break;
        case "--squirrel-uninstall":
          await spawnUpdate(["--removeShortcut", exeName]);
          break;
        case "--squirrel-obsolete":
          break;
        default:
          return false;
      }

      app.quit();
      return true;
    } catch (error) {
      console.error("Unexpected error in Squirrel event handling:", error);
      app.quit();
      return true;
    }
  }

  private schedulePeriodicChecks(): void {
    const CHECK_INTERVAL = 4 * 60 * 60 * 1000;

    this.#updateCheckInterval = setInterval(() => {
      // Use runAutoUpdater to ensure proper state management and avoid race conditions
      this.runAutoUpdater().catch((error) => {
        const errorMessage = this.formatErrorMessage(error);
        if (this.#logger) {
          this.#logger.error(`Periodic update check failed: ${errorMessage}`);
        } else {
          console.error("Periodic update check failed:", error);
        }
      });
    }, CHECK_INTERVAL);
  }

  private scheduleReminder(updateInfo: UpdateInfo): void {
    if (this.#remindLaterTimeout) {
      clearTimeout(this.#remindLaterTimeout);
      this.#remindLaterTimeout = null;
    }

    this.#postponedUpdateInfo = updateInfo;
    this.#postponeCount++;

    this.#remindLaterTimeout = setTimeout(() => {
      this.showReminderNotification(updateInfo);
    }, this.#REMIND_LATER_INTERVAL);
  }

  private showReminderNotification(updateInfo: UpdateInfo): void {
    const newVersion = updateInfo.version;
    const hasReachedLimit = this.#postponeCount >= this.#MAX_POSTPONE_COUNT;

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
        this.showUpdateAvailableDialog(updateInfo, true);
      });

      notification.show();
    } else {
      this.showUpdateAvailableDialog(updateInfo, true);
    }
  }

  /**
   * Format error message from unknown error type
   * @param error - The error to format
   * @returns Formatted error message string
   */
  private formatErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Show dialog when an update is available
   * @param info - Update information from electron-updater
   * @param isReminder - Whether this is a reminder notification (default: false)
   */
  private showUpdateAvailableDialog(
    info: UpdateInfo,
    isReminder: boolean = false
  ): void {
    // Input validation
    if (!info || !info.version) {
      console.error(
        "Invalid update info provided to showUpdateAvailableDialog"
      );
      return;
    }

    const currentVersion = app.getVersion();
    const newVersion = info.version;
    const releaseNotes = this.formatReleaseNotes(info);
    const hasReachedLimit = this.#postponeCount >= this.#MAX_POSTPONE_COUNT;

    const buttons = hasReachedLimit
      ? ["Download Now", "View Release Notes"]
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
          this.#postponeCount = 0;
          this.#postponedUpdateInfo = null;
          this.#isDownloading = true;
          this.#downloadStartTime = Date.now();

          const updater = this.getAutoUpdater();
          updater.downloadUpdate();

          if (Notification.isSupported()) {
            const notification = new Notification({
              title: "Downloading Update",
              body: `AuraSwift ${newVersion} is downloading in the background...`,
              silent: false,
            });
            notification.show();
          }
        } else if (result.response === 1) {
          shell.openExternal(`${this.#GITHUB_RELEASES_URL}/tag/v${newVersion}`);

          setTimeout(() => {
            this.showUpdateAvailableDialog(info, isReminder);
          }, 1000);
        } else if (result.response === 2 && !hasReachedLimit) {
          this.scheduleReminder(info);

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
        const errorMessage = this.formatErrorMessage(error);
        if (this.#logger) {
          this.#logger.error(
            `Error showing update available dialog: ${errorMessage}`
          );
        } else {
          console.error("Error showing update available dialog:", error);
        }
      });
  }

  /**
   * Get the electron-updater AppUpdater instance
   * @returns The AppUpdater instance from electron-updater
   */
  getAutoUpdater(): AppUpdater {
    const { autoUpdater } = electronUpdater;
    return autoUpdater;
  }

  /**
   * Get the last update error if any occurred
   * @returns The last error object with message, timestamp, and type, or null if no error occurred
   */
  getLastError(): { message: string; timestamp: Date; type: string } | null {
    return this.#lastError;
  }

  /**
   * Show a dialog displaying the last update error with troubleshooting information
   * If no error exists, shows a message indicating no recent errors
   */
  showLastErrorDialog(): void {
    if (!this.#lastError) {
      dialog
        .showMessageBox({
          type: "info",
          title: "No Recent Errors",
          message: "No recent update errors",
          detail:
            "There are no recent update errors to display.\n\nIf you're experiencing issues, you can:\n• Check for updates from the Help menu\n• View release notes on GitHub\n• Check your internet connection",
          buttons: ["OK", "Check for Updates"],
        })
        .then((result) => {
          if (result.response === 1) {
            this.runAutoUpdater().catch((error) => {
              const errorMessage = this.formatErrorMessage(error);
              if (this.#logger) {
                this.#logger.error(
                  `Error checking for updates from error dialog: ${errorMessage}`
                );
              } else {
                console.error("Error checking for updates:", error);
              }
            });
          }
        });
      return;
    }

    const { message, timestamp, type } = this.#lastError;
    const timeAgo = this.formatTimeAgo(timestamp);

    const isDownloadError = type === "download";
    const title = isDownloadError
      ? "Update Download Failed"
      : "Update Check Issue";
    const mainMessage = isDownloadError
      ? "Failed to download the update"
      : "Unable to check for updates";

    const detail = isDownloadError
      ? `Last error occurred ${timeAgo}\n\n${message}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n⚠️ Possible causes:\n• Network connection interrupted during download\n• Download file was corrupted\n• Insufficient disk space\n• Firewall or antivirus blocking the download\n\n💡 What you can do:\n• Check your internet connection\n• Try downloading manually from GitHub\n• Ensure you have enough disk space\n• Temporarily disable antivirus/firewall\n• Try checking for updates again\n\nWould you like to download manually from GitHub?`
      : `Last error occurred ${timeAgo}\n\n${message}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nThis is not critical:\n• Your app will continue working normally\n• You can check manually later from Help menu\n• Automatic checks will retry periodically\n\nWould you like to view releases on GitHub?`;

    dialog
      .showMessageBox({
        type: isDownloadError ? "warning" : "info",
        title,
        message: mainMessage,
        detail,
        buttons: [
          "OK",
          isDownloadError ? "Download from GitHub" : "Open GitHub Releases",
          "Try Again",
        ],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      })
      .then((result) => {
        if (result.response === 1) {
          shell.openExternal(this.#GITHUB_RELEASES_URL);
        } else if (result.response === 2) {
          // Clear the error and try again
          this.#lastError = null;
          this.runAutoUpdater().catch((error) => {
            const errorMessage = this.formatErrorMessage(error);
            if (this.#logger) {
              this.#logger.error(
                `Error retrying update check: ${errorMessage}`
              );
            } else {
              console.error("Error retrying update check:", error);
            }
          });
        }
      })
      .catch((error) => {
        const errorMessage = this.formatErrorMessage(error);
        if (this.#logger) {
          this.#logger.error(
            `Error showing last error dialog: ${errorMessage}`
          );
        } else {
          console.error("Error showing last error dialog:", error);
        }
      });
  }

  /**
   * Format timestamp to human-readable "time ago" string
   */
  private formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  }

  /**
   * Run the auto-updater to check for available updates
   * Prevents race conditions by skipping if a check is already in progress
   * @returns Update check result or null if no update available or check skipped
   */
  async runAutoUpdater() {
    // Prevent race conditions: skip if already checking
    if (this.#isCheckingForUpdates) {
      if (this.#logger) {
        this.#logger.info("Update check already in progress, skipping...");
      }
      return null;
    }

    this.#isCheckingForUpdates = true;
    try {
      const updater = this.getAutoUpdater();
      updater.logger = this.#logger || null;
      updater.fullChangelog = true;
      updater.autoDownload = false;
      updater.autoInstallOnAppQuit = true;
      updater.allowDowngrade = false;
      updater.channel = "latest";
      this.setupUpdateListeners(updater);

      const result = await updater.checkForUpdates();

      if (result === null) {
        return null;
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;

        if (errorMessage.includes("No published versions")) {
          return null;
        }

        if (errorMessage.includes("Cannot find latest")) {
          return null;
        }

        if (
          errorMessage.includes("ENOTFOUND") ||
          errorMessage.includes("ETIMEDOUT") ||
          errorMessage.includes("ECONNREFUSED")
        ) {
          return null;
        }
      }

      throw error;
    } finally {
      this.#isCheckingForUpdates = false;
    }
  }

  private removeUpdateListeners(updater: AppUpdater): void {
    for (const { event, listener } of this.#updateListeners) {
      updater.off(event as any, listener);
    }
    this.#updateListeners = [];
  }

  private setupUpdateListeners(updater: AppUpdater): void {
    // Remove existing listeners first to prevent duplicates
    this.removeUpdateListeners(updater);

    const onUpdateAvailable = (info: UpdateInfo) => {
      if (
        this.#postponedUpdateInfo &&
        this.#postponedUpdateInfo.version === info.version
      ) {
        return;
      }
      this.showUpdateAvailableDialog(info, false);
    };
    updater.on("update-available", onUpdateAvailable);
    this.#updateListeners.push({
      event: "update-available",
      listener: onUpdateAvailable,
    });

    const onUpdateNotAvailable = () => {};
    updater.on("update-not-available", onUpdateNotAvailable);
    this.#updateListeners.push({
      event: "update-not-available",
      listener: onUpdateNotAvailable,
    });

    const onDownloadProgress = (progressInfo: ProgressInfo) => {
      // Log progress for debugging
      if (this.#logger) {
        this.#logger.info(
          `Download progress: ${progressInfo.percent.toFixed(2)}% (${
            progressInfo.transferred
          }/${progressInfo.total})`
        );
      }

      // Show a notification at 50% completion (only once)
      if (
        !this.#hasShownProgressNotification &&
        progressInfo.percent > 50 &&
        progressInfo.percent < 55 &&
        Notification.isSupported()
      ) {
        this.#hasShownProgressNotification = true;
        const notification = new Notification({
          title: "Download In Progress",
          body: `Update download is ${progressInfo.percent.toFixed(
            0
          )}% complete...`,
          silent: true,
        });
        notification.show();
      }
    };
    updater.on("download-progress", onDownloadProgress);
    this.#updateListeners.push({
      event: "download-progress",
      listener: onDownloadProgress,
    });

    const onUpdateDownloaded = (info: UpdateInfo) => {
      this.#isDownloading = false;
      this.#hasShownProgressNotification = false; // Reset for next download
      const downloadDuration = this.#downloadStartTime
        ? ((Date.now() - this.#downloadStartTime) / 1000).toFixed(0)
        : "unknown";
      this.#downloadStartTime = null;

      if (this.#logger) {
        this.#logger.info(
          `Update downloaded successfully in ${downloadDuration}s`
        );
      }
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
            updater.quitAndInstall(false, true);
          } else {
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
          const errorMessage = this.formatErrorMessage(error);
          if (this.#logger) {
            this.#logger.error(
              `Error showing update ready dialog: ${errorMessage}`
            );
          } else {
            console.error("Error showing update ready dialog:", error);
          }
        });
    };
    updater.on("update-downloaded", onUpdateDownloaded);
    this.#updateListeners.push({
      event: "update-downloaded",
      listener: onUpdateDownloaded,
    });

    const onError = (error: Error) => {
      const errorMessage = error.message || String(error);

      // Reset download state on error
      const wasDownloading = this.#isDownloading;
      this.#isDownloading = false;
      this.#hasShownProgressNotification = false; // Reset notification flag
      this.#downloadStartTime = null;

      // Check if this is a download error
      const isDownloadError =
        wasDownloading ||
        errorMessage.includes("download") ||
        errorMessage.includes("Downloaded file") ||
        errorMessage.includes("sha512") ||
        errorMessage.includes("checksum") ||
        errorMessage.includes("verification failed") ||
        errorMessage.toLowerCase().includes("corrupt");

      // Store the error for later viewing
      this.#lastError = {
        message: errorMessage,
        timestamp: new Date(),
        type: isDownloadError ? "download" : "check",
      };

      if (this.#logger) {
        this.#logger.error(
          `Update error (${this.#lastError.type}): ${errorMessage}`
        );
      }

      const shouldSkipDialog =
        errorMessage.includes("No published versions") ||
        errorMessage.includes("Cannot find latest") ||
        errorMessage.includes("No updates available") ||
        errorMessage.includes("net::ERR_INTERNET_DISCONNECTED") ||
        process.env.NODE_ENV !== "production";

      if (!shouldSkipDialog) {
        const isNetworkError =
          errorMessage.includes("ENOTFOUND") ||
          errorMessage.includes("ETIMEDOUT") ||
          errorMessage.includes("ECONNREFUSED") ||
          errorMessage.includes("Network Error");

        if (isNetworkError && !isDownloadError) {
          // For network check errors, show a persistent notification instead of dialog
          if (Notification.isSupported()) {
            const notification = new Notification({
              title: "Update Check Failed",
              body: "Couldn't check for updates. Click to view details or check Help menu.",
              silent: false,
              urgency: "low",
              timeoutType: "never", // Keep notification visible
            });

            notification.on("click", () => {
              this.showLastErrorDialog();
            });

            notification.show();
          }
          return;
        }

        // Show different dialog based on error type
        const title = isDownloadError
          ? "Update Download Failed"
          : "Update Check Issue";
        const message = isDownloadError
          ? "Failed to download the update"
          : "Unable to check for updates at this time";

        const detail = isDownloadError
          ? `The update download encountered an issue:\n\n${errorMessage}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n⚠️ Possible causes:\n• Network connection interrupted during download\n• Download file was corrupted\n• Insufficient disk space\n• Firewall or antivirus blocking the download\n\n💡 What you can do:\n• Check your internet connection\n• Try downloading manually from GitHub\n• Ensure you have enough disk space\n• Temporarily disable antivirus/firewall\n• View this error later from Help → View Update Error\n• The app will retry on next launch\n\nWould you like to download manually from GitHub?`
          : `The update check encountered an issue:\n\n${errorMessage}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nThis is not critical:\n• Your app will continue working normally\n• You can check manually later from Help menu\n• View this error later from Help → View Update Error\n• Automatic checks will retry in 4 hours\n\nWould you like to view releases on GitHub?`;

        // Show the dialog
        dialog
          .showMessageBox({
            type: isDownloadError ? "warning" : "info",
            title,
            message,
            detail,
            buttons: [
              "OK",
              isDownloadError ? "Download from GitHub" : "Open GitHub Releases",
            ],
            defaultId: 0,
            cancelId: 0,
            noLink: true,
          })
          .then((result) => {
            if (result.response === 1) {
              shell.openExternal(this.#GITHUB_RELEASES_URL);
            }
          })
          .catch((error) => {
            const errorMessage = this.formatErrorMessage(error);
            if (this.#logger) {
              this.#logger.error(`Error showing error dialog: ${errorMessage}`);
            } else {
              console.error("Error showing error dialog:", error);
            }
          });

        // Also show a persistent notification for download errors
        if (isDownloadError && Notification.isSupported()) {
          const errorNotification = new Notification({
            title: "⚠️ Update Download Failed",
            body: "Click here to view error details and solutions, or check Help → View Update Error",
            silent: false,
            urgency: "critical",
            timeoutType: "never", // Keep notification visible until clicked
          });

          errorNotification.on("click", () => {
            this.showLastErrorDialog();
          });

          // Show notification after a brief delay so it doesn't conflict with dialog
          setTimeout(() => {
            errorNotification.show();
          }, 500);
        }
      }
    };
    updater.on("error", onError);
    this.#updateListeners.push({ event: "error", listener: onError });
  }

  private formatReleaseNotes(info: UpdateInfo): string {
    if (!info.releaseNotes) {
      return "• See full release notes on GitHub";
    }

    if (typeof info.releaseNotes === "string") {
      let notes = info.releaseNotes;

      notes = notes
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");

      notes = notes.replace(/<[^>]*>/gs, "");

      notes = notes
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const lines = notes
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => {
          return (
            line &&
            line.length > 3 &&
            !line.startsWith("#") &&
            !line.match(/^[-=_*]{3,}$/) &&
            !line.toLowerCase().includes("what's changed") &&
            !line.toLowerCase().includes("full changelog")
          );
        })
        .slice(0, 15);

      const formattedLines = lines.map((line) => {
        if (line.match(/^[•\-*✨🐛⚡🔥📦🎨♻️⬆️⬇️]/)) {
          return line;
        }
        return `• ${line}`;
      });

      const result = formattedLines.join("\n");

      if (result.length > 500) {
        return (
          result.substring(0, 500) + "\n\n... see full release notes on GitHub"
        );
      }

      return result || "• See full release notes on GitHub";
    }

    if (Array.isArray(info.releaseNotes)) {
      const formatted = info.releaseNotes
        .slice(0, 15)
        .map((note: string | { note: string | null }) => {
          let text: string;
          if (typeof note === "string") {
            text = note;
          } else if (note && typeof note === "object" && "note" in note) {
            text = note.note || "";
          } else {
            text = String(note);
          }

          text = text
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/<[^>]*>/gs, "")
            .trim();

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
