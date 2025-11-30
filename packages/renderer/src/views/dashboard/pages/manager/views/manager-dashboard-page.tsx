import { DashboardGrid, FEATURE_REGISTRY } from "@/features/dashboard";
import { ManagerStatsCards } from "@/features/dashboard/components/stats-cards";

const ManagerDashboardPage = ({
  onStaffSchedules,
  onManageProducts,
  onManageCashiers,
  onNewTransaction,
}: {
  onStaffSchedules: () => void;
  onManageProducts: () => void;
  onManageCashiers: () => void;
  onNewTransaction?: () => void;
}) => {
  // Handle feature action clicks
  const handleActionClick = (featureId: string, actionId: string) => {
    console.log(
      `[ManagerDashboard] handleActionClick: ${featureId} -> ${actionId}`
    );

    switch (featureId) {
      case "management-actions":
        if (actionId === "new-sale") {
          console.log("[ManagerDashboard] Calling onNewTransaction()");
          onNewTransaction?.();
        } else if (actionId === "manage-inventory") {
          console.log("[ManagerDashboard] Calling onManageProducts()");
          onManageProducts();
        } else if (actionId === "manage-cashiers") {
          console.log("[ManagerDashboard] Calling onManageCashiers()");
          onManageCashiers();
        } else if (actionId === "staff-schedules") {
          console.log("[ManagerDashboard] Calling onStaffSchedules()");
          onStaffSchedules();
        }
        // Other actions (void-transaction, apply-discount) can be handled when implemented
        break;

      default:
        console.warn(
          `[ManagerDashboard] Unhandled feature: ${featureId}, action: ${actionId}`
        );
        break;
    }
  };

  // Filter features for manager dashboard (exclude admin-only features)
  const managerFeatures = FEATURE_REGISTRY.filter(
    (feature) =>
      feature.id !== "database-management" &&
      feature.id !== "advanced-reports" &&
      feature.id !== "system-settings" &&
      feature.id !== "quick-actions"
  );

  return (
    <div className="grid gap-4 sm:gap-6">
      {/* Manager Stats */}
      <ManagerStatsCards />

      {/* Manager Features - Permission-based rendering */}
      <DashboardGrid
        features={managerFeatures}
        onActionClick={handleActionClick}
      />
    </div>
  );
};

export default ManagerDashboardPage;
