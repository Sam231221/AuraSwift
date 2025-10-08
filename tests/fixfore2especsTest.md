The error "App Executable path not found" indicates that Playwright cannot find the built Electron executable. This is a common issue with GitHub Actions environments. Here are several solutions to fix this:

## Solution 1: Fix the Executable Path Pattern

Replace your current executable path logic with this more robust approach:

```typescript
import type { ElectronApplication, JSHandle } from "playwright";
import { _electron as electron } from "playwright";
import { expect, test as base } from "@playwright/test";
import type { BrowserWindow } from "electron";
import { globSync } from "glob";
import { platform, arch } from "node:process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";

process.env.PLAYWRIGHT_TEST = "true";

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

      // Try multiple possible locations and patterns
      const possiblePaths = [
        // For electron-vite-builder output
        "dist/**/*.{app,exe,AppImage}",
        "out/**/*.{app,exe,AppImage}",
        "release/**/*.{app,exe,AppImage}",
        "dist-electron/**/*.{app,exe,AppImage}",

        // Platform-specific patterns
        platform === "darwin" ? "dist/*.app/Contents/MacOS/*" : undefined,
        platform === "win32" ? "dist/*.exe" : undefined,
        platform === "linux" ? "dist/*.AppImage" : undefined,

        // Direct executable names (common in CI)
        "dist/electron",
        "dist/aura-swift",
        "dist/AuraSwift",

        // Fallback to any executable in dist folder
        "dist/*",
      ].filter(Boolean) as string[];

      // Also check if we're in a packaged app scenario
      const appPaths = globSync(possiblePaths, { nodir: true });

      if (appPaths.length > 0) {
        executablePath = appPaths[0];
        console.log(`Found executable at: ${executablePath}`);
      } else {
        // If no built app found, try running from source (development mode)
        console.log("No built app found, checking for source execution...");

        // Look for the main entry point
        const mainEntries = ["dist-electron/main.js", "out/main.js", "dist/main.js", "build/main.js", "src/main.js", "packages/main/dist/index.js"].filter(existsSync);

        if (mainEntries.length > 0) {
          // Use Electron directly with the main entry point
          executablePath = require("electron") as unknown as string;
          const mainEntry = mainEntries[0];
          console.log(`Running from source with main: ${mainEntry}`);
        } else {
          throw new Error(
            `App Executable path not found. Checked patterns: ${possiblePaths.join(", ")}\n` +
              `Current working directory: ${process.cwd()}\n` +
              `Directory contents: ${globSync("*", { recursive: true }).join(", ")}`
          );
        }
      }

      const electronApp = await electron.launch({
        executablePath: executablePath,
        args: executablePath === require("electron") ? [mainEntry, "--no-sandbox"] : ["--no-sandbox"],
        timeout: 30000, // Increase timeout for CI
      });

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
      await electronApp.close();
    },
    { scope: "worker", auto: true } as any,
  ],

  electronVersions: async ({ electronApp }, use) => {
    await use(await electronApp.evaluate(() => process.versions));
  },
});
```

## Solution 2: GitHub Actions Workflow Configuration

Make sure your GitHub Actions workflow builds the Electron app before running tests:

```yaml
# .github/workflows/test.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build Electron app
        run: npm run build
        env:
          # Add any build environment variables needed
          NODE_ENV: production

      - name: Install Playwright
        run: npx playwright install

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.os }}
          path: |
            test-results/
            playwright-report/
```

## Solution 3: Package.json Scripts Configuration

Ensure your `package.json` has the correct build scripts:

```json
{
  "scripts": {
    "build": "electron-vite build && electron-builder",
    "build:ci": "electron-vite build --mode production",
    "test:e2e": "playwright test",
    "test:e2e:ci": "playwright test --reporter=line"
  },
  "build": {
    "appId": "com.yourcompany.auraswift",
    "productName": "AuraSwift",
    "directories": {
      "output": "dist"
    },
    "files": ["dist-electron/**/*"]
  }
}
```

## Solution 4: Debugging Helper

Add this debug test to understand your build environment:

```typescript
test.describe("Build Environment Debug", () => {
  test("Check build output structure", async () => {
    const fs = require("fs");
    const path = require("path");

    console.log("Current working directory:", process.cwd());
    console.log("Directory contents:");

    function listFiles(dir: string, indent = "") {
      try {
        const items = fs.readdirSync(dir);
        items.forEach((item) => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            console.log(`${indent}📁 ${item}/`);
            listFiles(fullPath, indent + "  ");
          } else {
            console.log(`${indent}📄 ${item}`);
          }
        });
      } catch (error) {
        console.log(`${indent}❌ Cannot read directory: ${dir}`);
      }
    }

    listFiles(".");
  });
});
```

## Solution 5: Conditional CI Detection

Handle CI environments specifically:

```typescript
const isCI = process.env.CI === "true";

// In your electronApp fixture:
electronApp: [
  async ({}, use) => {
    let executablePath: string | undefined;

    if (isCI) {
      // CI-specific paths
      const ciPaths = [
        "dist/*.AppImage", // Linux
        "dist/*.exe", // Windows
        "dist/*.app/Contents/MacOS/*", // macOS
        "release/build/*", // Alternative CI location
      ];
      executablePath = globSync(ciPaths, { nodir: true })[0];
    } else {
      // Local development paths
      const localPaths = ["dist/**/*.{app,exe,AppImage}", "out/**/*.{app,exe,AppImage}", "node_modules/.bin/electron"];
      executablePath = globSync(localPaths, { nodir: true })[0];
    }

    if (!executablePath) {
      // Fallback to electron binary for development
      executablePath = require("electron") as unknown as string;
    }

    // Rest of your launch code...
  },
];
```

## Quick Fix

If you need an immediate fix, try this minimal change to your existing code:

```typescript
// Replace just the executable path section with:
let executablePattern = "dist/**/*";
if (platform === "darwin") {
  executablePattern = "dist/**/*.app/Contents/MacOS/*";
} else if (platform === "win32") {
  executablePattern = "dist/**/*.exe";
} else {
  executablePattern = "dist/**/*.AppImage";
}

const [executablePath] = globSync(executablePattern);
if (!executablePath) {
  // Fallback: use electron binary directly (for development)
  executablePath = require("electron") as unknown as string;
}
```

Try **Solution 1** first, as it provides the most comprehensive path detection. The key is ensuring your build process actually creates the Electron executable before the tests run in GitHub Actions.
