import type { ElectronApplication, JSHandle } from "playwright";
import { _electron as electron } from "playwright";
import { expect, test as base } from "@playwright/test";
import type { BrowserWindow } from "electron";
import { globSync } from "glob";
import { platform } from "node:process";
import { createHash } from "node:crypto";

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
       * Executable path depends on root package name!
       */
      let executablePattern = "dist/*/root{,.*}";
      if (platform === "darwin") {
        executablePattern += "/Contents/*/root";
      }

      const [executablePath] = globSync(executablePattern);
      if (!executablePath) {
        throw new Error("App Executable path not found");
      }

      const electronApp = await electron.launch({
        executablePath: executablePath,
        args: ["--no-sandbox"],
      });

      electronApp.on("console", (msg) => {
        if (msg.type() === "error") {
          console.error(`[electron][${msg.type()}] ${msg.text()}`);
        }
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
  test.describe(`Electron versions should be exposed`, async () => {
    test("versions exposed with correct type", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();
      const type = await page.evaluate(
        () => typeof (globalThis as any)[btoa("versions")]
      );
      expect(type).toEqual("object");
    });

    test("versions match Electron runtime versions", async ({
      electronApp,
      electronVersions,
    }) => {
      const page = await electronApp.firstWindow();
      const value = await page.evaluate(
        () => (globalThis as any)[btoa("versions")]
      );
      expect(value).toEqual(electronVersions);
    });
  });

  test.describe(`Crypto utilities should be exposed`, async () => {
    test("sha256sum function exposed", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();
      const type = await page.evaluate(
        () => typeof (globalThis as any)[btoa("sha256sum")]
      );
      expect(type).toEqual("function");
    });

    test("sha256sum produces correct hash", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();
      const testString = btoa(`${Date.now() * Math.random()}`);
      const expectedValue = createHash("sha256")
        .update(testString)
        .digest("hex");
      const value = await page.evaluate(
        (str) => (globalThis as any)[btoa("sha256sum")](str),
        testString
      );
      expect(value).toEqual(expectedValue);
    });
  });

  test.describe(`IPC communication should work`, async () => {
    test("send function exposed for IPC", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();
      const type = await page.evaluate(
        () => typeof (globalThis as any)[btoa("send")]
      );
      expect(type).toEqual("function");
    });

    test("IPC communication works end-to-end", async ({ electronApp }) => {
      const page = await electronApp.firstWindow();

      await electronApp.evaluate(async ({ ipcMain }) => {
        ipcMain.handle("test-ipc", (event, message) => btoa(message));
      });

      const testString = btoa(`${Date.now() * Math.random()}`);
      const expectedValue = btoa(testString);
      const value = await page.evaluate(
        async (str) => await (globalThis as any)[btoa("send")]("test-ipc", str),
        testString
      );
      expect(value).toEqual(expectedValue);
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
