import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  DollarSign,
  ShoppingCart,
  Clock,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/shared/hooks";
import { useNavigate } from "react-router-dom";
import RefundTransactionView from "./refund-transaction-view.tsx";

// TypeScript interfaces
interface Transaction {
  id: string;
  receiptNumber: string;
  timestamp: string;
  total: number;
  paymentMethod: "cash" | "card" | "mixed";
  items: TransactionItem[];
  type: "sale" | "refund" | "void";
}

interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  refundedQuantity?: number;
}

interface Shift {
  id: string;
  scheduleId?: string;
  cashierId: string;
  businessId: string;
  startTime: string;
  endTime?: string;
  status: "active" | "ended";
  startingCash: number;
  finalCashDrawer?: number;
  expectedCashDrawer?: number;
  cashVariance?: number;
  totalSales?: number;
  totalTransactions?: number;
  totalRefunds?: number;
  totalVoids?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Schedule {
  id: string;
  staffId: string;
  businessId: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "active" | "completed" | "missed";
  assignedRegister?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShiftStats {
  totalTransactions: number;
  totalSales: number;
  totalRefunds: number;
  totalVoids: number;
}
interface CashierDashboardViewProps {
  onNewTransaction: () => void;
}
const CashierDashboardView = ({
  onNewTransaction,
}: CashierDashboardViewProps) => {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<Schedule | null>(null);
  const [shiftStats, setShiftStats] = useState<ShiftStats>({
    totalTransactions: 0,
    totalSales: 0,
    totalRefunds: 0,
    totalVoids: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showStartShiftDialog, setShowStartShiftDialog] = useState(false);
  const [showEndShiftDialog, setShowEndShiftDialog] = useState(false);
  const [showLateStartConfirm, setShowLateStartConfirm] = useState(false);
  const [startingCash, setStartingCash] = useState("");
  const [finalCash, setFinalCash] = useState("");
  const [lateStartMinutes, setLateStartMinutes] = useState(0);
  const [showOvertimeWarning, setShowOvertimeWarning] = useState(false);
  const [overtimeMinutes, setOvertimeMinutes] = useState(0);
  const [showRefundView, setShowRefundView] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Handle automatic shift ending when overtime exceeds threshold
  const handleAutoEndShift = useCallback(
    async (minutesOvertime: number) => {
      if (!activeShift) return;

      try {
        // Auto-end with current cash drawer balance (estimated)
        const estimatedCashDrawer =
          activeShift.startingCash + (shiftStats.totalSales || 0);

        const response = await window.shiftAPI.end(activeShift.id, {
          finalCashDrawer: estimatedCashDrawer,
          expectedCashDrawer: estimatedCashDrawer,
          totalSales: shiftStats.totalSales || 0,
          totalTransactions: shiftStats.totalTransactions || 0,
          totalRefunds: shiftStats.totalRefunds || 0,
          totalVoids: shiftStats.totalVoids || 0,
          notes: `Auto-ended after ${minutesOvertime} minutes overtime. Cash drawer amount estimated. Requires manager approval.`,
        });

        if (response.success) {
          setActiveShift(null);
          setShiftStats({
            totalTransactions: 0,
            totalSales: 0,
            totalRefunds: 0,
            totalVoids: 0,
          });
          setShowOvertimeWarning(false);
          setOvertimeMinutes(0);

          alert(
            `Your shift has been automatically ended due to excessive overtime (${minutesOvertime} minutes). ` +
              `The cash drawer amount has been estimated. Please contact your manager for shift reconciliation.`
          );
        }
      } catch (error) {
        console.error("Failed to auto-end shift:", error);
      }
    },
    [activeShift, shiftStats]
  );

  // Check for overtime and handle automatic shift ending
  useEffect(() => {
    if (!activeShift || !todaySchedule) return;

    const checkOvertime = () => {
      const now = new Date();
      const scheduledEnd = new Date(todaySchedule.endTime);
      const timeDifference = now.getTime() - scheduledEnd.getTime();
      const minutesOvertime = Math.floor(timeDifference / (1000 * 60));

      if (minutesOvertime > 0) {
        setOvertimeMinutes(minutesOvertime);

        // Show warning after 15 minutes of overtime
        if (minutesOvertime >= 15 && !showOvertimeWarning) {
          setShowOvertimeWarning(true);
        }

        // Auto-end shift after 2 hours of overtime (configurable)
        if (minutesOvertime >= 120) {
          handleAutoEndShift(minutesOvertime);
        }
      } else {
        setOvertimeMinutes(0);
        setShowOvertimeWarning(false);
      }
    };

    checkOvertime(); // Check immediately
    const overtimeInterval = setInterval(checkOvertime, 60000); // Check every minute

    return () => clearInterval(overtimeInterval);
  }, [activeShift, todaySchedule, showOvertimeWarning, handleAutoEndShift]);

  // Load shift data function
  const loadShiftData = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!user?.id) return;

      // Load active shift
      const activeShiftResponse = await window.shiftAPI.getActive(user.id);
      if (activeShiftResponse.success && activeShiftResponse.data) {
        const shiftData = activeShiftResponse.data as Shift;
        setActiveShift(shiftData);

        // Load shift stats if shift is active
        const statsResponse = await window.shiftAPI.getStats(shiftData.id);
        if (statsResponse.success && statsResponse.data) {
          setShiftStats(statsResponse.data as ShiftStats);
        }
      } else {
        setActiveShift(null);
      }

      // Load today's schedule
      const scheduleResponse = await window.shiftAPI.getTodaySchedule(user.id);
      if (scheduleResponse.success && scheduleResponse.data) {
        setTodaySchedule(scheduleResponse.data as Schedule);
      } else {
        setTodaySchedule(null);
      }

      // Load recent transactions (including refunds) - prioritize current shift if active
      try {
        let transactionsResponse;
        if (activeShiftResponse.success && activeShiftResponse.data) {
          // If there's an active shift, get transactions from current shift only
          const shiftData = activeShiftResponse.data as Shift;
          transactionsResponse = await window.refundAPI.getShiftTransactions(
            shiftData.id,
            10
          );
        } else if (user.businessId) {
          // If no active shift, get recent transactions from business
          transactionsResponse = await window.refundAPI.getRecentTransactions(
            user.businessId,
            10
          );
        }

        if (
          transactionsResponse &&
          transactionsResponse.success &&
          "transactions" in transactionsResponse
        ) {
          const transactionsData = transactionsResponse as {
            success: boolean;
            transactions: Transaction[];
          };
          setTransactions(transactionsData.transactions || []);
        }
      } catch (transactionError) {
        console.error("Failed to load recent transactions:", transactionError);
        // Don't fail the entire load if transactions fail
        setTransactions([]);
      }
    } catch (error) {
      console.error("Failed to load shift data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.businessId]);

  // Load shift data on component mount
  useEffect(() => {
    loadShiftData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadShiftData, 30000);
    return () => clearInterval(interval);
  }, [loadShiftData]);

  console.log("Debug schedule data:", {
    activeShift,
    todaySchedule,
    todayScheduleStartTime: todaySchedule?.startTime,
    todayScheduleEndTime: todaySchedule?.endTime,
    parsedStartTime: todaySchedule
      ? new Date(todaySchedule.startTime).toString()
      : null,
    parsedEndTime: todaySchedule
      ? new Date(todaySchedule.endTime).toString()
      : null,
  });

  // Calculate shift timing validation
  const shiftTimingInfo = todaySchedule
    ? (() => {
        const now = new Date();
        const scheduledStart = new Date(todaySchedule.startTime);
        const timeDifference = now.getTime() - scheduledStart.getTime();
        const minutesDifference = timeDifference / (1000 * 60);

        const EARLY_START_MINUTES = 15;
        const LATE_START_MINUTES = 30;

        if (minutesDifference < -EARLY_START_MINUTES) {
          const minutesUntilStart = Math.ceil(-minutesDifference);
          return {
            canStart: false,
            buttonText: `Start in ${minutesUntilStart}m`,
            reason: `Too early - wait ${minutesUntilStart} minutes`,
          };
        } else if (minutesDifference > LATE_START_MINUTES) {
          const minutesLate = Math.floor(minutesDifference);
          return {
            canStart: true,
            buttonText: `Start Shift (Late)`,
            reason: `${minutesLate} minutes late`,
          };
        } else {
          return {
            canStart: true,
            buttonText: "Start Shift",
            reason: "Ready to start",
          };
        }
      })()
    : {
        canStart: false,
        buttonText: "No Schedule",
        reason: "No schedule found",
      };

  // Calculate derived values
  const cashVariance = activeShift
    ? (activeShift.finalCashDrawer || 0) -
      (activeShift.startingCash + (shiftStats.totalSales || 0))
    : 0;

  const averageTransaction =
    shiftStats.totalTransactions > 0
      ? shiftStats.totalSales / shiftStats.totalTransactions
      : 0;

  const shiftProgress =
    activeShift && todaySchedule
      ? (() => {
          const now = new Date();
          const shiftStart = new Date(activeShift.startTime);
          const scheduleEnd = new Date(todaySchedule.endTime);
          const totalDuration = scheduleEnd.getTime() - shiftStart.getTime();
          const elapsed = now.getTime() - shiftStart.getTime();
          return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
        })()
      : 0;

  const handleStartShiftClick = () => {
    if (!user) {
      alert("User not authenticated");
      return;
    }

    if (!todaySchedule) {
      alert("No schedule found for today. Please contact your manager.");
      return;
    }

    // Validate shift timing
    const now = new Date();
    const scheduledStart = new Date(todaySchedule.startTime);
    const timeDifference = now.getTime() - scheduledStart.getTime();
    const minutesDifference = timeDifference / (1000 * 60);

    // Allow starting 15 minutes early or up to 30 minutes late
    const EARLY_START_MINUTES = 15;
    const LATE_START_MINUTES = 30;

    if (minutesDifference < -EARLY_START_MINUTES) {
      const minutesUntilStart = Math.ceil(-minutesDifference);
      alert(
        `Cannot start shift yet. Your shift is scheduled to start at ${scheduledStart.toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }
        )}. Please wait ${minutesUntilStart} more minutes.`
      );
      return;
    }

    if (minutesDifference > LATE_START_MINUTES) {
      const minutesLate = Math.floor(minutesDifference);
      setLateStartMinutes(minutesLate);
      setShowLateStartConfirm(true);
      return;
    }

    // Show start shift dialog
    setStartingCash("");
    setShowStartShiftDialog(true);
  };

  const confirmStartShift = async () => {
    try {
      if (!startingCash || isNaN(Number(startingCash))) {
        alert("Please enter a valid cash amount");
        return;
      }

      const response = await window.shiftAPI.start({
        scheduleId: todaySchedule?.id,
        cashierId: user!.id,
        businessId: user!.businessId,
        startingCash: Number(startingCash),
      });

      if (response.success && response.data) {
        const shiftData = response.data as Shift;
        setActiveShift(shiftData);
        setShiftStats({
          totalTransactions: 0,
          totalSales: 0,
          totalRefunds: 0,
          totalVoids: 0,
        });
        setShowStartShiftDialog(false);
        setShowLateStartConfirm(false);
      } else {
        alert(response.message || "Failed to start shift");
      }
    } catch (error) {
      console.error("Failed to start shift:", error);
      alert("Failed to start shift. Please try again.");
    }
  };

  const confirmLateStart = () => {
    setShowLateStartConfirm(false);
    setStartingCash("");
    setShowStartShiftDialog(true);
  };

  const handleEndShiftClick = () => {
    if (!activeShift) {
      alert("No active shift to end");
      return;
    }

    setFinalCash("");
    setShowEndShiftDialog(true);
  };

  const confirmEndShift = async () => {
    try {
      if (!finalCash || isNaN(Number(finalCash))) {
        alert("Please enter a valid cash amount");
        return;
      }

      const response = await window.shiftAPI.end(activeShift!.id, {
        finalCashDrawer: Number(finalCash),
        expectedCashDrawer:
          activeShift!.startingCash + (shiftStats.totalSales || 0),
        totalSales: shiftStats.totalSales || 0,
        totalTransactions: shiftStats.totalTransactions || 0,
        totalRefunds: shiftStats.totalRefunds || 0,
        totalVoids: shiftStats.totalVoids || 0,
        notes:
          overtimeMinutes > 0
            ? `Overtime: ${overtimeMinutes} minutes`
            : undefined,
      });

      if (response.success) {
        setActiveShift(null);
        setShiftStats({
          totalTransactions: 0,
          totalSales: 0,
          totalRefunds: 0,
          totalVoids: 0,
        });
        setShowEndShiftDialog(false);
        setShowOvertimeWarning(false);
        setOvertimeMinutes(0);
      } else {
        alert(response.message || "Failed to end shift");
      }
    } catch (error) {
      console.error("Failed to end shift:", error);
      alert("Failed to end shift. Please try again.");
    }
  };

  if (!user) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading shift data...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Overtime Warning Banner */}
      {showOvertimeWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border border-red-300 p-4 rounded-lg mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">
                  Shift Overtime Warning
                </h3>
                <p className="text-sm text-red-700">
                  Your shift is {overtimeMinutes} minutes past the scheduled end
                  time. Please end your shift as soon as possible.
                  {overtimeMinutes >= 60 && (
                    <span className="font-medium">
                      {" "}
                      Shifts exceeding 2 hours overtime will be automatically
                      ended.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={handleEndShiftClick}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              End Shift Now
            </Button>
          </div>
        </motion.div>
      )}

      {/* Shift Status Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-lg">
              {activeShift ? "Current Shift" : "No Active Shift"}
            </h2>
            <p className="text-slate-600">
              {activeShift ? (
                <>
                  Started at{" "}
                  {new Date(activeShift.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  • Ends at{" "}
                  {todaySchedule
                    ? new Date(todaySchedule.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "--:--"}
                </>
              ) : todaySchedule ? (
                (() => {
                  const startDate = new Date(todaySchedule.startTime);
                  const endDate = new Date(todaySchedule.endTime);

                  const formatOptions = {
                    hour: "2-digit" as const,
                    minute: "2-digit" as const,
                    hour12: true,
                  };

                  const startTimeStr = startDate.toLocaleTimeString(
                    [],
                    formatOptions
                  );
                  const endTimeStr = endDate.toLocaleTimeString(
                    [],
                    formatOptions
                  );

                  // Check if shift goes into the next day
                  const isOvernightShift =
                    endDate.getDate() !== startDate.getDate();

                  if (isOvernightShift) {
                    const endDayName = endDate.toLocaleDateString([], {
                      weekday: "short",
                    });
                    return `Scheduled: ${startTimeStr} - ${endTimeStr} (${endDayName})`;
                  } else {
                    return `Scheduled: ${startTimeStr} - ${endTimeStr}`;
                  }
                })()
              ) : (
                "No schedule found for today"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" />
            <span
              className={`font-medium ${
                overtimeMinutes > 0 ? "text-red-600" : ""
              }`}
            >
              {activeShift && todaySchedule
                ? (() => {
                    const now = new Date();
                    const scheduleEnd = new Date(todaySchedule.endTime);
                    const timeRemaining = scheduleEnd.getTime() - now.getTime();
                    const hoursRemaining = Math.floor(
                      timeRemaining / (1000 * 60 * 60)
                    );
                    const minutesRemaining = Math.floor(
                      (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
                    );

                    if (overtimeMinutes > 0) {
                      const overtimeHours = Math.floor(overtimeMinutes / 60);
                      const overtimeMinutesDisplay = overtimeMinutes % 60;
                      return overtimeHours > 0
                        ? `${overtimeHours}h ${overtimeMinutesDisplay}m overtime`
                        : `${overtimeMinutesDisplay}m overtime`;
                    }

                    return timeRemaining > 0
                      ? `${hoursRemaining}h ${minutesRemaining}m remaining`
                      : "Shift overtime";
                  })()
                : todaySchedule
                ? shiftTimingInfo.reason
                : "No active shift"}
            </span>
          </div>
          <div className="flex gap-2">
            {!activeShift ? (
              <Button
                variant="outline"
                onClick={handleStartShiftClick}
                className={`border-slate-300 ${
                  !shiftTimingInfo.canStart ? "opacity-50" : ""
                }`}
                disabled={!todaySchedule || !shiftTimingInfo.canStart}
                title={shiftTimingInfo.reason}
              >
                {shiftTimingInfo.buttonText}
              </Button>
            ) : (
              <Button
                onClick={handleEndShiftClick}
                className={
                  overtimeMinutes > 0
                    ? "bg-red-600 hover:bg-red-700 animate-pulse"
                    : "bg-green-600 hover:bg-green-700"
                }
              >
                {overtimeMinutes > 0 ? "End Shift (Overtime)" : "End Shift"}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3">
          <Progress
            value={overtimeMinutes > 0 ? 100 : shiftProgress}
            className={`bg-slate-200 ${
              overtimeMinutes > 0 ? "[&>div]:bg-red-500" : ""
            }`}
          />
          {overtimeMinutes > 0 && (
            <div className="flex justify-between text-xs text-red-600 mt-1">
              <span>Overtime: {overtimeMinutes} minutes</span>
              <span>Auto-end in {120 - overtimeMinutes} minutes</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {/* Today's Sales Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white border-slate-200 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                <span className="text-slate-700">Today's Sales</span>
                <DollarSign className="h-5 w-5 text-green-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                £{(shiftStats.totalSales || 0).toFixed(2)}
              </div>
              <div className="flex items-center mt-2 text-sm text-slate-600">
                <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                <span>{shiftStats.totalTransactions || 0} transactions</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Average: £{averageTransaction.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white border-slate-200 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                <span className="text-slate-700">Transactions</span>
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {shiftStats.totalTransactions || 0}
              </div>
              <div className="flex items-center mt-2 text-sm text-slate-600">
                <Clock className="h-4 w-4 mr-1 text-blue-500" />
                <span>This shift</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Last hour: 12 transactions
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cash Drawer Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white border-slate-200 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                <span className="text-slate-700">Cash Drawer</span>
                <DollarSign className="h-5 w-5 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">
                £
                {(
                  (activeShift?.finalCashDrawer ||
                    activeShift?.startingCash ||
                    0) + (shiftStats.totalSales || 0)
                ).toFixed(2)}
              </div>
              <div
                className={`flex items-center mt-2 text-sm ${
                  cashVariance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {cashVariance >= 0 ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-1" />
                )}
                <span>Variance: £{Math.abs(cashVariance).toFixed(2)}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Starting: £{(activeShift?.startingCash || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Refunds & Voided */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white border-slate-200 shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                <span className="text-slate-700">Adjustments</span>
                <RefreshCw className="h-5 w-5 text-red-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Refunds:</span>
                <span className="font-semibold text-red-700">
                  -£{(shiftStats.totalRefunds || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Voided Transactions:</span>
                <span className="font-semibold text-red-700">
                  {shiftStats.totalVoids || 0}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Total adjustments:{" "}
                {(shiftStats.totalVoids || 0) +
                  ((shiftStats.totalRefunds || 0) > 0 ? 1 : 0)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700">
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="mb-2">
                    <ShoppingCart className="h-8 w-8 mx-auto opacity-50" />
                  </div>
                  <p className="text-sm">No recent transactions</p>
                  <p className="text-xs mt-1">
                    Transactions will appear here once processed
                  </p>
                </div>
              ) : (
                transactions.map((transaction: Transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                      p-2 rounded-full
                      ${
                        transaction.type === "sale"
                          ? "bg-green-100 text-green-600"
                          : ""
                      }
                      ${
                        transaction.type === "refund"
                          ? "bg-red-100 text-red-600"
                          : ""
                      }
                      ${
                        transaction.type === "void"
                          ? "bg-amber-100 text-amber-600"
                          : ""
                      }
                    `}
                      >
                        {transaction.type === "sale" && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {transaction.type === "refund" && (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        {transaction.type === "void" && (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          #{transaction.receiptNumber}
                        </div>
                        <div className="text-sm text-slate-500">
                          {new Date(transaction.timestamp).toLocaleString()} •{" "}
                          {transaction.items.length} items
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-semibold ${
                          transaction.type === "sale"
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {transaction.type === "sale" ? "+" : "-"}£
                        {transaction.total.toFixed(2)}
                      </div>
                      <Badge
                        variant="outline"
                        className={`
                      text-xs
                      ${
                        transaction.paymentMethod === "cash"
                          ? "bg-amber-50 text-amber-700"
                          : ""
                      }
                      ${
                        transaction.paymentMethod === "card"
                          ? "bg-blue-50 text-blue-700"
                          : ""
                      }
                      ${
                        transaction.paymentMethod === "mixed"
                          ? "bg-purple-50 text-purple-700"
                          : ""
                      }
                    `}
                      >
                        {transaction.paymentMethod}
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Statistics */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!activeShift && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-800 font-medium">
                      Start your shift to access quick actions
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => activeShift && setShowRefundView(true)}
                  variant="outline"
                  className={`h-16 flex flex-col border-slate-300 ${
                    !activeShift ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={!activeShift}
                  title={
                    !activeShift ? "Start your shift to process refunds" : ""
                  }
                >
                  <RefreshCw className="h-5 w-5 mb-1" />
                  <span className="text-xs">Process Refund</span>
                </Button>
                <Button
                  variant="outline"
                  className={`h-16 flex flex-col border-slate-300 ${
                    !activeShift ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={!activeShift}
                  title={
                    !activeShift ? "Start your shift to void transactions" : ""
                  }
                >
                  <XCircle className="h-5 w-5 mb-1" />
                  <span className="text-xs">Void Transaction</span>
                </Button>
                <Button
                  variant="outline"
                  className={`h-16 flex flex-col border-slate-300 ${
                    !activeShift ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={!activeShift}
                  title={
                    !activeShift ? "Start your shift to access cash drawer" : ""
                  }
                >
                  <DollarSign className="h-5 w-5 mb-1" />
                  <span className="text-xs">Cash Drawer Count</span>
                </Button>
                <Button
                  onClick={activeShift ? onNewTransaction : undefined}
                  variant="outline"
                  className={`h-16 flex flex-col border-slate-300 ${
                    !activeShift ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={!activeShift}
                  title={
                    !activeShift
                      ? "Start your shift to process transactions"
                      : ""
                  }
                >
                  <ShoppingCart className="h-5 w-5 mb-1" />
                  <span className="text-xs">New Transaction</span>
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-medium mb-2">Shift Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Transactions per hour:</span>
                    <span
                      className={`font-medium ${
                        !activeShift ? "text-slate-400" : ""
                      }`}
                    >
                      {activeShift
                        ? (() => {
                            if (
                              !activeShift.startTime ||
                              shiftStats.totalTransactions === 0
                            )
                              return "0.0";
                            const shiftStart = new Date(activeShift.startTime);
                            const now = new Date();
                            const hoursWorked =
                              (now.getTime() - shiftStart.getTime()) /
                              (1000 * 60 * 60);
                            return hoursWorked > 0
                              ? (
                                  shiftStats.totalTransactions / hoursWorked
                                ).toFixed(1)
                              : "0.0";
                          })()
                        : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average basket size:</span>
                    <span
                      className={`font-medium ${
                        !activeShift ? "text-slate-400" : ""
                      }`}
                    >
                      {activeShift ? `£${averageTransaction.toFixed(2)}` : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cash vs Card ratio:</span>
                    <span
                      className={`font-medium ${
                        !activeShift ? "text-slate-400" : ""
                      }`}
                    >
                      {activeShift ? "-- / --" : "--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Start Shift Dialog */}
      <Dialog
        open={showStartShiftDialog}
        onOpenChange={setShowStartShiftDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Shift</DialogTitle>
            <DialogDescription>
              Enter the starting cash amount for your shift.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="starting-cash" className="text-right">
                Starting Cash
              </Label>
              <Input
                id="starting-cash"
                type="number"
                step="0.01"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStartShiftDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmStartShift}>Start Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Shift Dialog */}
      <Dialog open={showEndShiftDialog} onOpenChange={setShowEndShiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Shift</DialogTitle>
            <DialogDescription>
              Enter the final cash drawer amount to end your shift.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="final-cash" className="text-right">
                Final Cash
              </Label>
              <Input
                id="final-cash"
                type="number"
                step="0.01"
                value={finalCash}
                onChange={(e) => setFinalCash(e.target.value)}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            {activeShift && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Expected: £
                  {(
                    activeShift.startingCash + (shiftStats.totalSales || 0)
                  ).toFixed(2)}
                </p>
                <p>Starting Cash: £{activeShift.startingCash.toFixed(2)}</p>
                <p>Sales Total: £{(shiftStats.totalSales || 0).toFixed(2)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndShiftDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmEndShift}>End Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Late Start Confirmation Dialog */}
      <Dialog
        open={showLateStartConfirm}
        onOpenChange={setShowLateStartConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Late Shift Start</DialogTitle>
            <DialogDescription>
              You are {lateStartMinutes} minutes late for your scheduled shift.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              Do you want to start your shift now and mark it as a late start?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLateStartConfirm(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmLateStart}>Start Late</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Transaction Modal */}
      <RefundTransactionView
        isOpen={showRefundView}
        onClose={() => setShowRefundView(false)}
        onRefundProcessed={() => {
          // Refresh dashboard data after successful refund
          setShowRefundView(false);
          loadShiftData(); // Refresh shift stats and recent transactions
        }}
      />
    </>
  );
};

export default CashierDashboardView;
