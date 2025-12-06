/**
 * Main Application Component
 *
 * Now uses only the custom navigation system.
 * No React Router - cleaner architecture with single navigation system.
 */

import { NavigationProvider } from "@/navigation";
import { AppShell } from "./app-shell";
import { AUTH_ROUTES } from "@/features/auth/config/navigation";

export default function App() {
  return (
    <NavigationProvider initialView={AUTH_ROUTES.AUTH}>
      <AppShell />
    </NavigationProvider>
  );
}
