// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import type { AppInitConfig } from "./AppInitConfig.js";
import { createModuleRunner } from "./ModuleRunner.js";
import { disallowMultipleAppInstance } from "./modules/SingleInstanceApp.js";
import { createWindowManagerModule } from "./modules/WindowManager.js";
import { terminateAppOnLastWindowClose } from "./modules/ApplicationTerminatorOnLastWindowClose.js";
import { autoUpdater } from "./modules/AutoUpdater.js";
import { allowInternalOrigins } from "./modules/BlockNotAllowdOrigins.js";
import { allowExternalUrls } from "./modules/ExternalUrls.js";
import "./authStore.js"; // Initialize auth handlers
import { getDatabase } from "./database/index.js";

// Global reference to autoUpdater instance for menu access
let autoUpdaterInstance: ReturnType<typeof autoUpdater> | null = null;

export function getAutoUpdaterInstance() {
  return autoUpdaterInstance;
}

export async function initApp(initConfig: AppInitConfig) {
  // Initialize database
  const db = await getDatabase();

  // Initialize thermal printer service after database is ready
  await import("./services/thermalPrinterService.js");

  // Initialize office printer service for HP LaserJet and similar printers
  await import("./services/officePrinterService.js");

  // Initialize PDF receipt generation service
  await import("./services/pdfReceiptService.js");

  // Initialize payment service for BBPOS WisePad 3 and Stripe integration
  await import("./services/paymentService.js");

  // Set up periodic cleanup of old unclosed shifts
  // Run cleanup every 30 minutes
  const cleanupInterval = setInterval(() => {
    try {
      db.shifts.autoCloseOldActiveShifts();
    } catch (error) {
      // Error during periodic shift cleanup
    }
  }, 30 * 60 * 1000); // 30 minutes

  // Clean up on app exit
  process.on("exit", () => {
    clearInterval(cleanupInterval);
  });

  // Run cleanup immediately on startup
  try {
    db.shifts.autoCloseOldActiveShifts();
  } catch (error) {
    // Error during startup shift cleanup
  }

  const moduleRunner = createModuleRunner()
    .init(
      createWindowManagerModule({
        initConfig,
        // DevTools disabled
        openDevTools: true,
      })
    )
    .init(disallowMultipleAppInstance())
    .init(terminateAppOnLastWindowClose());
  // Note: Hardware acceleration is disabled in entry-point.mjs before app.ready

  // Only enable auto-updater in production, not in test or development
  if (
    process.env.NODE_ENV !== "test" &&
    !process.env.ELECTRON_UPDATER_DISABLED
  ) {
    autoUpdaterInstance = autoUpdater();
    moduleRunner.init(autoUpdaterInstance);
  }
  // Install DevTools extension if needed
  // .init(chromeDevToolsExtension({extension: 'VUEJS3_DEVTOOLS'}))

  moduleRunner
    // Security
    .init(
      allowInternalOrigins(
        new Set(
          initConfig.renderer instanceof URL ? [initConfig.renderer.origin] : []
        )
      )
    )
    .init(
      allowExternalUrls(
        new Set(
          initConfig.renderer instanceof URL
            ? [
                "https://vite.dev",
                "https://developer.mozilla.org",
                "https://solidjs.com",
                "https://qwik.dev",
                "https://lit.dev",
                "https://react.dev",
                "https://preactjs.com",
                "https://www.typescriptlang.org",
                "https://vuejs.org",
              ]
            : []
        )
      )
    );

  await moduleRunner;
}
