import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "@/layouts/dashboard-layout";
import { ViewTransitionContainer } from "@/components";
import { useViewNavigation, useViewMap } from "@/shared/hooks";

import { useAuth } from "@/shared/hooks";

import { getRoleDisplayName, getUserDisplayName } from "@/shared/utils/auth";
import { getUserRoleName } from "@/shared/utils/rbac-helpers";

import {
  CASHIER_VIEWS,
  type CashierView,
  createCashierViewDefinitions,
} from "./view-definitions";

export const CashierDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentView, navigateTo } = useViewNavigation<CashierView>(
    "newTransaction",
    CASHIER_VIEWS
  );

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const views = useViewMap(createCashierViewDefinitions, navigateTo);

  if (!user) return null;

  return (
    <>
      <ViewTransitionContainer currentView={currentView} views={views} />
    </>
  );
};
