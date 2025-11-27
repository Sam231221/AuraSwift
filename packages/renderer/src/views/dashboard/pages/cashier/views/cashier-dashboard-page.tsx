import { useState, useEffect, useCallback, memo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

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
interface Transaction {
  id: string;
  receiptNumber: string;
  timestamp: string;
  total: number;
  paymentMethod: "cash" | "card" | "mixed";
  items: TransactionItem[];
  type: "sale" | "refund" | "void";
  status: "completed" | "voided" | "pending";
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
  scheduleId?: string; // Links to the planned schedule
  cashierId: string;
  businessId: string;
  startTime: string; // ACTUAL clock-in time (when cashier really started)
  endTime?: string; // ACTUAL clock-out time (when cashier really ended)
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
  startTime: string; // PLANNED start time (what manager scheduled)
  endTime: string; // PLANNED end time (what manager scheduled - can be updated live)
  status: "upcoming" | "active" | "completed" | "missed";
  assignedRegister?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string; // Changes when manager modifies scheduled times
}

interface ShiftStats {
  totalTransactions: number;
  totalSales: number;
  totalRefunds: number;
  totalVoids: number;
}
interface CashierDashboardPageProps {
  onNewTransaction: () => void;
}
const CashierDashboardPage = ({
  onNewTransaction,
}: CashierDashboardPageProps) => {
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
  const [hourlyStats, setHourlyStats] = useState<{
    lastHour: number;
    currentHour: number;
    averagePerHour: number;
  }>({
    lastHour: 0,
    currentHour: 0,
    averagePerHour: 0,
  });
  const [cashDrawerBalance, setCashDrawerBalance] = useState<{
    amount: number;
    isEstimated: boolean;
    lastCountTime?: string;
    variance?: number;
  }>({
    amount: 0,
    isEstimated: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Load shift data function with smart updates to prevent flickering
  const loadShiftData = useCallback(
    async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setIsLoading(true);
        }

        if (!user?.id) return;

        // Load active shift
        const activeShiftResponse = await window.shiftAPI.getActive(user.id);
        if (activeShiftResponse.success && activeShiftResponse.data) {
          const shiftData = activeShiftResponse.data as Shift;

          // Only update if data has actually changed
          setActiveShift((prevShift) => {
            if (
              !prevShift ||
              JSON.stringify(prevShift) !== JSON.stringify(shiftData)
            ) {
              return shiftData;
            }
            return prevShift;
          });

          // Load shift stats if shift is active
          const statsResponse = await window.shiftAPI.getStats(shiftData.id);
          if (statsResponse.success && statsResponse.data) {
            const newStats = statsResponse.data as ShiftStats;
            setShiftStats((prevStats) => {
              if (JSON.stringify(prevStats) !== JSON.stringify(newStats)) {
                return newStats;
              }
              return prevStats;
            });
          }

          // Load hourly stats if shift is active
          const hourlyStatsResponse = await window.shiftAPI.getHourlyStats(
            shiftData.id
          );
          if (hourlyStatsResponse.success && hourlyStatsResponse.data) {
            const newHourlyStats = hourlyStatsResponse.data as {
              lastHour: number;
              currentHour: number;
              averagePerHour: number;
            };
            setHourlyStats((prevHourlyStats) => {
              if (
                JSON.stringify(prevHourlyStats) !==
                JSON.stringify(newHourlyStats)
              ) {
                return newHourlyStats;
              }
              return prevHourlyStats;
            });
          }

          // Load cash drawer balance if shift is active
          const cashBalanceResponse =
            await window.shiftAPI.getCashDrawerBalance(shiftData.id);
          if (cashBalanceResponse.success && cashBalanceResponse.data) {
            const newCashBalance = cashBalanceResponse.data as {
              amount: number;
              isEstimated: boolean;
              lastCountTime?: string;
              variance?: number;
            };
            setCashDrawerBalance((prevCashBalance) => {
              if (
                JSON.stringify(prevCashBalance) !==
                JSON.stringify(newCashBalance)
              ) {
                return newCashBalance;
              }
              return prevCashBalance;
            });
          }
        } else {
          // Only update if currently there is an active shift
          setActiveShift((prevShift) => (prevShift ? null : prevShift));
          setHourlyStats((prevStats) => {
            const defaultStats = {
              lastHour: 0,
              currentHour: 0,
              averagePerHour: 0,
            };
            if (JSON.stringify(prevStats) !== JSON.stringify(defaultStats)) {
              return defaultStats;
            }
            return prevStats;
          });
          setCashDrawerBalance((prevBalance) => {
            const defaultBalance = {
              amount: 0,
              isEstimated: true,
            };
            if (
              JSON.stringify(prevBalance) !== JSON.stringify(defaultBalance)
            ) {
              return defaultBalance;
            }
            return prevBalance;
          });
        }

        // Load today's schedule
        const scheduleResponse = await window.shiftAPI.getTodaySchedule(
          user.id
        );
        if (scheduleResponse.success && scheduleResponse.data) {
          const newSchedule = scheduleResponse.data as Schedule;
          setTodaySchedule((prevSchedule) => {
            if (!prevSchedule) return newSchedule;

            const now = new Date();
            const scheduleEnd = prevSchedule
              ? new Date(prevSchedule.endTime)
              : null;
            const isCurrentShiftEnded = scheduleEnd && scheduleEnd < now;

            // If current displayed shift is ended and we have a new schedule, show the new one
            if (isCurrentShiftEnded && newSchedule.startTime) {
              const newShiftStart = new Date(newSchedule.startTime);
              // Only update to new schedule if it's for a future or current shift
              if (newShiftStart > scheduleEnd) {
                return newSchedule;
              }
            }

            // If the data is actually different and the new schedule is current/upcoming, update it
            if (JSON.stringify(prevSchedule) !== JSON.stringify(newSchedule)) {
              const newShiftStart = new Date(newSchedule.startTime);
              const newShiftEnd = new Date(newSchedule.endTime);

              // Only show the new schedule if:
              // 1. It's a future shift, or
              // 2. It's currently active, or
              // 3. It's more recent than the current displayed shift
              if (
                newShiftStart > now || // Future shift
                (newShiftStart <= now && newShiftEnd > now) || // Current shift
                (scheduleEnd && newShiftStart > scheduleEnd)
              ) {
                // More recent shift
                return newSchedule;
              }
            }

            return prevSchedule;
          });
        } else {
          setTodaySchedule((prevSchedule) =>
            prevSchedule ? null : prevSchedule
          );
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
            const newTransactions = transactionsData.transactions || [];
            setTransactions((prevTransactions) => {
              if (
                JSON.stringify(prevTransactions) !==
                JSON.stringify(newTransactions)
              ) {
                return newTransactions;
              }
              return prevTransactions;
            });
          }
        } catch (transactionError) {
          console.error(
            "Failed to load recent transactions:",
            transactionError
          );
          // Don't fail the entire load if transactions fail
          setTransactions([]);
        }
      } catch (error) {
        console.error("Failed to load shift data:", error);
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
        }
      }
    },
    [user?.id, user?.businessId]
  );

  // Load shift data on component mount
  useEffect(() => {
    loadShiftData(true); // Initial load with loading indicator

    // Refresh data every 30 seconds to pick up schedule changes made by manager
    // This ensures that when manager extends end time (e.g., 9 PM to 10 PM),
    // cashier dashboard updates live while preserving actual work times
    const interval = setInterval(() => {
      // Only refresh if component is still mounted and user is authenticated
      if (user?.id) {
        loadShiftData(false); // Background refresh without loading indicator
      }
    }, 30000); // Reduced frequency from 2 seconds to 30 seconds to prevent flickering
    return () => clearInterval(interval);
  }, [loadShiftData, user?.id]);

  // Calculate derived values
  const averageTransaction =
    shiftStats.totalTransactions > 0
      ? shiftStats.totalSales / shiftStats.totalTransactions
      : 0;

  if (!user) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="text-gray-600 text-sm sm:text-base">
            Loading shift data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 p-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Today's Sales Total */}

        <Card className="bg-white border-slate-200 shadow-sm h-full">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center justify-between text-sm sm:text-base font-semibold">
              <span className="text-slate-700">Today's Sales</span>
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-700">
              £{(shiftStats.totalSales || 0).toFixed(2)}
            </div>
            <div className="flex items-center mt-2 text-xs sm:text-sm text-slate-600">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-500 shrink-0" />
              <span>{shiftStats.totalTransactions || 0} transactions</span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 mt-1">
              Average: £{averageTransaction.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Count */}

        <Card className="bg-white border-slate-200 shadow-sm h-full">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center justify-between text-sm sm:text-base font-semibold">
              <span className="text-slate-700">Transactions</span>
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-700">
              {shiftStats.totalTransactions || 0}
            </div>
            <div className="flex items-center mt-2 text-xs sm:text-sm text-slate-600">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-blue-500 shrink-0" />
              <span>This shift</span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 mt-1">
              Last hour: {hourlyStats.lastHour} transactions
            </div>
          </CardContent>
        </Card>

        {/* Cash Drawer Balance */}

        <Card className="bg-white border-slate-200 shadow-sm h-full">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center justify-between text-sm sm:text-base font-semibold">
              <span className="text-slate-700">Cash Drawer</span>
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-amber-700">
              £{cashDrawerBalance.amount.toFixed(2)}
              {cashDrawerBalance.isEstimated && (
                <span className="text-[10px] sm:text-xs text-amber-600 ml-1">
                  (est.)
                </span>
              )}
            </div>
            <div
              className={`flex items-center mt-2 text-xs sm:text-sm ${
                (cashDrawerBalance.variance || 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {(cashDrawerBalance.variance || 0) >= 0 ? (
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 shrink-0" />
              ) : (
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 shrink-0" />
              )}
              <span>
                Variance: £
                {Math.abs(cashDrawerBalance.variance || 0).toFixed(2)}
                {cashDrawerBalance.isEstimated && " (est.)"}
              </span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 mt-1">
              {cashDrawerBalance.lastCountTime ? (
                <>
                  Last count:{" "}
                  {new Date(cashDrawerBalance.lastCountTime).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }
                  )}
                </>
              ) : (
                <>Starting: £{(activeShift?.startingCash || 0).toFixed(2)}</>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Refunds & Voided */}

        <Card className="bg-white border-slate-200 shadow-sm h-full">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center justify-between text-sm sm:text-base font-semibold">
              <span className="text-slate-700">Adjustments</span>
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2 text-xs sm:text-sm">
              <span className="text-slate-600">Refunds:</span>
              <span className="font-semibold text-red-700">
                -£{(shiftStats.totalRefunds || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-slate-600">Voided Transactions:</span>
              <span className="font-semibold text-red-700">
                {shiftStats.totalVoids || 0}
              </span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 mt-2">
              Total adjustments:{" "}
              {(shiftStats.totalVoids || 0) +
                ((shiftStats.totalRefunds || 0) > 0 ? 1 : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Transactions */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold text-slate-700">
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-slate-500">
                  <div className="mb-2">
                    <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 mx-auto opacity-50" />
                  </div>
                  <p className="text-xs sm:text-sm">No recent transactions</p>
                  <p className="text-[10px] sm:text-xs mt-1">
                    Transactions will appear here once processed
                  </p>
                </div>
              ) : (
                transactions.map((transaction: Transaction) => (
                  <div key={transaction.id}>
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
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        {transaction.type === "refund" && (
                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        {transaction.type === "void" && (
                          <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs sm:text-sm truncate">
                          #{transaction.receiptNumber}
                        </div>
                        <div className="text-[10px] sm:text-xs text-slate-500 truncate">
                          {new Date(transaction.timestamp).toLocaleString()} •{" "}
                          {transaction.items.length} items
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`font-semibold text-xs sm:text-sm ${
                          transaction.type === "sale"
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {transaction.type === "sale"
                          ? `+£${Math.abs(transaction.total).toFixed(2)}`
                          : `-£${Math.abs(transaction.total).toFixed(2)}`}
                      </div>
                      <Badge
                        variant="outline"
                        className={`
                      text-[10px] sm:text-xs mt-1
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
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Statistics */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold text-slate-700">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {!activeShift && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 shrink-0" />
                    <span className="text-xs sm:text-sm text-amber-800 font-medium">
                      Start your shift to access quick actions
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button
                  onClick={onNewTransaction}
                  variant="outline"
                  className={`h-14 sm:h-16 flex flex-col border-slate-300 touch-manipulation`}
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mb-1 shrink-0" />
                  <span className="text-[10px] sm:text-xs">
                    New Transaction
                  </span>
                </Button>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-slate-200">
                <h3 className="font-medium mb-2 text-sm sm:text-base">
                  Shift Performance
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
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
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Average basket size:</span>
                    <span
                      className={`font-medium ${
                        !activeShift ? "text-slate-400" : ""
                      }`}
                    >
                      {activeShift ? `£${averageTransaction.toFixed(2)}` : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
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
    </>
  );
};

export default memo(CashierDashboardPage);
