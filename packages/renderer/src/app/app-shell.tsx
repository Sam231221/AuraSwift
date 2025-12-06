/**
 * Application Shell
 *
 * Handles the top-level routing between auth and dashboard
 * using the custom navigation system.
 */

import { useEffect } from "react";
import { NavigationContainer } from "@/navigation";
import { useAuth } from "@/shared/hooks";
import { LoadingScreen } from "@/components/loading-screen";
import { useNavigation } from "@/navigation/hooks/use-navigation";
import { AUTH_ROUTES } from "@/features/auth/config/navigation";

export function AppShell() {
  const { user, isInitializing } = useAuth();
  const { navigateTo, currentViewId } = useNavigation();

  // Handle automatic navigation based on auth state
  useEffect(() => {
    if (isInitializing) return;

    // If user is logged in and on auth page, redirect to dashboard
    if (user && currentViewId === AUTH_ROUTES.AUTH) {
      navigateTo("dashboard");
      return;
    }

    // If user is logged out and not on auth page, redirect to auth
    if (!user && currentViewId !== AUTH_ROUTES.AUTH) {
      navigateTo(AUTH_ROUTES.AUTH);
      return;
    }
  }, [user, isInitializing, currentViewId, navigateTo]);

  // Show loading screen during initial auth check
  if (isInitializing) {
    return <LoadingScreen />;
  }

  // Render the current view
  return <NavigationContainer />;
}
