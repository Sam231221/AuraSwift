/**
 * Database Management Feature Card
 * 
 * Dedicated component for the Database Management feature.
 * Handles navigation injection for database operations.
 */

import { FeatureCard } from "@/features/dashboard/components/feature-card";
import { getFeatureById } from "@/features/dashboard/registry/feature-registry";
import type { FeatureConfig } from "@/features/dashboard/types/feature-config";

interface DatabaseManagementCardProps {
  onImportDatabase?: () => void;
  onBackupDatabase?: () => void;
  onEmptyDatabase?: () => void;
}

export function DatabaseManagementCard({
  onImportDatabase,
  onBackupDatabase,
  onEmptyDatabase,
}: DatabaseManagementCardProps) {
  const feature = getFeatureById("database-management");
  if (!feature) return null;

  // Inject navigation handlers into feature actions
  const featureWithHandlers: FeatureConfig = {
    ...feature,
    actions: feature.actions.map((action) => ({
      ...action,
      onClick: () => {
        switch (action.id) {
          case "import-database":
            onImportDatabase?.();
            break;
          case "backup-database":
            onBackupDatabase?.();
            break;
          case "empty-database":
            onEmptyDatabase?.();
            break;
          default:
            action.onClick();
        }
      },
    })),
  };

  return <FeatureCard feature={featureWithHandlers} />;
}

