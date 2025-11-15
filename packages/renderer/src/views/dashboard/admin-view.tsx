import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardLayout } from "@/layouts/dashboard-layout";

import { AdminDashboardView } from "@/features/sales/components/admin-dashboard-view";
import UserManagementView from "@/features/users/components/user-management-view";
import { getRoleDisplayName, getUserDisplayName } from "@/shared/utils/auth";
import { useAuth } from "@/shared/hooks";

export const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState<
    "dashboard" | "userManagement"
  >("dashboard");

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);
  if (!user) return null;
  const viewMap: Record<string, React.ReactNode> = {
    dashboard: (
      <AdminDashboardView onFront={() => setCurrentView("userManagement")} />
    ),
    userManagement: (
      <UserManagementView onBack={() => setCurrentView("dashboard")} />
    ),
  };

  return (
    <DashboardLayout
      title={`${getRoleDisplayName(user.role)} Dashboard`}
      subtitle={`Welcome, ${getUserDisplayName(user)}`}
    >
      <div className="grid gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{
              x: currentView === "dashboard" ? 300 : -300,
              opacity: 0,
            }}
            animate={{ x: 0, opacity: 1 }}
            exit={{
              x: currentView === "dashboard" ? -300 : 300,
              opacity: 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            {viewMap[currentView] || null}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};
