/**
 * Receipt Printer UI Components
 * Visual feedback and controls for thermal receipt printing
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Printer,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Mail,
  AlertTriangle,
  Settings,
  Bluetooth,
  Usb,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export type PrintStatus =
  | "idle"
  | "printing"
  | "success"
  | "error"
  | "cancelled";

export interface PrinterInfo {
  connected: boolean;
  interface: string;
  type: string;
  error?: string;
}

interface ReceiptPrinterStatusProps {
  printStatus: PrintStatus;
  printerInfo?: PrinterInfo;
  onRetryPrint: () => void;
  onSkipReceipt: () => void;
  onEmailReceipt?: () => void;
  onNewSale: () => void;
  className?: string;
}

/**
 * Receipt printer status component with user actions
 */
export const ReceiptPrinterStatus: React.FC<ReceiptPrinterStatusProps> = ({
  printStatus,
  printerInfo,
  onRetryPrint,
  onSkipReceipt,
  onEmailReceipt,
  onNewSale,
  className = "",
}) => {
  const [progress, setProgress] = useState(0);

  // Simulate printing progress
  useEffect(() => {
    if (printStatus === "printing") {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    } else if (printStatus === "success") {
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [printStatus]);

  const getStatusIcon = () => {
    switch (printStatus) {
      case "printing":
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "error":
        return <XCircle className="h-6 w-6 text-red-500" />;
      case "cancelled":
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      default:
        return <Printer className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (printStatus) {
      case "printing":
        return "Printing Receipt...";
      case "success":
        return "Receipt Printed Successfully!";
      case "error":
        return "Could not print receipt";
      case "cancelled":
        return "Print cancelled";
      default:
        return "Ready to print";
    }
  };

  const getStatusColor = () => {
    switch (printStatus) {
      case "printing":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "cancelled":
        return "bg-orange-50 border-orange-200 text-orange-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className}`}
    >
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            {getStatusIcon()}
          </div>
          <CardTitle className={`text-lg ${getStatusColor().split(" ")[2]}`}>
            {getStatusText()}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Printer Status Info */}
          {printerInfo && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                {printerInfo.interface.startsWith("BT:") ? (
                  <Bluetooth className="h-4 w-4 text-blue-500" />
                ) : (
                  <Usb className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm text-gray-600">
                  {printerInfo.interface.startsWith("BT:")
                    ? "Bluetooth"
                    : "USB"}
                </span>
              </div>
              <Badge
                variant={printerInfo.connected ? "default" : "destructive"}
              >
                {printerInfo.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          )}

          {/* Progress Bar for Printing */}
          {printStatus === "printing" && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 text-center">
                Sending data to printer...
              </p>
            </div>
          )}

          {/* Error Message */}
          {printStatus === "error" && printerInfo?.error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {printerInfo.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {printStatus === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <Button
                  onClick={onNewSale}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  New Sale
                </Button>
                <Button
                  onClick={onRetryPrint}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Print Copy
                </Button>
              </motion.div>
            )}

            {printStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={onRetryPrint}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  {onEmailReceipt && (
                    <Button
                      onClick={onEmailReceipt}
                      variant="outline"
                      className="flex-1"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  )}
                </div>
                <Button
                  onClick={onSkipReceipt}
                  variant="ghost"
                  className="w-full"
                >
                  Skip Receipt & Continue
                </Button>
              </motion.div>
            )}

            {printStatus === "printing" && (
              <Button
                onClick={() => {
                  // Cancel print job (if supported)
                  onSkipReceipt();
                }}
                variant="outline"
                className="w-full"
                disabled
              >
                Printing... Please wait
              </Button>
            )}
          </div>

          {/* Help Text */}
          {printStatus === "error" && (
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Common solutions:</p>
              <p>• Check printer power and connection</p>
              <p>• Ensure paper is loaded correctly</p>
              <p>• Try reconnecting the printer</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface PrinterSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: { type: string; interface: string }) => void;
  availableInterfaces?: Array<{
    type: "usb" | "bluetooth";
    name: string;
    address: string;
  }>;
  isConnecting?: boolean;
}

/**
 * Printer setup and configuration dialog
 */
export const PrinterSetupDialog: React.FC<PrinterSetupDialogProps> = ({
  isOpen,
  onClose,
  onConnect,
  availableInterfaces = [],
  isConnecting = false,
}) => {
  const [selectedInterface, setSelectedInterface] = useState<string>("");
  const [printerType, setPrinterType] = useState<string>("epson");

  const handleConnect = () => {
    if (!selectedInterface) {
      toast.error("Please select a printer interface");
      return;
    }

    onConnect({
      type: printerType,
      interface: selectedInterface,
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <Card className="w-full max-w-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Printer Setup
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Printer Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Printer Type
            </label>
            <select
              value={printerType}
              onChange={(e) => setPrinterType(e.target.value)}
              className="w-full p-2 border rounded-md bg-white"
            >
              <option value="epson">ESC/POS (Epson, DIERI, Generic)</option>
              <option value="star">Star Printers</option>
              <option value="generic">Generic Thermal</option>
            </select>
          </div>

          {/* Interface Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Connection Method
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableInterfaces.length === 0 ? (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                  No interfaces detected. Make sure your printer is connected.
                </div>
              ) : (
                availableInterfaces.map((iface) => (
                  <div
                    key={iface.address}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedInterface === iface.address
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedInterface(iface.address)}
                  >
                    <div className="flex items-center space-x-3">
                      {iface.type === "bluetooth" ? (
                        <Bluetooth className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Usb className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{iface.name}</div>
                        <div className="text-xs text-gray-500">
                          {iface.address}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              className="flex-1"
              disabled={!selectedInterface || isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
