import { DashboardLayout } from "@/layouts/dashboard-layout";
import { motion, AnimatePresence } from "framer-motion";
import { getRoleDisplayName, getUserDisplayName } from "@/shared/utils/auth";

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ManagerDashboardView } from "./features/manager-dashboard-view";
import ProductManagementView from "./features/manage-product-view";
import CashierManagementView from "./features/manage-cashier-view";
import { useAuth } from "@/shared/hooks";

const ManagerDashboard = () => {
  const [currentView, setCurrentView] = useState<
    "dashboard" | "cashierManagement" | "productDashboard"
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
              <ManagerDashboardView
                onManageCashiers={() => setCurrentView("cashierManagement")}
                onManageProducts={() => setCurrentView("productDashboard")}
              />
            ) : currentView === "productDashboard" ? (
              <ProductManagementView
                onBack={() => setCurrentView("dashboard")}
              />
            ) : currentView === "cashierManagement" ? (
              <CashierManagementView
                onBack={() => setCurrentView("dashboard")}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};
export default ManagerDashboard;
