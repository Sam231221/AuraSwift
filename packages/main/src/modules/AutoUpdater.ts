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

  readonly #REMIND_LATER_INTERVAL = 2 * 60 * 60 * 1000;
  readonly #MAX_POSTPONE_COUNT = 3;
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
    if (await this.handleSquirrelEvents()) {
      return;
    }

    await this.runAutoUpdater();
    this.schedulePeriodicChecks();
  }

  async disable(): Promise<void> {
    if (this.#updateCheckInterval) {
      clearInterval(this.#updateCheckInterval);
      this.#updateCheckInterval = null;
    }

    if (this.#remindLaterTimeout) {
      clearTimeout(this.#remindLaterTimeout);
      this.#remindLaterTimeout = null;
    }
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
    } catch {
      app.quit();
      return true;
    }
  }

  private schedulePeriodicChecks(): void {
    const CHECK_INTERVAL = 4 * 60 * 60 * 1000;

    this.#updateCheckInterval = setInterval(() => {
      const updater = this.getAutoUpdater();
      updater.checkForUpdates().catch(() => {});
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

  private showUpdateAvailableDialog(
    info: UpdateInfo,
    isReminder: boolean = false
  ): void {
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
          shell.openExternal(
            `https://github.com/Sam231221/AuraSwift/releases/tag/v${newVersion}`
          );

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
      .catch(() => {});
  }

  getAutoUpdater(): AppUpdater {
    const { autoUpdater } = electronUpdater;
    return autoUpdater;
  }

  async runAutoUpdater() {
    const updater = this.getAutoUpdater();
    try {
      updater.logger = this.#logger || null;
      updater.fullChangelog = true;
      updater.autoDownload = false;
      updater.autoInstallOnAppQuit = true;
      updater.allowDowngrade = false;
      updater.channel = "latest";
      this.setupUpdateListeners(updater);

      const result = await updater.checkForUpdates();

      if (result === null) {
        return;
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
    }
  }

  private setupUpdateListeners(updater: AppUpdater): void {
    updater.on("update-available", (info: UpdateInfo) => {
      if (
        this.#postponedUpdateInfo &&
        this.#postponedUpdateInfo.version === info.version
      ) {
        return;
      }
      this.showUpdateAvailableDialog(info, false);
    });

    updater.on("update-not-available", () => {});

    updater.on("download-progress", () => {});

    updater.on("update-downloaded", (info: UpdateInfo) => {
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
        .catch(() => {});
    });

    updater.on("error", (error) => {
      const errorMessage = error.message || String(error);
      const shouldSkipDialog =
        errorMessage.includes("No published versions") ||
        errorMessage.includes("Cannot find latest") ||
        errorMessage.includes("No updates available") ||
        errorMessage.includes("net::ERR_INTERNET_DISCONNECTED") ||
        !import.meta.env.PROD;

      if (!shouldSkipDialog) {
        const isNetworkError =
          errorMessage.includes("ENOTFOUND") ||
          errorMessage.includes("ETIMEDOUT") ||
          errorMessage.includes("ECONNREFUSED") ||
          errorMessage.includes("Network Error");

        if (isNetworkError) {
          return;
        }

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
        .map((note: any) => {
          let text = note.note || note;

          if (typeof text === "string") {
            text = text
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&amp;/g, "&")
              .replace(/<[^>]*>/gs, "")
              .trim();
          }

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
