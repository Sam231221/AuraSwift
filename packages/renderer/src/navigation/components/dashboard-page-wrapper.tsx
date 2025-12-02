/**
 * Dashboard Page Wrapper
 *
 * Wrapper component that renders the appropriate dashboard page
 * based on user role. Uses the new navigation system.
 */

import { useAuth } from "@/shared/hooks";
import { getUserRoleName } from "@/shared/utils/rbac-helpers";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { getRoleDisplayName, getUserDisplayName } from "@/shared/utils/auth";
import {
  AdminDashboardView,
  CashierDashboardView,
  ManagerDashboardView,
} from "@/features/dashboard";

import { useNavigation } from "../hooks/use-navigation";
import { useDashboardNavigation } from "../hooks/use-dashboard-navigation";
import { LoadingScreen } from "@/components/loading-screen";

/**
 * Dashboard Page Wrapper
 *
 * Renders role-specific dashboard pages using the navigation system.
 * All dashboard pages receive navigation functions via the navigation hook.
 */
export function DashboardPageWrapper() {
  const { user, isLoading } = useAuth();
  const { navigateTo } = useNavigation();

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  const role = getUserRoleName(user);
  const roleDisplayName = getRoleDisplayName(role);
  const userDisplayName = getUserDisplayName(user);

  // Dashboard navigation handler for feature actions
  const handleActionClick = useDashboardNavigation();

  // Navigation helper
  const handleNavigate = (viewId: string) => {
    navigateTo(viewId);
  };

  switch (role) {
    case "admin":
      return (
        <DashboardLayout
          title={`${roleDisplayName} Dashboard`}
          subtitle={`Welcome, ${userDisplayName}`}
        >
          <AdminDashboardView
            onFront={() => navigateTo("userManagement")}
            onActionClick={handleActionClick}
          />
        </DashboardLayout>
      );

    case "manager":
      return (
        <DashboardLayout
          title={`${roleDisplayName} Dashboard`}
          subtitle={`Welcome, ${userDisplayName}`}
        >
          <ManagerDashboardView onActionClick={handleActionClick} />
        </DashboardLayout>
      );

    case "cashier":
      return (
        <DashboardLayout
          title={`${roleDisplayName} Dashboard`}
          subtitle={`Welcome, ${userDisplayName}`}
        >
          <CashierDashboardView
            onNewTransaction={() => handleNavigate("newTransaction")}
          />
        </DashboardLayout>
      );

    default:
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Unauthorized</h2>
            <p className="text-muted-foreground">
              You don't have access to the dashboard.
            </p>
          </div>
        </div>
      );
  }
}
