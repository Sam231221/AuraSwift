import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  BarChart3,
  TrendingUp,
  Store,
  Users,
  Settings,
  Shield,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

export const AdminDashboardView = ({ onFront }: { onFront: () => void }) => {
  return (
    <>
      {/* Admin Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenueß
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 online now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Controls */}
      <div className="grid md:grid-cols-3 mt-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage staff and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
              onClick={onFront}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Shield className="w-4 h-4 mr-2" />
              Role Permissions
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Settings className="w-4 h-4 mr-2" />
              Access Control
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure system preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Settings className="w-4 h-4 mr-2" />
              General Settings
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Store className="w-4 h-4 mr-2" />
              Store Configuration
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Reports</CardTitle>
            <CardDescription>Comprehensive analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Financial Reports
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Business Intelligence
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Users className="w-4 h-4 mr-2" />
              User Activity Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
