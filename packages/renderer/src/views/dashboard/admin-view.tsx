import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { DashboardLayout } from "@/layouts/dashboard-layout";
import { ViewTransitionContainer } from "@/shared/components";
import { useViewNavigation, useViewMap } from "@/shared/hooks";

import { useAuth } from "@/shared/hooks";

import { getRoleDisplayName, getUserDisplayName } from "@/shared/utils/auth";

import {
  ADMIN_VIEWS,
  type AdminView,
  createAdminViewDefinitions,
} from "./view-definitions";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentView, navigateTo } = useViewNavigation<AdminView>(
    "dashboard",
    ADMIN_VIEWS
  );

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const views = useViewMap(createAdminViewDefinitions, navigateTo);

  if (!user) return null;

  return (
    <DashboardLayout
      title={`${getRoleDisplayName(user.role)} Dashboard`}
      subtitle={`Welcome, ${getUserDisplayName(user)}`}
    >
      <ViewTransitionContainer currentView={currentView} views={views} />
    </DashboardLayout>
  );
};
