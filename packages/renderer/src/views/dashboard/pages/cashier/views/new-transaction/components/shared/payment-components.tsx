import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Wifi,
  Battery,
  AlertCircle,
  Loader2,
  RefreshCw,
  Power,
  Zap,
  Radio,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('payment-components');
// Type definitions for payment components
interface CardReaderStatus {
  connected: boolean;
  deviceType: string;
  connectionType: "usb" | "bluetooth" | "none";
  batteryLevel?: number;
  firmwareVersion?: string;
  lastActivity?: string;
  error?: string;
}

interface PaymentFlowState {
  step:
    | "idle"
    | "connecting"
    | "waiting_for_card"
    | "reading_card"
    | "processing"
    | "complete"
    | "error"
    | "cancelled";
  message: string;
  canCancel: boolean;
  progress?: number;
}

interface PaymentResult {
  success: boolean;
  paymentIntent?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
  };
  error?: string;
  errorCode?: string;
}

interface CardReaderConfig {
  type: "bbpos_wisepad3" | "simulated";
  connectionType: "usb" | "bluetooth";
  deviceId?: string;
  simulated?: boolean;
}

interface PaymentTerminalProps {
  amount: number; // in cents
  currency?: string;
  onPaymentComplete: (result: PaymentResult) => void;
  onPaymentFailed: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const PaymentTerminal: React.FC<PaymentTerminalProps> = ({
  amount,
  currency = "gbp",
  onPaymentComplete,
  onPaymentFailed,
  onCancel,
  disabled = false,
}) => {
  const [readerStatus, setReaderStatus] = useState<CardReaderStatus | null>(
    null
  );
  const [paymentState, setPaymentState] = useState<PaymentFlowState>({
    step: "idle",
    message: "Ready for payment",
    canCancel: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize reader status check
  useEffect(() => {
    checkReaderStatus();
    const interval = setInterval(checkReaderStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const checkReaderStatus = async () => {
    try {
      const status = await window.paymentAPI.getReaderStatus();
      setReaderStatus(status);
    } catch (error) {
      logger.error("Failed to get reader status:", error);
    }
  };

  const handleStartPayment = async () => {
    if (!readerStatus?.connected) {
      onPaymentFailed("Card reader not connected");
      return;
    }

    setIsProcessing(true);
    setPaymentState({
      step: "waiting_for_card",
      message: "Please swipe, tap, or insert your card",
      canCancel: true,
      progress: 10,
    });

    try {
      // Create payment intent
      const intentResponse = await window.paymentAPI.createPaymentIntent({
        amount,
        currency,
        description: `Payment for £${(amount / 100).toFixed(2)}`,
      });

      if (!intentResponse.success || !intentResponse.clientSecret) {
        throw new Error(
          intentResponse.error || "Failed to create payment intent"
        );
      }

      setPaymentState({
        step: "reading_card",
        message: "Processing card...",
        canCancel: true,
        progress: 30,
      });

      // Process card payment
      const paymentResult = await window.paymentAPI.processCardPayment(
        intentResponse.clientSecret.split("_secret_")[0]
      );

      if (paymentResult.success) {
        setPaymentState({
          step: "complete",
          message: "Payment successful!",
          canCancel: false,
          progress: 100,
        });

        setTimeout(() => {
          onPaymentComplete(paymentResult);
          resetPaymentState();
        }, 2000);
      } else {
        throw new Error(paymentResult.error || "Payment failed");
      }
    } catch (error) {
      logger.error("Payment processing error:", error);
      setPaymentState({
        step: "error",
        message: error instanceof Error ? error.message : "Payment failed",
        canCancel: false,
      });

      setTimeout(() => {
        onPaymentFailed(
          error instanceof Error ? error.message : "Payment failed"
        );
        resetPaymentState();
      }, 3000);
    }
  };

  const handleCancelPayment = async () => {
    try {
      await window.paymentAPI.cancelPayment();
      resetPaymentState();
      onCancel?.();
    } catch (error) {
      logger.error("Failed to cancel payment:", error);
    }
  };

  const resetPaymentState = () => {
    setIsProcessing(false);
    setPaymentState({
      step: "idle",
      message: "Ready for payment",
      canCancel: false,
    });
  };

  const getStatusColor = (status: CardReaderStatus) => {
    if (!status.connected) return "text-red-500";
    if (status.error) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusIcon = (status: CardReaderStatus) => {
    if (!status.connected) return <XCircle className="h-4 w-4 text-red-500" />;
    if (status.error)
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case "waiting_for_card":
        return <CreditCard className="h-6 w-6 animate-pulse" />;
      case "reading_card":
      case "processing":
        return <Loader2 className="h-6 w-6 animate-spin" />;
      case "complete":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "error":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Card Reader Status */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Radio className="h-4 w-4" />
            Card Reader Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {readerStatus ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(readerStatus)}
                <span
                  className={`text-sm font-medium ${getStatusColor(
                    readerStatus
                  )}`}
                >
                  {readerStatus.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{readerStatus.deviceType}</span>
                {readerStatus.batteryLevel && (
                  <div className="flex items-center gap-1">
                    <Battery className="h-3 w-3" />
                    <span>{readerStatus.batteryLevel}%</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-slate-500">
                Checking reader status...
              </span>
            </div>
          )}

          {readerStatus?.error && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {readerStatus.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Payment Amount Display */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-800">
              £{(amount / 100).toFixed(2)}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {currency.toUpperCase()} • Card Payment
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Processing Status */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    {getStepIcon(paymentState.step)}
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-800">
                      {paymentState.message}
                    </h3>
                    {paymentState.step === "waiting_for_card" && (
                      <p className="text-sm text-slate-600 mt-1">
                        Present card to the reader
                      </p>
                    )}
                  </div>

                  {paymentState.progress && (
                    <Progress
                      value={paymentState.progress}
                      className="w-full"
                    />
                  )}

                  {paymentState.canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelPayment}
                      className="mt-2"
                    >
                      Cancel Payment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Actions */}
      {!isProcessing && (
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 h-12"
            onClick={handleStartPayment}
            disabled={disabled || !readerStatus?.connected || isProcessing}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Process Card Payment
          </Button>

          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4"
            >
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* Payment Instructions */}
      <div className="bg-slate-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          Payment Instructions:
        </h4>
        <ul className="text-xs text-slate-600 space-y-1">
          <li>• Swipe card through the reader slot</li>
          <li>• Tap contactless card on the reader</li>
          <li>• Insert chip card and follow prompts</li>
          <li>• Follow on-screen instructions</li>
        </ul>
      </div>
    </div>
  );
};

interface CardReaderSetupProps {
  onReaderConnected: (config: CardReaderConfig) => void;
  onClose: () => void;
}

export const CardReaderSetup: React.FC<CardReaderSetupProps> = ({
  onReaderConnected,
  onClose,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [availableReaders, setAvailableReaders] = useState<
    Array<{
      type: string;
      id: string;
      name: string;
      connectionType: "usb" | "bluetooth";
    }>
  >([]);
  const [selectedReader, setSelectedReader] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    discoverReaders();
  }, []);

  const discoverReaders = async () => {
    setIsScanning(true);
    try {
      const response = await window.paymentAPI.discoverReaders();
      if (response.success) {
        setAvailableReaders(response.readers);
      }
    } catch (error) {
      logger.error("Failed to discover readers:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const connectReader = async (readerId: string) => {
    const reader = availableReaders.find((r) => r.id === readerId);
    if (!reader) return;

    setIsConnecting(true);
    try {
      const config: CardReaderConfig = {
        type: reader.type as "bbpos_wisepad3" | "simulated",
        connectionType: reader.connectionType,
        deviceId: reader.id,
        simulated: reader.type === "simulated",
      };

      const response = await window.paymentAPI.initializeReader(config);
      if (response.success) {
        onReaderConnected(config);
      } else {
        throw new Error(response.error || "Failed to connect");
      }
    } catch (error) {
      logger.error("Failed to connect reader:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          Setup Card Reader
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Available Readers</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={discoverReaders}
            disabled={isScanning}
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Scan
          </Button>
        </div>

        <div className="space-y-2">
          {availableReaders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {isScanning ? "Scanning for readers..." : "No readers found"}
            </div>
          ) : (
            availableReaders.map((reader) => (
              <div
                key={reader.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedReader === reader.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setSelectedReader(reader.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{reader.name}</div>
                    <div className="text-xs text-slate-500">
                      {reader.connectionType.toUpperCase()} • {reader.type}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {reader.connectionType === "usb" ? (
                      <Zap className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Wifi className="h-4 w-4 text-blue-500" />
                    )}
                    {reader.type === "simulated" && (
                      <Badge variant="secondary" className="text-xs">
                        Simulated
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            className="flex-1"
            onClick={() => selectedReader && connectReader(selectedReader)}
            disabled={!selectedReader || isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            Connect Reader
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface PaymentStatusModalProps {
  isOpen: boolean;
  paymentState: PaymentFlowState;
  amount: number;
  onCancel?: () => void;
  onRetry?: () => void;
  onClose: () => void;
}

export const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
  isOpen,
  paymentState,
  amount,
  onCancel,
  onRetry,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {getStepIcon(paymentState.step)}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              £{(amount / 100).toFixed(2)}
            </h2>
            <p className="text-slate-600 mt-1">{paymentState.message}</p>
          </div>

          {paymentState.progress && (
            <Progress value={paymentState.progress} className="w-full" />
          )}

          <div className="flex gap-2 pt-4">
            {paymentState.canCancel && onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}

            {paymentState.step === "error" && onRetry && (
              <Button onClick={onRetry} className="flex-1">
                Try Again
              </Button>
            )}

            {paymentState.step === "complete" && (
              <Button
                onClick={onClose}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Done
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Helper function for step icons
const getStepIcon = (step: string) => {
  switch (step) {
    case "waiting_for_card":
      return <CreditCard className="h-8 w-8 animate-pulse text-blue-500" />;
    case "reading_card":
    case "processing":
      return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
    case "complete":
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    case "error":
      return <XCircle className="h-8 w-8 text-red-500" />;
    default:
      return <CreditCard className="h-8 w-8 text-slate-400" />;
  }
};
