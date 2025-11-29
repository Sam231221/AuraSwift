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
  ShoppingCart,
} from "lucide-react";

const ManagerDashboardPage = ({
  onStaffSchedules,
  onManageProducts,
  onManageCashiers,
  onNewTransaction,
}: {
  onStaffSchedules: () => void;
  onManageProducts: () => void;
  onManageCashiers: () => void;
  onNewTransaction?: () => void;
}) => {
  return (
    <div className="grid gap-4 sm:gap-6">
      {/* Manager Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Weekly Revenue
            </CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">$8,642.30</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              +18% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Staff Performance
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">94%</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Above target
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">7</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Need reordering
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Discounts Applied
            </CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">$342.15</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Manager Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Management Actions
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Store operations and oversight
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {onNewTransaction && (
              <Button
                onClick={onNewTransaction}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              >
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
                New Sale
              </Button>
            )}
            <Button
              className="w-full justify-start bg-transparent text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
              Void Transaction
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
              Apply Discount
            </Button>
            <Button
              onClick={onManageProducts}
              className="w-full justify-start bg-transparent text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
              Manage Inventory
            </Button>
            <Button
              onClick={onManageCashiers}
              className="w-full justify-start bg-transparent text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
              Manage Cashiers
            </Button>
            <Button
              onClick={onStaffSchedules}
              className="w-full justify-start bg-transparent text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
              Staff Schedules
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Reports & Analytics
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Comprehensive business insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <Button
              className="w-full justify-start bg-transparent text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
              Sales Reports
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
              Performance Analytics
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
              Inventory Reports
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
              Staff Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default ManagerDashboardPage;
