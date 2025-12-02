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

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('void-transaction-modal');
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  X,
  AlertTriangle,
  CreditCard,
  Banknote,
  Receipt,
  Shield,
  Ban,
} from "lucide-react";

// Types
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
}

interface VoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoidComplete: () => void;
  activeShiftId: string | null;
}

const VOID_REASONS = [
  "Cashier Error - Wrong Item",
  "Customer Changed Mind (Immediate)",
  "Payment Processing Error",
  "Duplicate Transaction",
  "System Error",
  "Training Transaction",
  "Price Override Error",
  "Barcode Scanning Error",
  "Manager Instruction",
  "Other",
];

const VoidTransactionModal: React.FC<VoidModalProps> = ({
  isOpen,
  onClose,
  onVoidComplete,
  activeShiftId,
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<
    "search" | "confirm" | "processing"
  >("search");
  const [searchMethod, setSearchMethod] = useState<"recent" | "receipt" | "id">(
    "recent"
  );
  const [searchValue, setSearchValue] = useState("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [voidReason, setVoidReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requiresManagerApproval, setRequiresManagerApproval] = useState(false);
  const [showManagerDialog, setShowManagerDialog] = useState(false);
  const [managerPin, setManagerPin] = useState("");

  const { user } = useAuth();

  // Load recent transactions
  const loadRecentTransactions = useCallback(async () => {
    if (!activeShiftId) return;

    try {
      setIsLoading(true);
      const response = await window.transactionAPI.getByShift(activeShiftId);

      if (response.success && response.data) {
        // Filter only completed sale transactions (not refunds or already voided)
        const transactions = response.data as Transaction[];

        const validTransactions = transactions.filter(
          (t: Transaction) => t.type === "sale" && t.status === "completed"
        );

        setRecentTransactions(validTransactions);
      }
    } catch (error) {
      logger.error("Failed to load recent transactions:", error);
      toast.error("Failed to load recent transactions");
    } finally {
      setIsLoading(false);
    }
  }, [activeShiftId]);

  // Load recent transactions on mount
  useEffect(() => {
    if (isOpen && searchMethod === "recent") {
      loadRecentTransactions();
    }
  }, [isOpen, searchMethod, loadRecentTransactions]);

  // Search transaction by receipt/ID
  const searchTransaction = useCallback(async () => {
    if (!searchValue.trim()) {
      toast.error("Please enter a receipt number or transaction ID");
      return;
    }

    try {
      setIsLoading(true);
      let response;

      if (searchMethod === "receipt") {
        response = await window.voidAPI.getTransactionByReceipt(searchValue);
      } else {
        response = await window.voidAPI.getTransactionById(searchValue);
      }

      if (response.success && response.data) {
        const transaction = response.data as Transaction;

        // Validate transaction type and status
        if (transaction.type !== "sale") {
          toast.error("Only sale transactions can be voided");
          return;
        }

        if (transaction.status !== "completed") {
          toast.error("Transaction is not in completed status");
          return;
        }

        setSelectedTransaction(transaction);
        setCurrentStep("confirm");
      } else {
        toast.error("Transaction not found");
      }
    } catch (error) {
      logger.error("Search transaction error:", error);
      toast.error("Failed to search transaction");
    } finally {
      setIsLoading(false);
    }
  }, [searchValue, searchMethod]);

  // Select transaction from recent list
  const selectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setCurrentStep("confirm");
  };

  // Validate void eligibility
  const validateVoid = useCallback(async (transactionId: string) => {
    try {
      const response = await window.voidAPI.validateEligibility(transactionId);

      if (response.success && response.data) {
        const validation = response.data as {
          isValid: boolean;
          errors: string[];
          requiresManagerApproval: boolean;
        };

        if (!validation.isValid) {
          toast.error(`Cannot void: ${validation.errors.join(", ")}`);
          return false;
        }

        setRequiresManagerApproval(validation.requiresManagerApproval);
        return true;
      } else {
        toast.error("Failed to validate void eligibility");
        return false;
      }
    } catch (error) {
      logger.error("Validate void error:", error);
      toast.error("Failed to validate transaction");
      return false;
    }
  }, []);

  // Reset modal state
  const resetModal = useCallback(() => {
    setCurrentStep("search");
    setSearchMethod("recent");
    setSearchValue("");
    setSelectedTransaction(null);
    setRecentTransactions([]);
    setVoidReason("");
    setCustomReason("");
    setRequiresManagerApproval(false);
    setShowManagerDialog(false);
    setManagerPin("");
    onClose();
  }, [onClose]);

  // Execute void with or without manager approval
  const executeVoid = useCallback(
    async (managerApprovalId?: string) => {
      if (!selectedTransaction || !user?.id) {
        return;
      }

      const finalReason = voidReason === "Other" ? customReason : voidReason;

      try {
        setCurrentStep("processing");
        setIsLoading(true);

        const voidData = {
          transactionId: selectedTransaction.id,
          cashierId: user.id,
          reason: finalReason,
          managerApprovalId,
        };

        const response = await window.voidAPI.voidTransaction(voidData);

        if (response.success) {
          toast.success("Transaction voided successfully");
          onVoidComplete();
          resetModal();
        } else {
          toast.error(response.message || "Failed to void transaction");
          setCurrentStep("confirm");
        }
      } catch (error) {
        logger.error("Void transaction error:", error);
        toast.error("Failed to void transaction");
        setCurrentStep("confirm");
      } finally {
        setIsLoading(false);
        setShowManagerDialog(false);
      }
    },
    [
      selectedTransaction,
      user?.id,
      voidReason,
      customReason,
      onVoidComplete,
      resetModal,
    ]
  );

  // Process void transaction
  const processVoid = useCallback(async () => {
    if (!selectedTransaction || !user?.id) {
      return;
    }

    const finalReason = voidReason === "Other" ? customReason : voidReason;
    if (!finalReason.trim()) {
      toast.error("Please select or enter a void reason");
      return;
    }

    // Validate void eligibility
    const isValid = await validateVoid(selectedTransaction.id);
    if (!isValid) {
      return;
    }

    // Show manager approval dialog if needed
    if (requiresManagerApproval) {
      setShowManagerDialog(true);
      return;
    }

    // Process the void
    await executeVoid();
  }, [
    selectedTransaction,
    user?.id,
    voidReason,
    customReason,
    requiresManagerApproval,
    validateVoid,
    executeVoid,
  ]);

  // Manager approval handler
  const handleManagerApproval = async () => {
    // In a real app, you would validate the manager PIN
    // For now, we'll simulate manager approval
    if (!managerPin.trim()) {
      toast.error("Please enter manager PIN");
      return;
    }

    // Mock manager validation - in real app, validate against user database
    if (managerPin === "1234") {
      // Mock PIN
      await executeVoid("mock-manager-id");
    } else {
      toast.error("Invalid manager PIN");
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "gbp",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-[calc(100vw-1.5rem)] sm:max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-red-600 text-white p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
            <h2 className="text-lg sm:text-xl font-semibold">
              Void Transaction
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetModal}
            className="text-white hover:bg-red-700 min-h-[44px] min-w-[44px] h-10 w-10 sm:h-11 sm:w-11 touch-manipulation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 max-h-[calc(90vh-5rem)] overflow-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Search for Transaction */}
            {currentStep === "search" && (
              <motion.div
                key="search"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    Find Transaction to Void
                  </h3>

                  {/* Search Method Selector */}
                  <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
                    <Button
                      variant={
                        searchMethod === "recent" ? "default" : "outline"
                      }
                      onClick={() => setSearchMethod("recent")}
                      className="w-full min-h-[44px] h-10 sm:h-11 text-xs sm:text-sm touch-manipulation"
                    >
                      Recent Sales
                    </Button>
                    <Button
                      variant={
                        searchMethod === "receipt" ? "default" : "outline"
                      }
                      onClick={() => setSearchMethod("receipt")}
                      className="w-full min-h-[44px] h-10 sm:h-11 text-xs sm:text-sm touch-manipulation"
                    >
                      Receipt #
                    </Button>
                    <Button
                      variant={searchMethod === "id" ? "default" : "outline"}
                      onClick={() => setSearchMethod("id")}
                      className="w-full min-h-[44px] h-10 sm:h-11 text-xs sm:text-sm touch-manipulation"
                    >
                      Transaction ID
                    </Button>
                  </div>

                  {/* Search Input */}
                  {(searchMethod === "receipt" || searchMethod === "id") && (
                    <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4">
                      <Input
                        placeholder={
                          searchMethod === "receipt"
                            ? "Enter receipt number..."
                            : "Enter transaction ID..."
                        }
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && searchTransaction()
                        }
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
                      <Button
                        onClick={searchTransaction}
                        disabled={isLoading || !searchValue.trim()}
                        className="min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                      >
                        <Search className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
                        <span className="hidden sm:inline">Search</span>
                      </Button>
                    </div>
                  )}

                  {/* Recent Transactions List */}
                  {searchMethod === "recent" && (
                    <div className="space-y-2">
                      <h4 className="font-medium mb-2 text-sm sm:text-base">
                        Recent Completed Sales
                      </h4>
                      {isLoading ? (
                        <div className="text-center py-4 text-sm sm:text-base text-slate-600">
                          Loading...
                        </div>
                      ) : recentTransactions.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-auto">
                          {recentTransactions.map((transaction) => (
                            <Card
                              key={transaction.id}
                              className="cursor-pointer hover:bg-slate-50 transition-colors touch-manipulation"
                              onClick={() => selectTransaction(transaction)}
                            >
                              <CardContent className="p-2 sm:p-3">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm sm:text-base line-clamp-1">
                                      {transaction.receiptNumber}
                                    </div>
                                    <div className="text-xs sm:text-sm text-slate-600">
                                      {formatDate(transaction.timestamp)}
                                    </div>
                                    <div className="text-xs sm:text-sm text-slate-600">
                                      {transaction.items.length} items
                                    </div>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <div className="font-semibold text-sm sm:text-base">
                                      {formatCurrency(transaction.total)}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-600">
                                      {transaction.paymentMethod === "cash" ? (
                                        <Banknote className="h-3 w-3 shrink-0" />
                                      ) : (
                                        <CreditCard className="h-3 w-3 shrink-0" />
                                      )}
                                      {transaction.paymentMethod}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-xs sm:text-sm text-slate-600">
                          No recent completed sales found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Confirm Void */}
            {currentStep === "confirm" && selectedTransaction && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    Confirm Void Transaction
                  </h3>

                  {/* Transaction Details */}
                  <Card className="mb-3 sm:mb-4">
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Receipt className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        Transaction Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-xs sm:text-sm">
                            Receipt Number
                          </Label>
                          <div className="font-medium text-sm sm:text-base">
                            {selectedTransaction.receiptNumber}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">
                            Total Amount
                          </Label>
                          <div className="font-semibold text-base sm:text-lg">
                            {formatCurrency(selectedTransaction.total)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">
                            Date & Time
                          </Label>
                          <div className="text-sm sm:text-base">
                            {formatDate(selectedTransaction.timestamp)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">
                            Payment Method
                          </Label>
                          <div className="flex items-center gap-1 text-sm sm:text-base">
                            {selectedTransaction.paymentMethod === "cash" ? (
                              <Banknote className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            ) : (
                              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            )}
                            {selectedTransaction.paymentMethod}
                          </div>
                        </div>
                      </div>

                      {/* Transaction Items */}
                      <div className="mt-3 sm:mt-4">
                        <Label className="text-xs sm:text-sm">
                          Items ({selectedTransaction.items.length})
                        </Label>
                        <div className="mt-2 space-y-1">
                          {selectedTransaction.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-xs sm:text-sm"
                            >
                              <span className="line-clamp-1">
                                {item.quantity}x {item.productName}
                              </span>
                              <span className="ml-2 shrink-0">
                                {formatCurrency(item.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Void Reason */}
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label
                        htmlFor="void-reason"
                        className="text-xs sm:text-sm"
                      >
                        Void Reason *
                      </Label>
                      <Select value={voidReason} onValueChange={setVoidReason}>
                        <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base mt-1">
                          <SelectValue placeholder="Select reason for void..." />
                        </SelectTrigger>
                        <SelectContent>
                          {VOID_REASONS.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {voidReason === "Other" && (
                      <div>
                        <Label
                          htmlFor="custom-reason"
                          className="text-xs sm:text-sm"
                        >
                          Custom Reason *
                        </Label>
                        <Textarea
                          id="custom-reason"
                          placeholder="Please specify the reason for voiding this transaction..."
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          rows={3}
                          className="mt-1 text-sm sm:text-base"
                        />
                      </div>
                    )}
                  </div>

                  {/* Warning Messages */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-800 text-sm sm:text-base">
                          Void Transaction Warning
                        </h4>
                        <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                          This action will permanently void the transaction and
                          restore inventory. The cash drawer will be adjusted if
                          payment was made in cash. This action cannot be
                          undone.
                        </p>
                        {requiresManagerApproval && (
                          <p className="text-xs sm:text-sm font-medium text-yellow-700 mt-2">
                            ⚠️ Manager approval required for this void
                            operation.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("search")}
                    className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={processVoid}
                    disabled={
                      isLoading ||
                      !voidReason ||
                      (voidReason === "Other" && !customReason.trim())
                    }
                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                  >
                    <span className="truncate">
                      {requiresManagerApproval
                        ? "Request Manager Approval"
                        : "Void Transaction"}
                    </span>
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
                className="text-center py-6 sm:py-8"
              >
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-red-600 mx-auto mb-3 sm:mb-4"></div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">
                  Processing Void...
                </h3>
                <p className="text-sm sm:text-base text-slate-600">
                  Please wait while we process the void transaction.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Manager Approval Dialog */}
      <AlertDialog open={showManagerDialog} onOpenChange={setShowManagerDialog}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] mx-4 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              Manager Approval Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              This void operation requires manager authorization. Please enter
              the manager PIN to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3 sm:py-4">
            <Label htmlFor="manager-pin" className="text-xs sm:text-sm">
              Manager PIN
            </Label>
            <Input
              id="manager-pin"
              type="password"
              placeholder="Enter manager PIN..."
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManagerApproval()}
              className="mt-1 h-10 sm:h-11 text-sm sm:text-base"
            />
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel
              onClick={() => {
                setShowManagerDialog(false);
                setManagerPin("");
                setCurrentStep("confirm");
              }}
              className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleManagerApproval}
              disabled={!managerPin.trim()}
              className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
            >
              Approve Void
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VoidTransactionModal;
