/**
 * Dashboard View
 *
 * Main dashboard entry point using the new navigation system.
 * Now just exports the dashboard page wrapper directly.
 * NavigationProvider is handled at the App level.
 *
 * Note: Auth checks are handled by AppShell.
 */

import DashboardPageWrapper from "@/navigation/components/dashboard-page-wrapper";

export default function DashboardView() {
  return <DashboardPageWrapper />;
}
