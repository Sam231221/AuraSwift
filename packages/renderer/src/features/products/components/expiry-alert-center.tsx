import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";
import type { ExpiryAlert } from "../types/batch.types";
import { formatExpiryDate } from "../utils/expiry-calculations";
import { cn } from "@/shared/utils/cn";

interface ExpiryAlertCenterProps {
  criticalAlerts: ExpiryAlert[];
  warningAlerts: ExpiryAlert[];
  infoAlerts: ExpiryAlert[];
  onAcknowledge?: (alert: ExpiryAlert) => void;
  onCreatePromotion?: (alert: ExpiryAlert) => void;
  onAdjustStock?: (alert: ExpiryAlert) => void;
  onMarkAsWaste?: (alert: ExpiryAlert) => void;
}

const ExpiryAlertCenter: React.FC<ExpiryAlertCenterProps> = ({
  criticalAlerts,
  warningAlerts,
  infoAlerts,
  onAcknowledge,
  onCreatePromotion,
  onAdjustStock,
  onMarkAsWaste,
}) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "EXPIRED":
      case "CRITICAL":
        return <AlertTriangle className="w-5 h-5" />;
      case "WARNING":
        return <AlertCircle className="w-5 h-5" />;
      case "INFO":
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getAlertVariant = (type: string): "default" | "destructive" => {
    return type === "EXPIRED" || type === "CRITICAL" ? "destructive" : "default";
  };

  const renderAlertCard = (alert: ExpiryAlert) => (
    <Alert
      key={alert.batch.id}
      variant={getAlertVariant(alert.alertType)}
      className={cn(
        "mb-4",
        alert.alertType === "EXPIRED" || alert.alertType === "CRITICAL"
          ? "border-red-200 bg-red-50"
          : alert.alertType === "WARNING"
          ? "border-orange-200 bg-orange-50"
          : "border-blue-200 bg-blue-50"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div
            className={cn(
              "mt-0.5",
              alert.alertType === "EXPIRED" || alert.alertType === "CRITICAL"
                ? "text-red-600"
                : alert.alertType === "WARNING"
                ? "text-orange-600"
                : "text-blue-600"
            )}
          >
            {getAlertIcon(alert.alertType)}
          </div>
          <div className="flex-1">
            <AlertTitle className="flex items-center space-x-2">
              <span>{alert.batch.product?.name || "Unknown Product"}</span>
              <Badge variant="outline" className="text-xs">
                {alert.batch.batchNumber}
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="text-sm">{alert.message}</p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600">
                <span>
                  <strong>Expiry:</strong> {formatExpiryDate(alert.batch.expiryDate, false)}
                </span>
                <span>
                  <strong>Stock:</strong> {alert.batch.currentQuantity} units
                </span>
                {alert.batch.costPrice && (
                  <span>
                    <strong>Value:</strong> £
                    {(alert.batch.costPrice * alert.batch.currentQuantity).toFixed(2)}
                  </span>
                )}
              </div>
            </AlertDescription>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-2">
        {onCreatePromotion &&
          (alert.alertType === "CRITICAL" || alert.alertType === "WARNING") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCreatePromotion(alert)}
            >
              Create Promotion
            </Button>
          )}
        {onAdjustStock && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAdjustStock(alert)}
          >
            Adjust Stock
          </Button>
        )}
        {onMarkAsWaste && alert.alertType === "EXPIRED" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onMarkAsWaste(alert)}
          >
            Mark as Waste
          </Button>
        )}
        {onAcknowledge && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAcknowledge(alert)}
            className="ml-auto"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Acknowledge
          </Button>
        )}
      </div>
    </Alert>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expiry Alerts</h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage batches approaching expiry
        </p>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-900">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Critical Alerts ({criticalAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {criticalAlerts.map(renderAlertCard)}
          </CardContent>
        </Card>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-900">
              <AlertCircle className="w-5 h-5 mr-2" />
              Warning Alerts ({warningAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warningAlerts.map(renderAlertCard)}
          </CardContent>
        </Card>
      )}

      {/* Info Alerts */}
      {infoAlerts.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Info className="w-5 h-5 mr-2" />
              Information Alerts ({infoAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {infoAlerts.map(renderAlertCard)}
          </CardContent>
        </Card>
      )}

      {/* No Alerts */}
      {criticalAlerts.length === 0 &&
        warningAlerts.length === 0 &&
        infoAlerts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Expiry Alerts
              </h3>
              <p className="text-gray-600">
                All batches are within acceptable expiry ranges.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default ExpiryAlertCenter;

