import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/shared/hooks";
import { getRoleDisplayName, getUserDisplayName } from "@/shared/utils/auth";

import { DashboardLayout } from "@/layouts/dashboard-layout";
import { ManagerDashboardView } from "@/features/sales/components/manager-dashboard-view";
import ProductManagementView from "@/features/products/components/manage-product-view";
import CashierManagementView from "@/features/users/components/manage-cashier-view";
import StaffSchedulesView from "@/features/users/components/staff-schedules-view";

const ManagerDashboard = () => {
  const [currentView, setCurrentView] = useState<
    | "dashboard"
    | "cashierManagement"
    | "productDashboard"
    | "productManagement"
    | "staffSchedules"
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
      <ManagerDashboardView
        onStaffSchedules={() => setCurrentView("staffSchedules")}
        onManageCashiers={() => setCurrentView("cashierManagement")}
        onManageProducts={() => setCurrentView("productDashboard")}
      />
    ),
    productDashboard: (
      <ProductManagementView onBack={() => setCurrentView("dashboard")} />
    ),
    cashierManagement: (
      <CashierManagementView onBack={() => setCurrentView("dashboard")} />
    ),
    staffSchedules: (
      <StaffSchedulesView onBack={() => setCurrentView("dashboard")} />
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
export default ManagerDashboard;
