/**
 * Dashboard View
 *
 * Main dashboard entry point using the new navigation system.
 * Wraps the application with NavigationProvider and renders NavigationContainer.
 */

import { NavigationProvider, NavigationContainer } from "@/navigation";
import { useAuth } from "@/shared/hooks";
import { LoadingScreen } from "@/components/loading-screen";

export default function DashboardView() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  return (
    <NavigationProvider initialView="dashboard">
      <NavigationContainer />
    </NavigationProvider>
  );
}

