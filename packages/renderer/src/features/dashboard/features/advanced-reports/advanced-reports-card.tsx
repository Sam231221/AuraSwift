/**
 * Advanced Reports Feature Card
 * 
 * Dedicated component for the Advanced Reports feature.
 * Handles navigation injection for advanced report actions.
 */

import { FeatureCard } from "../../components/feature-card";
import { getFeatureById } from "../../registry/feature-registry";
import type { FeatureConfig } from "../../types/feature-config";

interface AdvancedReportsCardProps {
  onFinancialReports?: () => void;
  onBusinessIntelligence?: () => void;
  onUserActivityLogs?: () => void;
}

export function AdvancedReportsCard({
  onFinancialReports,
  onBusinessIntelligence,
  onUserActivityLogs,
}: AdvancedReportsCardProps) {
  const feature = getFeatureById("advanced-reports");
  if (!feature) return null;

  // Inject navigation handlers into feature actions
  const featureWithHandlers: FeatureConfig = {
    ...feature,
    actions: feature.actions.map((action) => ({
      ...action,
      onClick: () => {
        switch (action.id) {
          case "financial-reports":
            onFinancialReports?.();
            break;
          case "business-intelligence":
            onBusinessIntelligence?.();
            break;
          case "user-activity-logs":
            onUserActivityLogs?.();
            break;
          default:
            action.onClick();
        }
      },
    })),
  };

  return <FeatureCard feature={featureWithHandlers} />;
}

