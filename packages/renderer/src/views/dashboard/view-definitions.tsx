import { type ReactNode } from "react";

import AdminDashboardPage from "./pages/admin/admin-dashboard-page";
import CashierDashboardPage from "./pages/cashier/cashier-dashboard-page";
import ManagerDashboardPage from "./pages/manager/manager-dashboard-page";
import NewTransactionView from "./pages/cashier/new-transaction";
import UserManagementView from "@/features/users/components/user-management-view";
import StaffSchedulesView from "@/features/users/components/staff-schedules-view";
import CashierManagementView from "@/features/users/components/manage-cashier-view";
import ProductManagementView from "@/features/products/components/manage-product-view";

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
