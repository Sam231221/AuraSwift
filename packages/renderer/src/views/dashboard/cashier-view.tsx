import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import NewTransactionView from "@/features/transactions/components/new-transaction-view";
import CashierDashboardView from "@/features/sales/components/cashier-dashboard-view";
import { useAuth } from "@/shared/hooks/use-auth";

export default function CashierDashboard() {
  const [currentView, setCurrentView] = useState<
    "dashboard" | "newTransaction"
  >("newTransaction");

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);
  if (!user) return null;

  return (
    <>
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
    </>
  );
}
