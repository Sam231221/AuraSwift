// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import type { AppInitConfig } from "./AppInitConfig.js";
import { createModuleRunner } from "./ModuleRunner.js";
import { disallowMultipleAppInstance } from "./modules/SingleInstanceApp.js";
import { createWindowManagerModule } from "./modules/WindowManager.js";
import { terminateAppOnLastWindowClose } from "./modules/ApplicationTerminatorOnLastWindowClose.js";
import { hardwareAccelerationMode } from "./modules/HardwareAccelerationModule.js";
import { autoUpdater } from "./modules/AutoUpdater.js";
import { allowInternalOrigins } from "./modules/BlockNotAllowdOrigins.js";
import { allowExternalUrls } from "./modules/ExternalUrls.js";
import "./authStore.js"; // Initialize auth handlers
import { getDatabase } from "./database.js";
export async function initApp(initConfig: AppInitConfig) {
  // Initialize database
  const db = await getDatabase();
  console.log("Database initialized");

  // Initialize thermal printer service after database is ready
  await import("./services/thermalPrinterService.js");
  console.log("Real thermal printer service initialized");

  // Initialize payment service for BBPOS WisePad 3 and Stripe integration
  await import("./services/paymentService.js");
  console.log("Payment service initialized");

  // Set up periodic cleanup of old unclosed shifts
  // Run cleanup every 30 minutes
  const cleanupInterval = setInterval(() => {
    try {
      const closedCount = db.autoCloseOldActiveShifts();
      if (closedCount > 0) {
        console.log(
          `Periodic cleanup: Auto-closed ${closedCount} old active shifts`
        );
      }
    } catch (error) {
      console.error("Error during periodic shift cleanup:", error);
    }
  }, 30 * 60 * 1000); // 30 minutes

  // Clean up on app exit
  process.on("exit", () => {
    clearInterval(cleanupInterval);
  });

  // Run cleanup immediately on startup
  try {
    const initialCleanupCount = db.autoCloseOldActiveShifts();
    if (initialCleanupCount > 0) {
      console.log(
        `Startup cleanup: Auto-closed ${initialCleanupCount} old active shifts`
      );
    }
  } catch (error) {
    console.error("Error during startup shift cleanup:", error);
  }

  const moduleRunner = createModuleRunner()
    .init(
      createWindowManagerModule({
        initConfig,
        // Only open DevTools in development mode, not in tests
        openDevTools: import.meta.env.DEV && process.env.NODE_ENV !== "test",
      })
    )
    .init(disallowMultipleAppInstance())
    .init(terminateAppOnLastWindowClose())
    .init(hardwareAccelerationMode({ enable: false }));

  // Only enable auto-updater in production, not in test or development
  if (
    process.env.NODE_ENV !== "test" &&
    !process.env.ELECTRON_UPDATER_DISABLED
  ) {
    moduleRunner.init(autoUpdater());
  }

  moduleRunner
    // Install DevTools extension if needed
    // .init(chromeDevToolsExtension({extension: 'VUEJS3_DEVTOOLS'}))

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
