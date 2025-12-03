/**
 * User Management Feature Card
 * 
 * Dedicated component for the User Management feature.
 * Handles navigation injection for user management actions.
 */

import { FeatureCard } from "@/features/dashboard/components/feature-card";
import { getFeatureById } from "@/features/dashboard/registry/feature-registry";
import type { FeatureConfig } from "@/features/dashboard/types/feature-config";

interface UserManagementCardProps {
  onManageUsers: () => void;
  onRolePermissions: () => void;
  onUserRoleAssignment: () => void;
}

export function UserManagementCard({
  onManageUsers,
  onRolePermissions,
  onUserRoleAssignment,
}: UserManagementCardProps) {
  const feature = getFeatureById("user-management");
  if (!feature) return null;

  // Inject navigation handlers into feature actions
  const featureWithHandlers: FeatureConfig = {
    ...feature,
    actions: feature.actions.map((action) => ({
      ...action,
      onClick: () => {
        switch (action.id) {
          case "manage-users":
            onManageUsers();
            break;
          case "role-permissions":
            onRolePermissions();
            break;
          case "user-role-assignment":
            onUserRoleAssignment();
            break;
          default:
            action.onClick();
        }
      },
    })),
  };

  return <FeatureCard feature={featureWithHandlers} />;
}

