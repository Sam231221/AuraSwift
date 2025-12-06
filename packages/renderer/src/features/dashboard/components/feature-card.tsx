/**
 * FeatureCard Component
 *
 * Base component for rendering dashboard feature cards.
 * Automatically handles permission-based visibility and action rendering.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFeatureVisibility } from "../hooks/use-feature-visibility";
import { useUserPermissions } from "../hooks/use-user-permissions";
import type { FeatureConfig } from "../types/feature-config";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("feature-card");

interface FeatureCardProps {
  feature: FeatureConfig;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const isVisible = useFeatureVisibility(feature);
  const { hasAnyPermission } = useUserPermissions();

  // Don't render if feature is not visible
  if (!isVisible) return null;

  const Icon = feature.icon;

  return (
    <Card className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Icon className="w-5 h-5 shrink-0" />
          {feature.title}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {feature.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {feature.actions.map((action) => {
          const ActionIcon = action.icon;

          // Check if user has permission for this specific action
          const hasActionPermission = action.permissions
            ? hasAnyPermission(action.permissions)
            : true;

          // Don't render action if user doesn't have permission
          if (!hasActionPermission) return null;

          return (
            <Button
              key={action.id}
              className="w-full justify-start text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              variant={action.variant || "outline"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Call the action's onClick handler (injected by DashboardGrid with navigation)
                // This handler calls onActionClick(featureId, actionId) which triggers navigation
                if (action.onClick) {
                  action.onClick();
                }
                // No onClick handler - action may be handled elsewhere
              }}
              disabled={action.disabled}
            >
              <ActionIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
              {action.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
