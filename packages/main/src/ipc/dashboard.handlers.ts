// Dashboard Statistics IPC Handlers
import { ipcMain } from "electron";
import { getDatabase } from "../database/index.js";
import { getLogger } from "../utils/logger.js";
import { validateSessionAndPermission } from "../utils/authHelpers.js";
import { PERMISSIONS } from "@app/shared/constants/permissions";

const logger = getLogger("dashboardHandlers");
let db: any = null;

export function registerDashboardHandlers() {
  /**
   * Get dashboard statistics including revenue, sales count, and other metrics
   */
  ipcMain.handle(
    "dashboard:getStatistics",
    async (event, sessionToken, businessId) => {
      try {
        if (!db) db = await getDatabase();

        // Validate session and check REPORTS_READ permission
        const auth = await validateSessionAndPermission(
          db,
          sessionToken,
          PERMISSIONS.REPORTS_READ
        );

        if (!auth.success) {
          return { success: false, message: auth.message, code: auth.code };
        }

        // Get revenue statistics for current month vs previous month
        const revenueStats = db.transactions.getRevenueStatistics(
          businessId,
          "month"
        );

        // Get today's sales count
        const todaySalesCount = db.transactions.getTodaySalesCount(businessId);

        // Get average order value for current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const avgOrderValue = db.transactions.getAverageOrderValue(
          businessId,
          monthStart,
          now
        );

        return {
          success: true,
          data: {
            revenue: {
              current: revenueStats.currentPeriod,
              previous: revenueStats.previousPeriod,
              change: revenueStats.change,
              changePercent: revenueStats.changePercent,
            },
            salesToday: todaySalesCount,
            averageOrderValue: avgOrderValue,
          },
        };
      } catch (error) {
        logger.error("Get dashboard statistics IPC error:", error);
        return {
          success: false,
          message: "Failed to get dashboard statistics",
        };
      }
    }
  );
}
