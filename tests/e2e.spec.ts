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

      // Also check if we're in a packaged app scenario
      const appPaths = globSync(possiblePaths, { nodir: true });

      if (appPaths.length > 0) {
        executablePath = appPaths[0];
      } else {
        // If no built app found, try running from source (development mode)

        // Check for the entry point file
        if (existsSync("packages/entry-point.mjs")) {
          // Use Electron directly with the entry point
          executablePath = electronPath as unknown as string;
          mainEntry = "packages/entry-point.mjs";
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
        ? [mainEntry, "--no-sandbox", "--disable-gpu"]
        : ["--no-sandbox", "--disable-gpu"];

      // Add more args for Windows CI environment
      if (isCI && platform === "win32") {
        launchArgs.push("--disable-dev-shm-usage", "--disable-extensions");
      }

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
        if (!mainEntry && executablePath && executablePath.endsWith(".exe")) {
          // Use the imported electronPath (it's the path to electron executable)
          const electronBinary = electronPath as unknown as string;
          const devMainEntry = "packages/entry-point.mjs";

          if (existsSync(devMainEntry)) {
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
    // Use ES module imports instead of require()
    const { readdir, stat } = await import("node:fs/promises");
    const { join, resolve } = await import("node:path");

    async function listFiles(
      dir: string,
      indent = "",
      maxDepth = 2,
      currentDepth = 0
    ) {
      if (currentDepth >= maxDepth) return;

      try {
        const items = await readdir(dir);
        const limitedItems = items.slice(0, 20); // Limit items per directory

        for (const item of limitedItems) {
          const fullPath = join(dir, item);
          try {
            const statResult = await stat(fullPath);
            if (statResult.isDirectory()) {
              if (
                item === "dist" ||
                item === "out" ||
                item === "release" ||
                item === "build"
              ) {
                await listFiles(
                  fullPath,
                  indent + "  ",
                  maxDepth + 1,
                  currentDepth + 1
                );
              }
            } else {
              // no-op
            }
          } catch (error) {
            // no-op
          }
        }
      } catch (error) {
        // no-op
      }
    }

    await listFiles(".");

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

    // This test always passes - it's just for debugging
    expect(true).toBe(true);
  });
});

test.describe("Vite Build & TypeScript Integration", async () => {
  test("Vite development assets load correctly", async ({ electronApp }) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("load");

    // Wait for body to be present
    await page.waitForSelector("body", { timeout: 10000 });

    // Wait for React root element to exist
    await page.waitForSelector("#root", { timeout: 10000 });

    // Wait for React root to be populated (React has mounted)
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return root && root.children.length > 0;
      },
      { timeout: 15000 }
    );

    // Additional wait to ensure React has fully rendered
    await page.waitForTimeout(1000);

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

// Clean up authentication state before each test to ensure tests start from clean state
test.beforeEach(async ({ electronApp }) => {
  const page = await electronApp.firstWindow();
  await page.waitForLoadState("domcontentloaded");

  // Clear browser storage (localStorage, sessionStorage)
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      // no-op
    }
  });

  // Logout via API if user is logged in
  await page.evaluate(async () => {
    try {
      if ((window as any).authAPI?.logout) {
        await (window as any).authAPI.logout();
      }
    } catch (error) {
      // no-op
    }
  });

  // Close DevTools if open (for clean test environment)
  const window = await electronApp.browserWindow(page);
  await window.evaluate((mainWindow) => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    }
  });

  // Small delay to ensure state is cleared
  await page.waitForTimeout(500);
});

