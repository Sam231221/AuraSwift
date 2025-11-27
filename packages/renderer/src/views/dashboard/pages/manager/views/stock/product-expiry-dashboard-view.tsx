import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  TrendingDown,
  Package,
  Calendar,
  DollarSign,
  BarChart3,
} from "lucide-react";
import type { ProductBatch, ExpirySettings } from "./types/batch.types";
import { useExpiryAlerts } from "./hooks/use-expiry-alerts";
import { formatExpiryDate } from "./utils/expiry-calculations";

interface ExpiryDashboardProps {
  batches: ProductBatch[];
  expirySettings: ExpirySettings | null;
  businessId: string;
  onViewBatches?: () => void;
  onReceiveBatch?: () => void;
  onGenerateReport?: () => void;
  onCreatePromotion?: () => void;
}

const ExpiryDashboard: React.FC<ExpiryDashboardProps> = ({
  batches,
  expirySettings,
  businessId,
  onViewBatches,
  onReceiveBatch,
  onGenerateReport,
  onCreatePromotion,
}) => {
  const {
    criticalAlerts,
    expiredBatches,
    criticalBatches,
    expiringThisWeek,
    expiringNext30Days,
  } = useExpiryAlerts({
    batches,
    expirySettings,
    businessId,
  });

  const totalBatches = batches.length;
  const activeBatches = batches.filter((b) => b.status === "ACTIVE").length;
  const expiredCount = expiredBatches.length;
  const criticalCount = criticalBatches.length;

  // Calculate total value at risk (batches expiring in next 7 days)
  const valueAtRisk = expiringThisWeek.reduce((total, batch) => {
    const cost = batch.costPrice || 0;
    return total + cost * batch.currentQuantity;
  }, 0);

  // Calculate waste value (expired batches)
  const wasteValue = expiredBatches.reduce((total, batch) => {
    const cost = batch.costPrice || 0;
    return total + cost * batch.currentQuantity;
  }, 0);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Product Expiry Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Track and manage product batches and expiry dates
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {onViewBatches && (
            <Button
              variant="outline"
              onClick={onViewBatches}
              className="w-full sm:w-auto"
            >
              View All Batches
            </Button>
          )}
          {onReceiveBatch && (
            <Button onClick={onReceiveBatch} className="w-full sm:w-auto">
              <Package className="w-4 h-4 mr-2" />
              Receive New Batch
            </Button>
          )}
        </div>
      </div>

      {/* Critical Alerts */}
      {(criticalAlerts.length > 0 || expiredBatches.length > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-900 text-base sm:text-lg">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiredBatches.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-red-100 rounded">
                  <div>
                    <p className="font-semibold text-red-900 text-sm sm:text-base">
                      {expiredBatches.length} Expired Batch
                      {expiredBatches.length !== 1 ? "es" : ""}
                    </p>
                    <p className="text-xs sm:text-sm text-red-700">
                      {expiredBatches.reduce(
                        (sum, b) => sum + b.currentQuantity,
                        0
                      )}{" "}
                      units need immediate attention
                    </p>
                  </div>
                  <Badge variant="destructive" className="w-fit">
                    Expired
                  </Badge>
                </div>
              )}
              {criticalAlerts.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-orange-100 rounded">
                  <div>
                    <p className="font-semibold text-orange-900 text-sm sm:text-base">
                      {criticalAlerts.length} Critical Alert
                      {criticalAlerts.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs sm:text-sm text-orange-700">
                      Batches expiring within{" "}
                      {expirySettings?.criticalAlertDays || 3} days
                    </p>
                  </div>
                  <Badge variant="destructive" className="w-fit">
                    Critical
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Batches
            </CardTitle>
            <Package className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalBatches}</div>
            <p className="text-xs text-gray-500 mt-1">
              {activeBatches} active, {expiredCount} expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Expiring This Week
            </CardTitle>
            <Calendar className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {expiringThisWeek.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {expiringThisWeek.reduce((sum, b) => sum + b.currentQuantity, 0)}{" "}
              units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Value at Risk
            </CardTitle>
            <DollarSign className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              £{valueAtRisk.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Expiring in next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Waste Value
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-600">
              £{wasteValue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">From expired batches</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {onReceiveBatch && (
              <Button
                variant="outline"
                className="w-full justify-start text-sm sm:text-base"
                onClick={onReceiveBatch}
              >
                <Package className="w-4 h-4 mr-2" />
                Receive New Batch
              </Button>
            )}
            {onViewBatches && (
              <Button
                variant="outline"
                className="w-full justify-start text-sm sm:text-base"
                onClick={onViewBatches}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View All Batches
              </Button>
            )}
            {onGenerateReport && (
              <Button
                variant="outline"
                className="w-full justify-start text-sm sm:text-base"
                onClick={onGenerateReport}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Expiry Report
              </Button>
            )}
            {onCreatePromotion && criticalCount > 0 && (
              <Button
                variant="outline"
                className="w-full justify-start text-sm sm:text-base"
                onClick={onCreatePromotion}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Create Promotion ({criticalCount} items)
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Upcoming Expiry
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringNext30Days.length === 0 ? (
              <p className="text-gray-500 text-xs sm:text-sm">
                No batches expiring in the next 30 days
              </p>
            ) : (
              <div className="space-y-2">
                {expiringNext30Days.slice(0, 5).map((batch) => (
                  <div
                    key={batch.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 bg-gray-50 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">
                        {batch.product?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatExpiryDate(batch.expiryDate, false)} •{" "}
                        {batch.currentQuantity} units
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs w-fit">
                      {batch.batchNumber}
                    </Badge>
                  </div>
                ))}
                {expiringNext30Days.length > 5 && (
                  <p className="text-xs sm:text-sm text-gray-500 text-center pt-2">
                    +{expiringNext30Days.length - 5} more batches
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpiryDashboard;
