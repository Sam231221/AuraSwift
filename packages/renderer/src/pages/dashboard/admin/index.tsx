import { DashboardLayout } from "@/layouts/dashboard-layout";
import { motion, AnimatePresence } from "framer-motion";
import { getRoleDisplayName, getUserDisplayName } from "@/shared/utils/auth";

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AdminDashboardView } from "./features/admin-dashboard-view";
import UserManagementView from "./features/user-management-view";
import { useAuth } from "@/shared/hooks";

export const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState<
    "dashboard" | "userManagement"
  >("dashboard");

  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/");
    return null;
  }
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
            {currentView === "dashboard" ? (
              <AdminDashboardView
                onFront={() => setCurrentView("userManagement")}
              />
            ) : currentView === "userManagement" ? (
              <UserManagementView onBack={() => setCurrentView("dashboard")} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};
