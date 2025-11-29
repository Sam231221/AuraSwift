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
import "./appStore.js"; // Initialize auth handlers
import { getDatabase } from "./database/index.js";
import { registerVatCategoryIpc } from "./services/vatCategoryService.js";
import { registerBookerImportHandlers } from "./ipc/bookerImportHandlers.js";
import { registerLoggerHandlers } from "./ipc/loggerHandlers.js";
import { getLogger } from "./utils/logger.js";

const logger = getLogger('app-init');

// ============================================================================
// ADMIN FALLBACK SECURITY CHECK
// ============================================================================

/**
 * Check if admin fallback is enabled and warn on startup
 * This must match the constant in authHelpers.ts exactly
 */
const ENABLE_ADMIN_FALLBACK = 
  process.env.NODE_ENV === "development" || 
  process.env.RBAC_ADMIN_FALLBACK === "true";

if (ENABLE_ADMIN_FALLBACK) {
  const env = process.env.NODE_ENV || "unknown";
  logger.warn(
    "\n" +
    "⚠️  ═══════════════════════════════════════════════════════════════\n" +
    "⚠️  SECURITY WARNING: ADMIN PERMISSION FALLBACK IS ENABLED\n" +
    "⚠️  \n" +
    "⚠️  This is a temporary migration feature that allows admin users\n" +
    "⚠️  to bypass RBAC permission checks.\n" +
    "⚠️  \n" +
    "⚠️  Current Environment: " + env + "\n" +
    "⚠️  \n" +
    "⚠️  ⚠️  DO NOT USE IN PRODUCTION! ⚠️\n" +
    "⚠️  \n" +
    "⚠️  To disable:\n" +
    "⚠️    - Set NODE_ENV=production\n" +
    "⚠️    - Remove RBAC_ADMIN_FALLBACK environment variable\n" +
    "⚠️    - Or remove the fallback code entirely\n" +
    "⚠️  \n" +
    "⚠️  ═══════════════════════════════════════════════════════════════\n"
  );

  // Also log to console for visibility
  console.warn("⚠️  SECURITY: Admin fallback is ENABLED in", env, "environment!");
}

// Global reference to autoUpdater instance for menu access
let autoUpdaterInstance: ReturnType<typeof autoUpdater> | null = null;

export function getAutoUpdaterInstance() {
  return autoUpdaterInstance;
}

export async function initApp(initConfig: AppInitConfig) {
  // Register IPC handlers
  registerLoggerHandlers();
  registerVatCategoryIpc();
  registerBookerImportHandlers();
  
  // Initialize database
  const db = await getDatabase();

  // Initialize thermal printer service after database is ready
  await import("./services/thermalPrinterService.js");

  // Initialize office printer service for HP LaserJet and similar printers
  await import("./services/officePrinterService.js");

  // Initialize PDF receipt generation service
  await import("./services/pdfReceiptService.js");

  // Initialize payment service for BBPOS WisePad 3
  await import("./services/paymentService.js");

  // Initialize scale hardware service for weight measurement
  await import("./services/scaleService.js");

  // Initialize expiry notification service
  const { ExpiryNotificationService } = await import(
    "./services/expiryNotificationService.js"
  );
  const expiryService = new ExpiryNotificationService(db);

  // Helper function to handle auto-closing shifts and clocking out TimeShifts
  const handleAutoCloseShifts = async () => {
    try {
      const closedShifts = db.shifts.autoCloseOldActiveShifts();
      
      if (closedShifts.length > 0) {
        // Group closed shifts by timeShiftId to check if we need to clock out
        const timeShiftGroups = new Map<string, Array<{ id: string; cashierId: string }>>();
        
        for (const closedShift of closedShifts) {
          if (closedShift.timeShiftId && closedShift.timeShiftId.trim() !== "") {
            if (!timeShiftGroups.has(closedShift.timeShiftId)) {
              timeShiftGroups.set(closedShift.timeShiftId, []);
            }
            timeShiftGroups.get(closedShift.timeShiftId)!.push({
              id: closedShift.id,
              cashierId: closedShift.cashierId,
            });
          }
        }
        
        // For each TimeShift, check if all POS shifts are now closed
        for (const [timeShiftId, closedPosShifts] of timeShiftGroups.entries()) {
          const remainingActiveShifts = db.shifts.getActiveShiftsByTimeShift(timeShiftId);
          
          if (remainingActiveShifts.length === 0) {
            // All POS shifts for this TimeShift are closed, clock out TimeShift
            const timeShift = db.timeTracking.getShiftById(timeShiftId);
            if (timeShift && timeShift.status === "active") {
              // Validate cashierId before clock-out
              const cashierId = closedPosShifts[0]?.cashierId;
              if (!cashierId) {
                logger.error(
                  `Cannot clock out TimeShift ${timeShiftId}: closed shifts have no cashierId`
                );
              } else {
                try {
                  // End any active breaks
                  const activeBreak = db.timeTracking.getActiveBreak(timeShiftId);
                  if (activeBreak) {
                    await db.timeTracking.endBreak(activeBreak.id);
                  }

                  // Create clock-out event
                  const clockOutEvent = await db.timeTracking.createClockEvent({
                    userId: cashierId,
                    terminalId: "system",
                    type: "out",
                    method: "auto",
                    notes: "Auto clock-out: All POS shifts auto-closed",
                  });

                  // Complete the TimeShift
                  await db.timeTracking.completeShift(timeShiftId, clockOutEvent.id);

                  logger.info(
                    `Auto clocked out TimeShift ${timeShiftId} after all POS shifts were auto-closed`
                  );
                } catch (error) {
                  logger.error(
                    `Failed to clock out TimeShift ${timeShiftId} after auto-closing shifts`,
                    error
                  );
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error("Error during shift cleanup", error);
    }
  };

  // Set up periodic cleanup of old unclosed shifts
  // Run cleanup every 30 minutes
  const cleanupInterval = setInterval(() => {
    handleAutoCloseShifts();
  }, 30 * 60 * 1000); // 30 minutes

  // Set up daily expiry checks and notifications
  // Run expiry checks every 6 hours
  const expiryCheckInterval = setInterval(async () => {
    try {
      // Process expiry tasks for all businesses
      // In a multi-tenant system, you'd iterate through businesses
      // For now, we'll process when explicitly called via IPC
      logger.debug("Expiry check scheduled (use IPC to trigger)");
    } catch (error) {
      logger.error("Error during expiry check", error);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours

  // Clean up on app exit
  process.on("exit", () => {
    clearInterval(cleanupInterval);
    clearInterval(expiryCheckInterval);
  });

  // Run cleanup immediately on startup
  handleAutoCloseShifts();

  // Run initial expiry check on startup
  try {
    // Auto-update expired batches for all businesses
    await db.batches.autoUpdateExpiredBatches();
  } catch (error) {
    logger.error("Error during startup expiry check", error);
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
