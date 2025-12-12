/**
 * StatsCards Component
 *
 * Reusable stats cards component with permission-based visibility.
 * Displays key metrics based on user permissions.
 * Now includes dynamic data from backend for revenue and sales metrics.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
} from "lucide-react";
import { useUserPermissions } from "../hooks/use-user-permissions";
import { useDashboardStatistics } from "../hooks/use-dashboard-statistics";
import { PERMISSIONS } from "@app/shared/constants/permissions";

interface StatsCardsProps {
  className?: string;
}

/**
 * Format currency value in GBP (British Pounds)
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage change
 */
function formatPercentageChange(changePercent: number): string {
  const sign = changePercent >= 0 ? "+" : "";
  return `${sign}${changePercent.toFixed(1)}%`;
}

export function StatsCards({ className = "" }: StatsCardsProps) {
  const { hasPermission, isLoading: permissionsLoading } = useUserPermissions();
  const { statistics, isLoading: statisticsLoading } = useDashboardStatistics();

  const isLoading = permissionsLoading || statisticsLoading;

  // Build stats array with dynamic data
  const stats = [
    {
      id: "revenue",
      title: "Total Revenue",
      value: statistics ? formatCurrency(statistics.revenue.current) : "£0.00",
      change: statistics
        ? `${formatPercentageChange(
            statistics.revenue.changePercent
          )} from last month`
        : "Loading...",
      icon: DollarSign,
      permission: PERMISSIONS.REPORTS_READ,
      isLoading: statisticsLoading,
    },
    {
      id: "avg-order-value",
      title: "Average Order Value",
      value: statistics
        ? formatCurrency(statistics.averageOrderValue.current)
        : "£0.00",
      change: statistics
        ? `${formatPercentageChange(
            statistics.averageOrderValue.changePercent
          )} from last month`
        : "Loading...",
      icon: TrendingUp,
      permission: PERMISSIONS.REPORTS_READ,
      isLoading: statisticsLoading,
    },
    {
      id: "sales-today",
      title: "Sales Today",
      value: statistics ? statistics.salesToday.toString() : "0",
      change: statistics ? `Transactions completed` : "Loading...",
      icon: ShoppingCart,
      permission: PERMISSIONS.REPORTS_READ,
      isLoading: statisticsLoading,
    },
    {
      id: "alerts",
      title: "Alerts",
      value: "2", // TODO: Make this dynamic when alerts system is available
      change: "Require attention",
      icon: AlertTriangle,
      permission: PERMISSIONS.REPORTS_READ,
      isLoading: false,
    },
  ];

  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}
      >
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const visibleStats = stats.filter((stat) => hasPermission(stat.permission));

  if (visibleStats.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}
    >
      {visibleStats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.id}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  stat.change
                )}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Manager Stats Cards
 *
 * Specialized stats cards for manager dashboard.
 */
export const ManagerStatsCards = ({ className = "" }: StatsCardsProps) => {
  const { hasPermission, isLoading } = useUserPermissions();

  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}
      >
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-3 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-6 w-24 bg-muted rounded mb-1" />
              <div className="h-2 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      id: "weekly-revenue",
      title: "Weekly Revenue",
      value: "$8,642.30",
      change: "+18% from last week",
      icon: DollarSign,
      permission: PERMISSIONS.REPORTS_READ,
    },
    {
      id: "staff-performance",
      title: "Staff Performance",
      value: "94%",
      change: "Above target",
      icon: Users,
      permission: PERMISSIONS.USERS_MANAGE,
    },
    {
      id: "low-stock",
      title: "Low Stock Items",
      value: "7",
      change: "Need reordering",
      icon: Package,
      permission: PERMISSIONS.INVENTORY_MANAGE,
    },
    {
      id: "discounts",
      title: "Discounts Applied",
      value: "$342.15",
      change: "This week",
      icon: TrendingUp,
      permission: PERMISSIONS.DISCOUNTS_APPLY,
    },
  ];

  const visibleStats = stats.filter((stat) => hasPermission(stat.permission));

  if (visibleStats.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}
    >
      {visibleStats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
