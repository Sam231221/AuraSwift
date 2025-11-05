import type { AppModule } from "../AppModule.js";
import { ModuleContext } from "../ModuleContext.js";
import { BrowserWindow, Menu, shell, app as electronApp } from "electron";
import type { AppInitConfig } from "../AppInitConfig.js";
import { join } from "node:path";

class WindowManager implements AppModule {
  readonly #preload: { path: string };
  readonly #renderer: { path: string } | URL;
  readonly #openDevTools;

  constructor({
    initConfig,
    openDevTools = false,
  }: {
    initConfig: AppInitConfig;
    openDevTools?: boolean;
  }) {
    this.#preload = initConfig.preload;
    this.#renderer = initConfig.renderer;
    this.#openDevTools = openDevTools;
  }

  async enable({ app }: ModuleContext): Promise<void> {
    await app.whenReady();

    // Create minimal application menu with update checking
    this.createApplicationMenu();

    await this.restoreOrCreateWindow(true);
    app.on("second-instance", () => this.restoreOrCreateWindow(true));
    app.on("activate", () => this.restoreOrCreateWindow(true));
  }

  private createApplicationMenu(): void {
    const isMac = process.platform === "darwin";

    const template: Electron.MenuItemConstructorOptions[] = [
      // App menu (macOS only)
      ...(isMac
        ? [
            {
              label: electronApp.name,
              submenu: [
                { role: "about" as const },
                { type: "separator" as const },
                { role: "hide" as const },
                { role: "hideOthers" as const },
                { role: "unhide" as const },
                { type: "separator" as const },
                { role: "quit" as const },
              ],
            },
          ]
        : []),

      // Help menu with update checker
      {
        label: "Help",
        submenu: [
          {
            label: "Check for Updates...",
            click: async () => {
              // Dynamically import to avoid circular dependencies
              const { autoUpdater } = await import("electron-updater");
              const { dialog } = await import("electron");

              try {
                // Set channel explicitly
                autoUpdater.channel = "latest";

                const result = await autoUpdater.checkForUpdates();

                // If no update found, show confirmation
                if (
                  result?.updateInfo &&
                  result.updateInfo.version === electronApp.getVersion()
                ) {
                  dialog.showMessageBox({
                    type: "info",
                    title: "You're Up to Date ✅",
                    message: "AuraSwift is up to date!",
                    detail: `You are running the latest version (${electronApp.getVersion()}).`,
                    buttons: ["OK"],
                  });
                } else if (!result) {
                  // No result usually means already up to date
                  dialog.showMessageBox({
                    type: "info",
                    title: "You're Up to Date ✅",
                    message: "AuraSwift is up to date!",
                    detail: `You are running version ${electronApp.getVersion()}, which is the latest available version.`,
                    buttons: ["OK"],
                  });
                }
              } catch (error) {
                console.error("Error checking for updates:", error);

                // Show user-friendly error
                const errorMessage =
                  error instanceof Error ? error.message : String(error);

                // Skip dialog for expected "no updates" scenarios
                if (
                  errorMessage.includes("No published versions") ||
                  errorMessage.includes("Cannot find latest") ||
                  errorMessage.includes("No updates available")
                ) {
                  dialog.showMessageBox({
                    type: "info",
                    title: "You're Up to Date ✅",
                    message: "AuraSwift is up to date!",
                    detail: `You are running version ${electronApp.getVersion()}, which is the latest available version.`,
                    buttons: ["OK"],
                  });
                } else {
                  // Show error dialog for real issues
                  dialog
                    .showMessageBox({
                      type: "warning",
                      title: "Unable to Check for Updates",
                      message: "Could not connect to update server",
                      detail: `Error: ${errorMessage}\n\nPlease check your internet connection and try again later.\n\nYou can also check for updates manually at:\nhttps://github.com/Sam231221/AuraSwift/releases`,
                      buttons: ["OK", "Open GitHub Releases"],
                    })
                    .then((result: { response: number }) => {
                      if (result.response === 1) {
                        shell.openExternal(
                          "https://github.com/Sam231221/AuraSwift/releases"
                        );
                      }
                    });
                }
              }
            },
          },
          {
            label: "View Update Error...",
            click: async () => {
              // Get the autoUpdater instance
              const { getAutoUpdaterInstance } = await import("../index.js");
              const updaterInstance = getAutoUpdaterInstance();

              if (updaterInstance) {
                updaterInstance.showLastErrorDialog();
              } else {
                const { dialog } = await import("electron");
                dialog
                  .showMessageBox({
                    type: "info",
                    title: "Auto-Updater Not Available",
                    message: "Auto-updater is not enabled",
                    detail:
                      "The auto-updater is not available in development mode.\n\nTo check for updates manually, visit:\nhttps://github.com/Sam231221/AuraSwift/releases",
                    buttons: ["OK", "Open GitHub Releases"],
                  })
                  .then((result: { response: number }) => {
                    if (result.response === 1) {
                      shell.openExternal(
                        "https://github.com/Sam231221/AuraSwift/releases"
                      );
                    }
                  });
              }
            },
          },
          { type: "separator" as const },
          {
            label: "View Release Notes",
            click: () => {
              shell.openExternal(
                "https://github.com/Sam231221/AuraSwift/releases"
              );
            },
          },
          { type: "separator" as const },
          {
            label: "About AuraSwift",
            click: () => {
              const { dialog } = require("electron");
              dialog
                .showMessageBox({
                  type: "info",
                  title: "About AuraSwift",
                  message: `AuraSwift POS System`,
                  detail: `Version: ${electronApp.getVersion()}\n\nA modern point-of-sale system for retail businesses.\n\n© 2025 Sameer Shahi\n\nGitHub: github.com/Sam231221/AuraSwift`,
                  buttons: ["OK", "Visit GitHub"],
                })
                .then((result: { response: number }) => {
                  if (result.response === 1) {
                    shell.openExternal(
                      "https://github.com/Sam231221/AuraSwift"
                    );
                  }
                });
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  async createWindow(): Promise<BrowserWindow> {
    // Get the icon path - use .icns for macOS, .png for others
    const iconPath =
      process.platform === "darwin"
        ? join(process.cwd(), "buildResources", "icon.icns")
        : join(process.cwd(), "buildResources", "icon.ico");

    const browserWindow = new BrowserWindow({
      width: 1100, // Increased window width
      height: 600, // Optional: increase height for better layout
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      icon: iconPath, // Set the window icon
      title: "", // Set the window title
      autoHideMenuBar: true, // Hide menu bar on Windows/Linux
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
        webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
        preload: this.#preload.path,
        devTools: this.#openDevTools, // Enable DevTools based on config
      },
    });

    // Hide the menu bar completely
    browserWindow.setMenuBarVisibility(false);

    // Prevent opening DevTools with keyboard shortcuts (only if DevTools disabled)
    if (!this.#openDevTools) {
      browserWindow.webContents.on("before-input-event", (event, input) => {
        // Block F12 and Ctrl+Shift+I (Cmd+Option+I on Mac)
        if (
          input.key === "F12" ||
          (input.control && input.shift && input.key === "I") ||
          (input.meta && input.alt && input.key === "I")
        ) {
          event.preventDefault();
        }
      });
    }

    // Ensure window shows when ready to prevent "main window not visible" test failures
    browserWindow.once("ready-to-show", () => {
      browserWindow.show();
    });

    if (this.#renderer instanceof URL) {
      await browserWindow.loadURL(this.#renderer.href);
    } else {
      await browserWindow.loadFile(this.#renderer.path);
    }

    return browserWindow;
  }

  async restoreOrCreateWindow(show = false) {
    let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

    if (window === undefined) {
      window = await this.createWindow();
    }

    if (!show) {
      return window;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window?.show();

    if (this.#openDevTools) {
      window?.webContents.openDevTools();
    }

    window.focus();

    return window;
  }
}

export function createWindowManagerModule(
  ...args: ConstructorParameters<typeof WindowManager>
) {
  return new WindowManager(...args);
}
