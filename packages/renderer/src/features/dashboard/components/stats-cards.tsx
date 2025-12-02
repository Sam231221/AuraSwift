/**
 * StatsCards Component
 *
 * Reusable stats cards component with permission-based visibility.
 * Displays key metrics based on user permissions.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Users,
  Shield,
  AlertTriangle,
  Package,
  TrendingUp,
} from "lucide-react";
import { useUserPermissions } from "../hooks/use-user-permissions";
import { PERMISSIONS } from "@app/shared/constants/permissions";

interface StatsCardsProps {
  className?: string;
}
const stats = [
  {
    id: "revenue",
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1% from last month",
    icon: DollarSign,
    permission: PERMISSIONS.REPORTS_READ,
  },
  {
    id: "users",
    title: "Active Users",
    value: "12",
    change: "3 online now",
    icon: Users,
    permission: PERMISSIONS.USERS_MANAGE,
  },
  {
    id: "health",
    title: "System Health",
    value: "99.9%",
    change: "Uptime this month",
    icon: Shield,
    permission: PERMISSIONS.SETTINGS_MANAGE,
  },
  {
    id: "alerts",
    title: "Alerts",
    value: "2",
    change: "Require attention",
    icon: AlertTriangle,
    permission: PERMISSIONS.REPORTS_READ,
  },
];

export function StatsCards({ className = "" }: StatsCardsProps) {
  const { hasPermission, isLoading } = useUserPermissions();

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
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
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
