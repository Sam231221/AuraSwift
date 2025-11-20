import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Package,
} from "lucide-react";

const ManagerDashboardPage = ({
  onStaffSchedules,
  onManageProducts,
  onManageCashiers,
}: {
  onStaffSchedules: () => void;
  onManageProducts: () => void;
  onManageCashiers: () => void;
}) => {
  return (
    <div className="grid gap-6">
      {/* Manager Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$8,642.30</div>
            <p className="text-xs text-muted-foreground">+18% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Staff Performance
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Above target</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Discounts Applied
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$342.15</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Manager Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Management Actions</CardTitle>
            <CardDescription>Store operations and oversight</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Void Transaction
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Apply Discount
            </Button>
            <Button
              onClick={onManageProducts}
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Package className="w-4 h-4 mr-2" />
              Manage Inventory
            </Button>
            <Button
              onClick={onManageCashiers}
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Cashiers
            </Button>
            <Button
              onClick={onStaffSchedules}
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Users className="w-4 h-4 mr-2" />
              Staff Schedules
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports & Analytics</CardTitle>
            <CardDescription>Comprehensive business insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Sales Reports
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance Analytics
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Package className="w-4 h-4 mr-2" />
              Inventory Reports
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Users className="w-4 h-4 mr-2" />
              Staff Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default ManagerDashboardPage;
