/**
 * View Wrapper
 *
 * Generic wrapper component that adds navigation functionality
 * to views that expect onBack callback props.
 * Now supports lazy loading with error boundaries.
 */

import { useNavigation } from "../hooks/use-navigation";
import { LazyComponentLoader } from "../utils/lazy-component-loader";
import { ViewErrorBoundary } from "./view-error-boundary";
import type { ViewConfig, ViewComponentProps } from "../types/navigation.types";

interface ViewWrapperProps {
  config: ViewConfig;
  params?: Record<string, unknown>;
  onBack?: () => void;
  embeddedInDashboard?: boolean;
}

/**
 * View Wrapper Component
 *
 * Wraps view components and handles lazy loading, error boundaries, and prop injection.
 */
export function ViewWrapper({
  config,
  params = {},
  onBack,
  embeddedInDashboard = false,
}: ViewWrapperProps) {
  const { goBack: navigationGoBack } = useNavigation();
  const handleBack = onBack || navigationGoBack;

  const props: ViewComponentProps = {
    onBack: handleBack,
    embeddedInDashboard,
    ...params,
  };

  return (
    <ViewErrorBoundary viewId={config.id}>
      <LazyComponentLoader config={config} props={props} />
    </ViewErrorBoundary>
  );
}
