import { type ReactNode } from "react";

import AdminDashboardPage from "./pages/admin/views/admin-dashboard-page";
import CashierDashboardPage from "./pages/cashier/views/cashier-dashboard-page";
import ManagerDashboardPage from "./pages/manager/views/manager-dashboard-page";
import NewTransactionView from "./pages/cashier/views/new-transaction";
import ProductManagementView from "./pages/manager/views/stock/manage-product-view";

import UserManagementView from "@/views/dashboard/pages/admin/views/user-management-view";
import StaffSchedulesView from "@/views/dashboard/pages/manager/views/staff-schedules-view";
import CashierManagementView from "@/views/dashboard/pages/manager/views/manage-cashier-view";

export const ADMIN_VIEWS = ["dashboard", "userManagement"] as const;
export const CASHIER_VIEWS = ["dashboard", "newTransaction"] as const;
export const MANAGER_VIEWS = [
  "dashboard",
  "cashierManagement",
  "productDashboard",
  "staffSchedules",
] as const;
export type AdminView = (typeof ADMIN_VIEWS)[number];
export type CashierView = (typeof CASHIER_VIEWS)[number];
export type ManagerView = (typeof MANAGER_VIEWS)[number];

export function createAdminViewDefinitions(
  navigateTo: (view: AdminView) => void
): Record<AdminView, ReactNode> {
  return {
    dashboard: (
      <AdminDashboardPage onFront={() => navigateTo("userManagement")} />
    ),
    userManagement: (
      <UserManagementView onBack={() => navigateTo("dashboard")} />
    ),
  };
}

export function createCashierViewDefinitions(
  navigateTo: (view: CashierView) => void
): Record<CashierView, ReactNode> {
  return {
    dashboard: (
      <CashierDashboardPage
        onNewTransaction={() => navigateTo("newTransaction")}
      />
    ),
    newTransaction: (
      <NewTransactionView onBack={() => navigateTo("dashboard")} />
    ),
  };
}

export function createManagerViewDefinitions(
  navigateTo: (view: ManagerView) => void
): Record<ManagerView, ReactNode> {
  return {
    dashboard: (
      <ManagerDashboardPage
        onStaffSchedules={() => navigateTo("staffSchedules")}
        onManageCashiers={() => navigateTo("cashierManagement")}
        onManageProducts={() => navigateTo("productDashboard")}
      />
    ),
    productDashboard: (
      <ProductManagementView onBack={() => navigateTo("dashboard")} />
    ),
    cashierManagement: (
      <CashierManagementView onBack={() => navigateTo("dashboard")} />
    ),
    staffSchedules: (
      <StaffSchedulesView onBack={() => navigateTo("dashboard")} />
    ),
  };
}
