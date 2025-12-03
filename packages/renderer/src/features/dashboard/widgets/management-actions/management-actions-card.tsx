/**
 * Management Actions Feature Card
 *
 * Dedicated component for the Management Actions feature.
 * Handles navigation injection for management operations.
 */

import { FeatureCard } from "@/features/dashboard/components/feature-card";
import { getFeatureById } from "@/features/dashboard/registry/feature-registry";
import type { FeatureConfig } from "@/features/dashboard/types/feature-config";

interface ManagementActionsCardProps {
  onNewSale?: () => void;
  onApplyDiscount?: () => void;
  onManageInventory?: () => void;
  onManageCashiers?: () => void;
  onStaffSchedules?: () => void;
}

export function ManagementActionsCard({
  onNewSale,
  onApplyDiscount,
  onManageInventory,
  onManageCashiers,
  onStaffSchedules,
}: ManagementActionsCardProps) {
  const feature = getFeatureById("management-actions");
  if (!feature) return null;

  // Inject navigation handlers into feature actions
  const featureWithHandlers: FeatureConfig = {
    ...feature,
    actions: feature.actions.map((action) => ({
      ...action,
      onClick: () => {
        switch (action.id) {
          case "new-sale":
            onNewSale?.();
            break;
          case "apply-discount":
            onApplyDiscount?.();
            break;
          case "manage-inventory":
            onManageInventory?.();
            break;
          case "manage-cashiers":
            onManageCashiers?.();
            break;
          case "staff-schedules":
            onStaffSchedules?.();
            break;
          default:
            action.onClick();
        }
      },
    })),
  };

  return <FeatureCard feature={featureWithHandlers} />;
}
