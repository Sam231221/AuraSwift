import { AuthProvider } from "@/features/auth";

interface AppProvidersProps {
  children: React.ReactNode;
}

import { UpdateToastProvider } from "@/features/updates/context/UpdateToastContext";

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <UpdateToastProvider>{children}</UpdateToastProvider>
    </AuthProvider>
  );
}
