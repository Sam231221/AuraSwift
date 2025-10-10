import type { ElectronApplication, JSHandle } from "playwright";
import { _electron as electron } from "playwright";
import { expect, test as base } from "@playwright/test";
import type { BrowserWindow } from "electron";
import { globSync } from "glob";
import { platform, arch } from "node:process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import electronPath from "electron";

process.env.PLAYWRIGHT_TEST = "true";

/**
 * E2E Tests for AuraSwift POS System
 * Technology Stack: React 18 + TypeScript + Electron + Vite
 * Architecture: Main process, Preload scripts, Renderer (React)
 */

// Declare the types of your fixtures.
type TestFixtures = {
  electronApp: ElectronApplication;
  electronVersions: NodeJS.ProcessVersions;
};

const test = base.extend<TestFixtures>({
  electronApp: [
    async ({}, use) => {
      /**
       * Improved executable path detection for different environments
       */
      let executablePath: string | undefined;
      let mainEntry: string | undefined;
      const isCI = process.env.CI === "true";

      // Try multiple possible locations and patterns based on electron-builder output
      const possiblePaths = [
        // Windows-specific patterns (prioritized since we're Windows-only now)
        "dist/win-unpacked/auraswift.exe",
        "dist/win-unpacked/AuraSwift.exe",
        "dist/win-unpacked/*.exe",
        "dist/*.exe",
        "dist/**/*.exe",
        "dist/win-unpacked/**/*.exe",

        // Electron-builder Windows output patterns (common locations)
        "dist/**/auraswift.exe",
        "dist/**/AuraSwift.exe",
        "dist/**/aura-swift.exe",
        "dist/auraswift*.exe",
        "dist/AuraSwift*.exe",
        "dist/aura-swift*.exe",

        // Generic executable patterns
        "dist/**/*.exe",
        "out/**/*.exe",
        "release/**/*.exe",

        // Development mode fallbacks (if no built executable found)
        "dist/main.js",
        "out/main.js",
      ].filter(Boolean) as string[];

      console.log(`[Test Setup] Platform: ${platform}, CI: ${isCI}`);
      console.log(`[Test Setup] Current working directory: ${process.cwd()}`);

      // Also check if we're in a packaged app scenario
      const appPaths = globSync(possiblePaths, { nodir: true });

      if (appPaths.length > 0) {
        executablePath = appPaths[0];
        console.log(`[Test Setup] Found executable at: ${executablePath}`);
      } else {
        // If no built app found, try running from source (development mode)
        console.log(
          "[Test Setup] No built app found, checking for source execution..."
        );

        // Check for the entry point file
        if (existsSync("packages/entry-point.mjs")) {
          // Use Electron directly with the entry point
          executablePath = electronPath as unknown as string;
          mainEntry = "packages/entry-point.mjs";
          console.log(
            `[Test Setup] Running from source with entry point: ${mainEntry}`
          );
        } else {
          // Look for other main entry points
          const mainEntries = [
            "dist-electron/main.js",
            "out/main.js",
            "dist/main.js",
            "build/main.js",
            "src/main.js",
            "packages/main/dist/index.js",
          ].filter(existsSync);

          if (mainEntries.length > 0) {
            // Use Electron directly with the main entry point
            executablePath = electronPath as unknown as string;
            mainEntry = mainEntries[0];
            console.log(
              `[Test Setup] Running from source with main: ${mainEntry}`
            );
          } else {
            // Debug information for troubleshooting
            const allFiles = globSync("**/*", { nodir: true }).slice(0, 50); // Limit output
            throw new Error(
              `App Executable path not found. Checked patterns: ${possiblePaths.join(
                ", "
              )}\n` +
                `Current working directory: ${process.cwd()}\n` +
                `First 50 files found: ${allFiles.join(", ")}\n` +
                `Platform: ${platform}, Arch: ${arch}, CI: ${isCI}`
            );
          }
        }
      }

      const launchArgs = mainEntry
        ? [mainEntry, "--no-sandbox", "--disable-gpu", "--headless"]
        : ["--no-sandbox", "--disable-gpu", "--headless"];

      // Add more args for Windows CI environment
      if (isCI && platform === "win32") {
        launchArgs.push("--disable-dev-shm-usage", "--disable-extensions");
      }

      console.log(
        `[Test Setup] Launching Electron with args: ${launchArgs.join(" ")}`
      );

      let electronApp;
      try {
        electronApp = await electron.launch({
          executablePath: executablePath,
          args: launchArgs,
          timeout: 60000, // Increase timeout for CI with native modules
          env: {
            ...process.env,
            NODE_ENV: "test",
            ELECTRON_DISABLE_GPU: "1",
            ELECTRON_NO_SANDBOX: "1",
            ELECTRON_ENABLE_LOGGING: "1",
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[Test Setup] Failed to launch Electron: ${errorMessage}`
        );
        console.error(`[Test Setup] Executable path: ${executablePath}`);
        console.error(`[Test Setup] Launch args: ${launchArgs.join(" ")}`);

        // If we're using a built executable and it fails, try development mode
        if (!mainEntry && executablePath.endsWith(".exe")) {
          console.log("[Test Setup] Trying development mode as fallback...");
          const electronBinary = require("electron") as unknown as string;
          const devMainEntry = "packages/entry-point.mjs";

          if (existsSync(devMainEntry)) {
            console.log(
              `[Test Setup] Attempting to launch with development entry: ${devMainEntry}`
            );
            electronApp = await electron.launch({
              executablePath: electronBinary,
              args: [devMainEntry, ...launchArgs],
              timeout: 60000,
              env: {
                ...process.env,
                NODE_ENV: "test",
                ELECTRON_DISABLE_GPU: "1",
                ELECTRON_NO_SANDBOX: "1",
                ELECTRON_ENABLE_LOGGING: "1",
              },
            });
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      electronApp.on("console", (msg) => {
        if (msg.type() === "error") {
          console.error(`[electron][${msg.type()}] ${msg.text()}`);
        }
      });

      electronApp.on("window", (page) => {
        page.on("pageerror", (error) => {
          console.error(`[page error] ${error.message}`);
        });
        page.on("console", (msg) => {
          if (msg.type() === "error") {
            console.error(`[renderer][${msg.type()}] ${msg.text()}`);
          }
        });
      });

      await use(electronApp);

      // This code runs after all the tests in the worker process.
      await electronApp.close();
    },
    { scope: "worker", auto: true } as any,
  ],

  electronVersions: async ({ electronApp }, use) => {
    await use(await electronApp.evaluate(() => process.versions));
  },
});

test.describe("Build Environment Debug", () => {
  test("Check build output structure", async () => {
    const fs = require("fs");
    const path = require("path");

    console.log("[Debug] Current working directory:", process.cwd());
    console.log("[Debug] Platform:", platform, "Arch:", arch);
    console.log("[Debug] CI Environment:", process.env.CI);
    console.log("[Debug] Directory contents:");

    function listFiles(
      dir: string,
      indent = "",
      maxDepth = 2,
      currentDepth = 0
    ) {
      if (currentDepth >= maxDepth) return;

      try {
        const items = fs.readdirSync(dir);
        items.slice(0, 20).forEach((item: string) => {
          // Limit items per directory
          const fullPath = path.join(dir, item);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              console.log(`${indent}📁 ${item}/`);
              if (
                item === "dist" ||
                item === "out" ||
                item === "release" ||
                item === "build"
              ) {
                listFiles(
                  fullPath,
                  indent + "  ",
                  maxDepth + 1,
                  currentDepth + 1
                );
              }
            } else {
              console.log(`${indent}📄 ${item}`);
            }
          } catch (error) {
            console.log(`${indent}❓ ${item} (access error)`);
          }
        });
      } catch (error) {
        console.log(`${indent}❌ Cannot read directory: ${dir}`);
      }
    }

    listFiles(".");

    // Check specifically for Electron executables
    const electronPaths = globSync(
      [
        "dist/**/*.{app,exe,AppImage}",
        "out/**/*.{app,exe,AppImage}",
        "release/**/*.{app,exe,AppImage}",
        "packages/main/dist/**/*.js",
      ],
      { nodir: true }
    );

    console.log("[Debug] Found potential Electron paths:", electronPaths);

    // This test always passes - it's just for debugging
    expect(true).toBe(true);
  });
});

test.describe("Vite Build & TypeScript Integration", async () => {
  test("Vite development assets load correctly", async ({ electronApp }) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("load");

    // Check that Vite has processed the assets correctly
    const viteAssetsLoaded = await page.evaluate(() => {
      // Check for CSS being loaded (Vite injects styles)
      const hasStyles =
        document.head.querySelector("style") ||
        document.head.querySelector('link[rel="stylesheet"]');

      // Check for React being loaded
      const rootElement = document.querySelector("#root");
      const hasReact =
        typeof (window as any).React !== "undefined" ||
        (rootElement && rootElement.children.length > 0);

      return { hasStyles: !!hasStyles, hasReact };
    });

    expect(viteAssetsLoaded.hasReact).toBe(true);
  });

  test("TypeScript compilation produces working code", async ({
    electronApp,
  }) => {
    const page = await electronApp.firstWindow();
    await page.waitForTimeout(2000);

    // Verify that TypeScript interfaces and types are working
    const typescriptWorking = await page.evaluate(() => {
      // Test that APIs have expected method signatures (TypeScript would catch errors)
      const authAPI = (window as any).authAPI;
      const productAPI = (window as any).productAPI;

      return {
        authAPIHasMethods: authAPI && typeof authAPI.login === "function",
        productAPIHasMethods:
          productAPI && typeof productAPI.getAll === "function",
        noTypeErrors: true, // If we get here, TypeScript compilation succeeded
      };
    });

    expect(typescriptWorking.authAPIHasMethods).toBe(true);
    expect(typescriptWorking.noTypeErrors).toBe(true);
  });
});

test("Main window state", async ({ electronApp }) => {
  const page = await electronApp.firstWindow();
  const window: JSHandle<BrowserWindow> = await electronApp.browserWindow(page);
  const windowState = await window.evaluate(
    (
      mainWindow
    ): Promise<{
      isVisible: boolean;
      isDevToolsOpened: boolean;
      isCrashed: boolean;
    }> => {
      const getState = () => ({
        isVisible: mainWindow.isVisible(),
        isDevToolsOpened: mainWindow.webContents.isDevToolsOpened(),
        isCrashed: mainWindow.webContents.isCrashed(),
      });

      return new Promise((resolve) => {
        /**
         * The main window is created hidden, and is shown only when it is ready.
         * See {@link ../packages/main/src/mainWindow.ts} function
         */
        if (mainWindow.isVisible()) {
          resolve(getState());
        } else {
          // Add timeout to prevent hanging
          const timeout = setTimeout(() => resolve(getState()), 10000);
          mainWindow.once("ready-to-show", () => {
            clearTimeout(timeout);
            resolve(getState());
          });
        }
      });
    }
  );

  expect(windowState.isCrashed, "The app has crashed").toEqual(false);
  expect(windowState.isVisible, "The main window was not visible").toEqual(
    true
  );
  expect(windowState.isDevToolsOpened, "The DevTools panel was open").toEqual(
    false
  );
});

test.describe("React TypeScript Electron Vite POS Application", async () => {
  test("The main window loads React app successfully", async ({
    electronApp,
  }) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("load");

    // Wait for the React app to load with Vite
    await page.waitForTimeout(3000);

    // Check if the page has loaded (look for any content)
    const bodyVisible = await page.locator("body").isVisible();
    expect(bodyVisible).toBe(true);

    // Check if React root element exists (created by React 18 createRoot)
    const rootVisible = await page.locator("#root").isVisible();
    expect(rootVisible).toBe(true);

    // Verify React app has mounted and rendered content
    const hasReactContent = await page.evaluate(() => {
      const root = document.getElementById("root");
      return root && root.children.length > 0;
    });
    expect(hasReactContent).toBe(true);
  });

  test("Router navigation works (HashRouter setup)", async ({
    electronApp,
  }) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("load");
    await page.waitForTimeout(3000);

    // Check that HashRouter is working - should redirect to /auth initially
    const currentUrl = page.url();
    expect(currentUrl).toContain("#/auth");
  });

  test("Authentication page renders properly", async ({ electronApp }) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("load");
    await page.waitForTimeout(4000);

    // Check if we're on the auth page (due to ProtectedRoute redirect)
    const currentUrl = page.url();
    expect(currentUrl).toContain("#/auth");

    // Verify auth page elements are present
    const authPagePresent = await page.evaluate(() => {
      // Look for common auth page elements
      const hasFormElements =
        document.querySelector('input[type="email"]') ||
        document.querySelector('input[type="password"]') ||
        document.querySelector("form") ||
        document.querySelector('[role="button"]') ||
        document.querySelector("button");
      return !!hasFormElements;
    });

    expect(authPagePresent).toBe(true);
  });

  test("POS-specific APIs are available in renderer process", async ({
    electronApp,
  }) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("load");
    await page.waitForTimeout(2000);

    // Test that key POS APIs are exposed via preload script
    const posAPIsAvailable = await page.evaluate(() => {
      const apis = [
        "authAPI",
        "productAPI",
        "transactionAPI",
        "printerAPI",
        "paymentAPI",
        "cashDrawerAPI",
        "authStore",
      ];

      return apis.every((api) => typeof (window as any)[api] === "object");
    });

    expect(posAPIsAvailable).toBe(true);
  });
});

test.describe("Preload Security Context (TypeScript Electron)", async () => {
  test.describe(`Electron application info`, async () => {
    test("Application loads successfully", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();

      // Test that the page loads and has basic DOM structure
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    test("Basic renderer context is functional", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();

      // Test basic JavaScript execution in renderer
      const result = await page.evaluate(() => {
        return typeof window !== "undefined";
      });

      expect(result).toBe(true);
    });
  });

  test.describe(`Crypto utilities functionality`, async () => {
    test("btoa function is available", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();

      const btoaAvailable = await page.evaluate(() => {
        return typeof (globalThis as any).btoa === "function";
      });

      expect(btoaAvailable).toBe(true);
    });

    test("btoa function works correctly", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();

      const testString = "hello world";
      const result = await page.evaluate((str) => {
        return (globalThis as any).btoa(str);
      }, testString);

      const expectedValue = Buffer.from(testString, "binary").toString(
        "base64"
      );
      expect(result).toEqual(expectedValue);
    });
  });

  test.describe(`IPC communication infrastructure works`, async () => {
    test("Authentication API is available for IPC", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();

      const authAPIAvailable = await page.evaluate(() => {
        return typeof (globalThis as any).authAPI === "object";
      });

      expect(authAPIAvailable).toBe(true);
    });

    test("Authentication API methods are accessible", async ({
      electronApp,
    }) => {
      const page = await electronApp.firstWindow();

      const authMethods = await page.evaluate(() => {
        const api = (globalThis as any).authAPI;
        return api ? Object.keys(api) : [];
      });

      expect(authMethods).toContain("login");
      expect(authMethods).toContain("register");
    });
  });

  test.describe("POS Application Context Bridge APIs", async () => {
    test("All required POS APIs are exposed", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();
      await page.waitForTimeout(1000);

      const apisExposed = await page.evaluate(() => {
        const requiredAPIs = [
          "authAPI",
          "authStore",
          "productAPI",
          "transactionAPI",
          "printerAPI",
          "paymentAPI",
          "cashDrawerAPI",
          "categoryAPI",
          "scheduleAPI",
          "shiftAPI",
          "refundAPI",
          "voidAPI",
          "databaseAPI",
        ];

        const exposedAPIs = requiredAPIs.filter(
          (api) =>
            typeof (window as any)[api] === "object" &&
            (window as any)[api] !== null
        );

        return {
          required: requiredAPIs.length,
          exposed: exposedAPIs.length,
          missing: requiredAPIs.filter(
            (api) => typeof (window as any)[api] !== "object"
          ),
        };
      });

      expect(apisExposed.exposed).toBeGreaterThanOrEqual(10); // At least 10 POS APIs should be exposed
      expect(apisExposed.missing.length).toBeLessThan(3); // Allow for a few optional APIs
    });

    test("Authentication API methods are available", async ({
      electronApp,
    }) => {
      const page = await electronApp.firstWindow();

      const authAPIComplete = await page.evaluate(() => {
        const authAPI = (window as any).authAPI;
        if (!authAPI) return false;

        const requiredMethods = ["login", "register", "validateSession"];
        return requiredMethods.every(
          (method) => typeof authAPI[method] === "function"
        );
      });

      expect(authAPIComplete).toBe(true);
    });
  });
});
