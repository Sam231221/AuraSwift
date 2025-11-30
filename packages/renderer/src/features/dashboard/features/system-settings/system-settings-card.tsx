/**
 * System Settings Feature Card
 * 
 * Dedicated component for the System Settings feature.
 * Handles navigation injection for settings actions.
 */

import { FeatureCard } from "../../components/feature-card";
import { getFeatureById } from "../../registry/feature-registry";
import type { FeatureConfig } from "../../types/feature-config";

interface SystemSettingsCardProps {
  onGeneralSettings?: () => void;
  onStoreConfiguration?: () => void;
  onSecuritySettings?: () => void;
}

export function SystemSettingsCard({
  onGeneralSettings,
  onStoreConfiguration,
  onSecuritySettings,
}: SystemSettingsCardProps) {
  const feature = getFeatureById("system-settings");
  if (!feature) return null;

  // Inject navigation handlers into feature actions
  const featureWithHandlers: FeatureConfig = {
    ...feature,
    actions: feature.actions.map((action) => ({
      ...action,
      onClick: () => {
        switch (action.id) {
          case "general-settings":
            onGeneralSettings?.();
            break;
          case "store-configuration":
            onStoreConfiguration?.();
            break;
          case "security-settings":
            onSecuritySettings?.();
            break;
          default:
            action.onClick();
        }
      },
    })),
  };

  return <FeatureCard feature={featureWithHandlers} />;
}

