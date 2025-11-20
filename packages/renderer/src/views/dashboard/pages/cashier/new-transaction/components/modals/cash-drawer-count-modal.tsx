import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/shared/hooks/use-auth";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icons
import {
  X,
  Calculator,
  DollarSign,
  AlertTriangle,
  Shield,
  Coins,
} from "lucide-react";

// Types
interface CashDenomination {
  value: number;
  count: number;
  total: number;
  label: string;
  type: "note" | "coin";
}

interface CashDrawerCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCountComplete: () => void;
  activeShiftId: string | null;
  countType: "opening" | "mid-shift" | "closing" | "spot-check";
  startingCash?: number;
}

const CASH_DENOMINATIONS: Omit<CashDenomination, "count" | "total">[] = [
  // Notes (highest to lowest)
  { value: 50, label: "£50", type: "note" },
  { value: 20, label: "£20", type: "note" },
  { value: 10, label: "£10", type: "note" },
  { value: 5, label: "£5", type: "note" },
  // Coins (highest to lowest)
  { value: 2, label: "£2", type: "coin" },
  { value: 1, label: "£1", type: "coin" },
  { value: 0.5, label: "50p", type: "coin" },
  { value: 0.2, label: "20p", type: "coin" },
  { value: 0.1, label: "10p", type: "coin" },
  { value: 0.05, label: "5p", type: "coin" },
  { value: 0.02, label: "2p", type: "coin" },
  { value: 0.01, label: "1p", type: "coin" },
];

const DISCREPANCY_THRESHOLD = 5.0; // £5 threshold for manager approval

