/**
 * Quick Actions Feature Card
 * 
 * Dedicated component for the Quick Actions feature.
 * Handles navigation injection for quick action operations.
 */

import { FeatureCard } from "../../components/feature-card";
import { getFeatureById } from "../../registry/feature-registry";
import type { FeatureConfig } from "../../types/feature-config";

interface QuickActionsCardProps {
  onNewSale?: () => void;
  onManageUsers?: () => void;
}

export function QuickActionsCard({
  onNewSale,
  onManageUsers,
}: QuickActionsCardProps) {
  const feature = getFeatureById("quick-actions");
  if (!feature) return null;

  // Inject navigation handlers into feature actions
  const featureWithHandlers: FeatureConfig = {
    ...feature,
    actions: feature.actions.map((action) => ({
      ...action,
      onClick: () => {
        switch (action.id) {
          case "quick-new-sale":
            onNewSale?.();
            break;
          case "quick-manage-users":
            onManageUsers?.();
            break;
          default:
            action.onClick();
        }
      },
    })),
  };

  return <FeatureCard feature={featureWithHandlers} />;
}

