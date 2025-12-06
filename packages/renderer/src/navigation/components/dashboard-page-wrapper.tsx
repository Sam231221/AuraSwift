/**
 * Dashboard Page Wrapper
 *
 * Wrapper component that renders the appropriate dashboard page
 * based on user role. Uses the new navigation system.
 */

import { useAuth } from "@/shared/hooks";
import { getUserRoleName } from "@/shared/utils/rbac-helpers";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";
import { getRoleDisplayName, getUserDisplayName } from "@/shared/utils/auth";
import {
  AdminDashboardView,
  CashierDashboardView,
  ManagerDashboardView,
} from "@/features/dashboard";
import { USERS_ROUTES } from "@/features/users/config/navigation";
import { SALES_ROUTES } from "@/features/sales/config/navigation";

import { useNavigation } from "../hooks/use-navigation";
import { useDashboardNavigation } from "../hooks/use-dashboard-navigation";
import { LoadingScreen } from "@/components/loading-screen";

/**
 * Dashboard Page Wrapper
 *
 * Renders role-specific dashboard pages using the navigation system.
 * All dashboard pages receive navigation functions via the navigation hook.
 */
export default function DashboardPageWrapper() {
  const { user, isInitializing } = useAuth();
  const { navigateTo } = useNavigation();

  // Dashboard navigation handler for feature actions
  // Must be called before any early returns (React Hooks rule)
  const handleActionClick = useDashboardNavigation();

  // Only show loading during initial auth initialization
  // Once initialized, if no user exists, it means they're not authenticated
  // (route protection should prevent this, but we handle it gracefully)
  if (isInitializing) {
    return <LoadingScreen />;
  }

  // If not initializing and no user, show unauthorized
  // This shouldn't happen due to route protection, but provides safety
  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Unauthorized</h2>
          <p className="text-muted-foreground">
            Please log in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  const role = getUserRoleName(user);
  const roleDisplayName = getRoleDisplayName(role);
  const userDisplayName = getUserDisplayName(user);

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
            onFront={() => navigateTo(USERS_ROUTES.MANAGEMENT)}
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
            onNewTransaction={() =>
              handleNavigate(SALES_ROUTES.NEW_TRANSACTION)
            }
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