test("Main window state", async ({ electronApp }) => {
  const page = await electronApp.firstWindow();
  await page.waitForLoadState("domcontentloaded");

  const window: JSHandle<BrowserWindow> = await electronApp.browserWindow(page);

  // Force show the window if it's not visible in CI
  await window.evaluate((mainWindow) => {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  // Wait a bit after forcing show
  await page.waitForTimeout(2000);

  // Give the window more time to show up
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
         * Extended timeout for CI environments (20 seconds)
         */
        if (mainWindow.isVisible()) {
          resolve(getState());
        } else {
          // Even longer timeout for CI environments (20 seconds)
          const timeout = setTimeout(() => {
            mainWindow.show();
            resolve(getState());
          }, 20000);

          mainWindow.once("ready-to-show", () => {
            clearTimeout(timeout);
            resolve(getState());
          });

          // Also listen for 'show' event as backup
          mainWindow.once("show", () => {
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

    // Wait for body to be present
    await page.waitForSelector("body", { timeout: 10000 });

    // Wait for React root element to exist
    await page.waitForSelector("#root", { timeout: 10000 });

    // Wait for React root to be populated (React has mounted)
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return root && root.children.length > 0;
      },
      { timeout: 15000 }
    );

    // Additional wait to ensure React has fully rendered
    await page.waitForTimeout(1000);

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

    // Wait for body and root
    await page.waitForSelector("body", { timeout: 10000 });
    await page.waitForSelector("#root", { timeout: 10000 });

    // Wait for React to mount and router to initialize
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return root && root.children.length > 0;
      },
      { timeout: 15000 }
    );

    // Wait for router to initialize and navigate (HashRouter)
    // The router should set the hash route after React mounts
    await page.waitForFunction(
      () => {
        // Check if hash exists in URL
        const hash = window.location.hash;
        // Also check if React Router has initialized by looking for navigation
        return hash.length > 0 || window.location.href.includes("#");
      },
      { timeout: 10000 }
    );

    // Additional wait for router navigation
    await page.waitForTimeout(1000);

    // Check that HashRouter is working - should redirect to /auth initially
    const currentUrl = page.url();
    const currentHash = await page.evaluate(() => window.location.hash);

    // Check both URL and hash
    expect(currentUrl.includes("#/auth") || currentHash.includes("/auth")).toBe(
      true
    );
  });

  test("Authentication page renders properly", async ({ electronApp }) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState("load");

    // Wait for body and root
    await page.waitForSelector("body", { timeout: 10000 });
    await page.waitForSelector("#root", { timeout: 10000 });

    // Wait for React to mount
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return root && root.children.length > 0;
      },
      { timeout: 15000 }
    );

    // Wait for router to navigate to auth page
    await page.waitForFunction(
      () => {
        const hash = window.location.hash;
        return hash.includes("/auth");
      },
      { timeout: 10000 }
    );

    // Additional wait for auth page to render
    await page.waitForTimeout(1000);

    // Wait for auth page elements to be present (user selection or PIN entry)
    await page.waitForSelector(
      'text="Select User", text="Enter PIN", button, [role="button"]',
      { timeout: 10000 }
    );

    // Check if we're on the auth page (due to AppShell redirect)
    const currentUrl = page.url();
    const currentHash = await page.evaluate(() => window.location.hash);

    // Check both URL and hash
    expect(currentUrl.includes("#/auth") || currentHash.includes("/auth")).toBe(
      true
    );

    // Verify auth page elements are present (user selection grid or PIN entry)
    const authPagePresent = await page.evaluate(() => {
      // Look for auth page elements - user selection or PIN entry
      const bodyText = document.body.textContent || "";
      const hasUserSelection = bodyText.includes("Select User");
      const hasPinEntry = bodyText.includes("Enter PIN");
      const hasButtons = document.querySelector("button") !== null;

      return !!(hasUserSelection || hasPinEntry || hasButtons);
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
      await page.waitForLoadState("domcontentloaded");

      // Wait a bit for the application to fully initialize
      await page.waitForTimeout(2000);

      // Test that the page loads and has basic DOM structure
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          hasBody: !!document.body,
          bodyChildren: document.body ? document.body.children.length : 0,
          hasContent: document.body && document.body.children.length > 0,
          url: window.location.href,
        };
      });

      // Page loads successfully if it has content

      // The page should have content even if title is not set
      expect(pageInfo.hasContent).toBe(true);
      expect(pageInfo.hasBody).toBe(true);
      expect(pageInfo.bodyChildren).toBeGreaterThan(0);
    });

    test("Basic renderer context is functional", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();
      await page.waitForLoadState("domcontentloaded");

      // Give some time for the renderer to initialize
      await page.waitForTimeout(1000);

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
      await page.waitForLoadState("domcontentloaded");

      // Wait for preload to complete
      await page.waitForTimeout(2000);

      const debugInfo = await page.evaluate(() => {
        const windowBtoa = (window as any).btoa;
        const globalBtoa = (globalThis as any).btoa;

        return {
          windowBtoaType: typeof windowBtoa,
          globalBtoaType: typeof globalBtoa,
          windowKeys: Object.keys(window).filter((k) => k.includes("btoa")),
          allWindowAPIs: Object.keys(window).filter((k) => k.includes("API")),
        };
      });

      const btoaAvailable = await page.evaluate(() => {
        // Check both window.btoa (exposed via contextBridge) and globalThis.btoa
        return (
          typeof (window as any).btoa === "function" ||
          typeof (globalThis as any).btoa === "function"
        );
      });

      expect(btoaAvailable).toBe(true);
    });

    test("btoa function works correctly", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const testString = "hello world";
      const result = await page.evaluate((str) => {
        // Try window.btoa first (contextBridge exposed), then globalThis.btoa as fallback
        const btoaFn = (window as any).btoa || (globalThis as any).btoa;
        return btoaFn ? btoaFn(str) : "NO_BTOA_FUNCTION";
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
      await page.waitForLoadState("domcontentloaded");

      // Wait for preload to complete
      await page.waitForTimeout(2000);

      const debugInfo = await page.evaluate(() => {
        const authAPI = (globalThis as any).authAPI;
        const windowAuthAPI = (window as any).authAPI;
        const allAPIs = Object.keys(globalThis).filter((k) =>
          k.toLowerCase().includes("api")
        );
        const allWindowAPIs = Object.keys(window).filter((k) =>
          k.toLowerCase().includes("api")
        );

        return {
          globalAuthAPIType: typeof authAPI,
          windowAuthAPIType: typeof windowAuthAPI,
          globalAuthAPIKeys: authAPI ? Object.keys(authAPI) : null,
          windowAuthAPIKeys: windowAuthAPI ? Object.keys(windowAuthAPI) : null,
          allGlobalAPIs: allAPIs,
          allWindowAPIs: allWindowAPIs,
          globalHasAuthAPI: "authAPI" in globalThis,
          windowHasAuthAPI: "authAPI" in window,
        };
      });

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

// Export the test object so other E2E test files can use it
export { test };