const CashDrawerCountModal: React.FC<CashDrawerCountModalProps> = ({
  isOpen,
  onClose,
  onCountComplete,
  activeShiftId,
  countType,
  startingCash = 0,
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<
    "count" | "review" | "processing"
  >("count");
  const [denominations, setDenominations] = useState<CashDenomination[]>([]);
  const [expectedCash, setExpectedCash] = useState<number>(0);
  const [countedTotal, setCountedTotal] = useState<number>(0);
  const [discrepancy, setDiscrepancy] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const [requiresManagerApproval, setRequiresManagerApproval] = useState(false);
  const [showManagerDialog, setShowManagerDialog] = useState(false);
  const [managerPin, setManagerPin] = useState("");

  const { user } = useAuth();

  // Load expected cash amount
  const loadExpectedCash = useCallback(async () => {
    if (!activeShiftId) return;

    try {
      setIsLoading(true);
      const response = await window.cashDrawerAPI.getExpectedCash(
        activeShiftId
      );
      if (response.success && response.data) {
        const expectedData = response.data as { expectedAmount: number };
        setExpectedCash(expectedData.expectedAmount || startingCash);
      } else {
        setExpectedCash(startingCash);
      }
    } catch (error) {
      console.error("Failed to load expected cash:", error);
      setExpectedCash(startingCash);
    } finally {
      setIsLoading(false);
    }
  }, [activeShiftId, startingCash]);

  // Initialize denominations
  useEffect(() => {
    if (isOpen) {
      const initialDenominations = CASH_DENOMINATIONS.map((denom) => ({
        ...denom,
        count: 0,
        total: 0,
      }));
      setDenominations(initialDenominations);
      setCurrentStep("count");
      loadExpectedCash();
    }
  }, [isOpen, countType, loadExpectedCash]);

  // Calculate counted total when denominations change
  useEffect(() => {
    const total = denominations.reduce((sum, denom) => sum + denom.total, 0);
    setCountedTotal(total);
  }, [denominations]);

  // Calculate discrepancy
  useEffect(() => {
    const diff = countedTotal - expectedCash;
    setDiscrepancy(diff);
    setRequiresManagerApproval(Math.abs(diff) > DISCREPANCY_THRESHOLD);
  }, [countedTotal, expectedCash]);

  // Update denomination count
  const updateDenominationCount = (index: number, count: string) => {
    const newCount = parseInt(count) || 0;
    setDenominations((prev) =>
      prev.map((denom, i) =>
        i === index
          ? {
              ...denom,
              count: newCount,
              total: newCount * denom.value,
            }
          : denom
      )
    );
  };

  // Reset modal state
  const resetModal = useCallback(() => {
    setCurrentStep("count");
    setDenominations([]);
    setExpectedCash(0);
    setCountedTotal(0);
    setDiscrepancy(0);
    setNotes("");
    setRequiresManagerApproval(false);
    setShowManagerDialog(false);
    setManagerPin("");
    onClose();
  }, [onClose]);

  // Proceed to review step
  const proceedToReview = () => {
    setCurrentStep("review");
  };

  // Execute cash count with or without manager approval
  const executeCount = useCallback(
    async (managerApprovalId?: string) => {
      if (!activeShiftId || !user?.id) {
        return;
      }

      try {
        setCurrentStep("processing");
        setIsLoading(true);

        const countData = {
          shiftId: activeShiftId,
          countType,
          expectedAmount: expectedCash,
          countedAmount: countedTotal,
          variance: discrepancy,
          notes: notes.trim() || undefined,
          countedBy: user.id,
          denominations: denominations.filter((d) => d.count > 0),
          managerApprovalId,
        };

        const response = await window.cashDrawerAPI.createCount(countData);

        if (response.success) {
          toast.success("Cash drawer count recorded successfully");
          onCountComplete();
          resetModal();
        } else {
          toast.error("Failed to record cash count");
          setCurrentStep("review");
        }
      } catch (error) {
        console.error("Cash count error:", error);
        toast.error("Failed to record cash count");
        setCurrentStep("review");
      } finally {
        setIsLoading(false);
        setShowManagerDialog(false);
      }
    },
    [
      activeShiftId,
      user?.id,
      countType,
      expectedCash,
      countedTotal,
      discrepancy,
      notes,
      denominations,
      onCountComplete,
      resetModal,
    ]
  );

  // Process cash count
  const processCount = useCallback(async () => {
    if (requiresManagerApproval && countType !== "opening") {
      setShowManagerDialog(true);
      return;
    }

    await executeCount();
  }, [requiresManagerApproval, countType, executeCount]);

  // Manager approval handler
  const handleManagerApproval = async () => {
    // In a real app, validate the manager PIN
    if (!managerPin.trim()) {
      toast.error("Please enter manager PIN");
      return;
    }

    // Mock manager validation - in real app, validate against user database
    if (managerPin === "1234") {
      // Mock PIN
      await executeCount("mock-manager-id");
    } else {
      toast.error("Invalid manager PIN");
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  // Get count type display name
  const getCountTypeDisplay = () => {
    switch (countType) {
      case "opening":
        return "Opening Count";
      case "mid-shift":
        return "Mid-Shift Count";
      case "closing":
        return "Closing Count";
      case "spot-check":
        return "Spot Check Count";
      default:
        return "Cash Count";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            <h2 className="text-xl font-semibold">{getCountTypeDisplay()}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetModal}
            className="text-white hover:bg-blue-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 max-h-[calc(90vh-5rem)] overflow-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Count Cash */}
            {currentStep === "count" && (
              <motion.div
                key="count"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Count Cash Denominations
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {countType === "opening"
                      ? "Enter the opening cash float for your shift."
                      : "Count all cash denominations in the drawer. Do not look at the expected amount until after completing your count."}
                  </p>

                  {/* Notes Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Notes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Banknotes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {denominations
                            .filter((d) => d.type === "note")
                            .map((denom) => {
                              const originalIndex =
                                CASH_DENOMINATIONS.findIndex(
                                  (d) => d.value === denom.value
                                );
                              return (
                                <div
                                  key={`note-${denom.value}`}
                                  className="flex items-center justify-between"
                                >
                                  <Label className="text-sm font-medium min-w-[60px]">
                                    {denom.label}
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      value={denom.count || ""}
                                      onChange={(e) =>
                                        updateDenominationCount(
                                          originalIndex,
                                          e.target.value
                                        )
                                      }
                                      className="w-20 text-center"
                                      placeholder="0"
                                    />
                                    <span className="text-sm text-slate-600 min-w-[80px] text-right">
                                      {formatCurrency(denom.total)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Coins */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Coins className="h-5 w-5" />
                          Coins
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {denominations
                            .filter((d) => d.type === "coin")
                            .map((denom) => {
                              const originalIndex =
                                CASH_DENOMINATIONS.findIndex(
                                  (d) => d.value === denom.value
                                );
                              return (
                                <div
                                  key={`coin-${denom.value}`}
                                  className="flex items-center justify-between"
                                >
                                  <Label className="text-sm font-medium min-w-[60px]">
                                    {denom.label}
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      value={denom.count || ""}
                                      onChange={(e) =>
                                        updateDenominationCount(
                                          originalIndex,
                                          e.target.value
                                        )
                                      }
                                      className="w-20 text-center"
                                      placeholder="0"
                                    />
                                    <span className="text-sm text-slate-600 min-w-[80px] text-right">
                                      {formatCurrency(denom.total)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Total Display */}
                  <Card className="mt-6">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">
                          Total Counted:
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(countedTotal)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={resetModal}>
                    Cancel
                  </Button>
                  <Button
                    onClick={proceedToReview}
                    disabled={countedTotal === 0}
                  >
                    Review Count
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Review and Compare */}
            {currentStep === "review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Review Count</h3>

                  {/* Count Summary */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Cash Count Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <Label className="text-sm text-slate-600">
                            Expected Amount
                          </Label>
                          <div className="text-2xl font-bold text-slate-800">
                            {formatCurrency(expectedCash)}
                          </div>
                        </div>
                        <div className="text-center">
                          <Label className="text-sm text-slate-600">
                            Counted Amount
                          </Label>
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(countedTotal)}
                          </div>
                        </div>
                        <div className="text-center">
                          <Label className="text-sm text-slate-600">
                            Variance
                          </Label>
                          <div
                            className={`text-2xl font-bold ${
                              discrepancy === 0
                                ? "text-green-600"
                                : discrepancy > 0
                                ? "text-blue-600"
                                : "text-red-600"
                            }`}
                          >
                            {discrepancy >= 0 ? "+" : ""}
                            {formatCurrency(Math.abs(discrepancy))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Discrepancy Warning */}
                  {discrepancy !== 0 && (
                    <Card
                      className={`mb-4 ${
                        Math.abs(discrepancy) > DISCREPANCY_THRESHOLD
                          ? "border-red-300 bg-red-50"
                          : "border-yellow-300 bg-yellow-50"
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className={`h-5 w-5 mt-0.5 ${
                              Math.abs(discrepancy) > DISCREPANCY_THRESHOLD
                                ? "text-red-600"
                                : "text-yellow-600"
                            }`}
                          />
                          <div>
                            <h4
                              className={`font-medium ${
                                Math.abs(discrepancy) > DISCREPANCY_THRESHOLD
                                  ? "text-red-800"
                                  : "text-yellow-800"
                              }`}
                            >
                              {Math.abs(discrepancy) > DISCREPANCY_THRESHOLD
                                ? "Significant Cash Discrepancy"
                                : "Cash Variance Detected"}
                            </h4>
                            <p
                              className={`text-sm mt-1 ${
                                Math.abs(discrepancy) > DISCREPANCY_THRESHOLD
                                  ? "text-red-700"
                                  : "text-yellow-700"
                              }`}
                            >
                              {discrepancy > 0
                                ? `You have ${formatCurrency(
                                    discrepancy
                                  )} more than expected.`
                                : `You are ${formatCurrency(
                                    Math.abs(discrepancy)
                                  )} short of the expected amount.`}
                              {Math.abs(discrepancy) > DISCREPANCY_THRESHOLD &&
                                " Manager approval is required."}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notes */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="count-notes">
                        Notes {discrepancy !== 0 && "(Required)"}
                      </Label>
                      <Textarea
                        id="count-notes"
                        placeholder={
                          discrepancy !== 0
                            ? "Please explain the cash variance..."
                            : "Optional notes about this count..."
                        }
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("count")}
                  >
                    Back to Count
                  </Button>
                  <Button
                    onClick={processCount}
                    disabled={isLoading || (discrepancy !== 0 && !notes.trim())}
                    className={
                      requiresManagerApproval
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }
                  >
                    {requiresManagerApproval
                      ? "Request Manager Approval"
                      : "Complete Count"}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Processing */}
            {currentStep === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">
                  Recording Cash Count...
                </h3>
                <p className="text-slate-600">
                  Please wait while we save your cash drawer count.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Manager Approval Dialog */}
      <AlertDialog open={showManagerDialog} onOpenChange={setShowManagerDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Manager Approval Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cash variance of {formatCurrency(Math.abs(discrepancy))}{" "}
              requires manager authorization. Please enter the manager PIN to
              continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="manager-pin">Manager PIN</Label>
            <Input
              id="manager-pin"
              type="password"
              placeholder="Enter manager PIN..."
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManagerApproval()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowManagerDialog(false);
                setManagerPin("");
                setCurrentStep("review");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleManagerApproval}
              disabled={!managerPin.trim()}
            >
              Approve Count
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CashDrawerCountModal;
