/**
 * Reports & Analytics Feature Card
 * 
 * Dedicated component for the Reports & Analytics feature.
 * Handles navigation injection for report actions.
 */

import { FeatureCard } from "../../components/feature-card";
import { getFeatureById } from "../../registry/feature-registry";
import type { FeatureConfig } from "../../types/feature-config";

interface ReportsAnalyticsCardProps {
  onSalesReports?: () => void;
  onPerformanceAnalytics?: () => void;
  onInventoryReports?: () => void;
  onStaffReports?: () => void;
}

export function ReportsAnalyticsCard({
  onSalesReports,
  onPerformanceAnalytics,
  onInventoryReports,
  onStaffReports,
}: ReportsAnalyticsCardProps) {
  const feature = getFeatureById("reports-analytics");
  if (!feature) return null;

  // Inject navigation handlers into feature actions
  const featureWithHandlers: FeatureConfig = {
    ...feature,
    actions: feature.actions.map((action) => ({
      ...action,
      onClick: () => {
        switch (action.id) {
          case "sales-reports":
            onSalesReports?.();
            break;
          case "performance-analytics":
            onPerformanceAnalytics?.();
            break;
          case "inventory-reports":
            onInventoryReports?.();
            break;
          case "staff-reports":
            onStaffReports?.();
            break;
          default:
            action.onClick();
        }
      },
    })),
  };

  return <FeatureCard feature={featureWithHandlers} />;
}

