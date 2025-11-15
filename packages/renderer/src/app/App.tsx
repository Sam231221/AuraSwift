import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { ProtectedRoute, PublicRoute } from "@/shared/components";
import AuthPage from "@/views/auth";
import DashboardPage from "@/views/dashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />

        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
