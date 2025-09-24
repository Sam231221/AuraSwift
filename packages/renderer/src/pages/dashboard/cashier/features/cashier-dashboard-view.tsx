import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

// TypeScript interfaces
interface Transaction {
  id: string;
  amount: number;
  time: string;
  items: number;
  paymentMethod: "cash" | "card" | "mobile";
  status: "completed" | "refunded" | "voided";
}

interface ShiftInfo {
  startTime: string;
  expectedEnd: string;
  cashDrawerStart: number;
  cashDrawerCurrent: number;
  transactionCount: number;
  totalSales: number;
  refundAmount: number;
  voidedTransactions: number;
}
interface CashierDashboardViewProps {
  onNewTransaction: () => void;
}
const CashierDashboardView = ({
  onNewTransaction,
}: CashierDashboardViewProps) => {
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo>({
    startTime: "08:00 AM",
    expectedEnd: "04:00 PM",
    cashDrawerStart: 200.0,
    cashDrawerCurrent: 1543.75,
    transactionCount: 47,
    totalSales: 1343.75,
    refundAmount: 45.5,
    voidedTransactions: 2,
  });

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([
    {
      id: "1001",
      amount: 45.32,
      time: "10:15 AM",
      items: 8,
      paymentMethod: "card",
      status: "completed",
    },
    {
      id: "1002",
      amount: 23.17,
      time: "10:22 AM",
      items: 3,
      paymentMethod: "cash",
      status: "completed",
    },
    {
      id: "1003",
      amount: 67.89,
      time: "10:35 AM",
      items: 12,
      paymentMethod: "mobile",
      status: "completed",
    },
    {
      id: "1004",
      amount: 12.5,
      time: "10:40 AM",
      items: 2,
      paymentMethod: "card",
      status: "refunded",
    },
    {
      id: "1005",
      amount: 89.43,
      time: "10:55 AM",
      items: 15,
      paymentMethod: "cash",
      status: "completed",
    },
  ]);

  // Calculate metrics
  const cashVariance =
    shiftInfo.cashDrawerCurrent -
    (shiftInfo.cashDrawerStart + shiftInfo.totalSales);
  const averageTransaction =
    shiftInfo.transactionCount > 0
      ? shiftInfo.totalSales / shiftInfo.transactionCount
      : 0;
  const shiftProgress = 65; // Example progress percentage

  const startShift = () => {
    setShiftInfo((prev) => ({
      ...prev,
      startTime: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      cashDrawerCurrent: prev.cashDrawerStart,
      transactionCount: 0,
      totalSales: 0,
      refundAmount: 0,
      voidedTransactions: 0,
    }));
    setRecentTransactions([]);
  };

  const endShift = () => {
    // In a real app, this would trigger shift closing procedures
    alert("Shift ending procedure initiated. Please count cash drawer.");
  };
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/");
    return;
  }

  return (
    <>
      {/* Shift Status Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-lg">Current Shift</h2>
            <p className="text-slate-600">
              Started at {shiftInfo.startTime} • Ends at {shiftInfo.expectedEnd}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" />
            <span className="font-medium">4h 22m remaining</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={startShift}
              className="border-slate-300"
            >
              Start Shift
            </Button>
            <Button
              onClick={endShift}
              className="bg-green-600 hover:bg-green-700"
            >
              End Shift
            </Button>
          </div>
        </div>
        <Progress value={shiftProgress} className="mt-3 bg-slate-200" />
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
                ${shiftInfo.totalSales.toFixed(2)}
              </div>
              <div className="flex items-center mt-2 text-sm text-slate-600">
                <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                <span>{shiftInfo.transactionCount} transactions</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Average: ${averageTransaction.toFixed(2)}
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
                {shiftInfo.transactionCount}
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
                ${shiftInfo.cashDrawerCurrent.toFixed(2)}
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
                <span>Variance: ${Math.abs(cashVariance).toFixed(2)}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Starting: ${shiftInfo.cashDrawerStart.toFixed(2)}
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
                  -${shiftInfo.refundAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Voided Transactions:</span>
                <span className="font-semibold text-red-700">
                  {shiftInfo.voidedTransactions}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Total adjustments:{" "}
                {shiftInfo.voidedTransactions +
                  (shiftInfo.refundAmount > 0 ? 1 : 0)}
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
              {recentTransactions.map((transaction) => (
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
                        transaction.status === "completed"
                          ? "bg-green-100 text-green-600"
                          : ""
                      }
                      ${
                        transaction.status === "refunded"
                          ? "bg-red-100 text-red-600"
                          : ""
                      }
                      ${
                        transaction.status === "voided"
                          ? "bg-amber-100 text-amber-600"
                          : ""
                      }
                    `}
                    >
                      {transaction.status === "completed" && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {transaction.status === "refunded" && (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      {transaction.status === "voided" && (
                        <XCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        Transaction #{transaction.id}
                      </div>
                      <div className="text-sm text-slate-500">
                        {transaction.time} • {transaction.items} items
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        transaction.status === "completed"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {transaction.status === "completed" ? "+" : "-"}$
                      {transaction.amount.toFixed(2)}
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
                        transaction.paymentMethod === "mobile"
                          ? "bg-purple-50 text-purple-700"
                          : ""
                      }
                    `}
                    >
                      {transaction.paymentMethod}
                    </Badge>
                  </div>
                </motion.div>
              ))}
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
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-16 flex flex-col border-slate-300"
                >
                  <RefreshCw className="h-5 w-5 mb-1" />
                  <span className="text-xs">Process Refund</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col border-slate-300"
                >
                  <XCircle className="h-5 w-5 mb-1" />
                  <span className="text-xs">Void Transaction</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col border-slate-300"
                >
                  <DollarSign className="h-5 w-5 mb-1" />
                  <span className="text-xs">Cash Drawer Count</span>
                </Button>
                <Button
                  onClick={onNewTransaction}
                  variant="outline"
                  className="h-16 flex flex-col border-slate-300"
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
                    <span className="font-medium">10.7</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average basket size:</span>
                    <span className="font-medium">$28.59</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cash vs Card ratio:</span>
                    <span className="font-medium">42% / 58%</span>
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

export default CashierDashboardView;
