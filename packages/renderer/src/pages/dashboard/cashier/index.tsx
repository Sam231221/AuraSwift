import { useAuth } from "@/shared/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLayout } from "@/layouts/dashboard-layout";

import { getRoleDisplayName, getUserDisplayName } from "@/shared/utils/auth";
import { useNavigate } from "react-router-dom";

import { useState } from "react";

import NewTransactionView from "./features/new-transaction-view";
import CashierDashboardView from "./features/cashier-dashboard-view";

export default function CashierDashboard() {
  const [currentView, setCurrentView] = useState<
    "dashboard" | "newTransaction"
  >("dashboard");

  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/");
    return;
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
              <CashierDashboardView
                onNewTransaction={() => setCurrentView("newTransaction")}
              />
            ) : currentView === "newTransaction" ? (
              <NewTransactionView onBack={() => setCurrentView("dashboard")} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
