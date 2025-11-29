import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/use-auth";
import { LoadingScreen } from "./loading-screen";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
