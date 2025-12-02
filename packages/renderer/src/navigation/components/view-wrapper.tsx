/**
 * View Wrapper
 *
 * Generic wrapper component that adds navigation functionality
 * to views that expect onBack callback props.
 */

import { useNavigation } from "../hooks/use-navigation";
import type { ComponentType } from "react";

interface ViewWrapperProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  embeddedInDashboard?: boolean;
}

/**
 * View Wrapper
 *
 * Wraps a view component and provides navigation functionality
 * via the navigation hook, converting it to onBack prop.
 */
export function ViewWrapper({
  component: Component,
  embeddedInDashboard = false,
}: ViewWrapperProps) {
  const { goBack } = useNavigation();

  return <Component onBack={goBack} embeddedInDashboard={embeddedInDashboard} />;
}

