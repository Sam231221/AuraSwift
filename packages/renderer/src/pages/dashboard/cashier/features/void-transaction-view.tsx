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
    console.log("Void Modal - Active Shift ID:", activeShiftId);
    if (!activeShiftId) return;

    try {
      setIsLoading(true);
      const response = await window.transactionAPI.getByShift(activeShiftId);
      console.log("Void Modal - API Response:", response);

      if (response.success && response.data) {
        // Filter only completed sale transactions (not refunds or already voided)
        const transactions = response.data as Transaction[];
        console.log("Void Modal - All transactions:", transactions);

        // Debug each transaction
        transactions.forEach((t, index) => {
          console.log(`Transaction ${index + 1}:`, {
            id: t.id,
            type: t.type,
            status: t.status,
            receiptNumber: t.receiptNumber,
            total: t.total,
            timestamp: t.timestamp,
          });
        });

        const validTransactions = transactions.filter(
          (t: Transaction) => t.type === "sale" && t.status === "completed"
        );
        console.log(
          "Void Modal - Valid transactions for void:",
          validTransactions
        );
        setRecentTransactions(validTransactions);
      }
    } catch (error) {
      console.error("Failed to load recent transactions:", error);
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
      console.error("Search transaction error:", error);
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
      console.error("Validate void error:", error);
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
      console.log("executeVoid called with:", { managerApprovalId });

      if (!selectedTransaction || !user?.id) {
        console.log("executeVoid: Missing required data");
        return;
      }

      const finalReason = voidReason === "Other" ? customReason : voidReason;
      console.log("executeVoid: Using reason:", finalReason);

      try {
        setCurrentStep("processing");
        setIsLoading(true);

        const voidData = {
          transactionId: selectedTransaction.id,
          cashierId: user.id,
          reason: finalReason,
          managerApprovalId,
        };

        console.log("executeVoid: Sending void request with data:", voidData);
        const response = await window.voidAPI.voidTransaction(voidData);
        console.log("executeVoid: API response:", response);

        if (response.success) {
          toast.success("Transaction voided successfully");
          onVoidComplete();
          resetModal();
        } else {
          console.error("executeVoid: API returned error:", response.message);
          toast.error(response.message || "Failed to void transaction");
          setCurrentStep("confirm");
        }
      } catch (error) {
        console.error("Void transaction error:", error);
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
    console.log("processVoid called", {
      selectedTransaction,
      user: user?.id,
      voidReason,
      customReason,
    });

    if (!selectedTransaction || !user?.id) {
      console.log("Missing required data:", {
        selectedTransaction: !!selectedTransaction,
        userId: !!user?.id,
      });
      return;
    }

    const finalReason = voidReason === "Other" ? customReason : voidReason;
    if (!finalReason.trim()) {
      toast.error("Please select or enter a void reason");
      return;
    }

    console.log("Validating void eligibility...");
    // Validate void eligibility
    const isValid = await validateVoid(selectedTransaction.id);
    if (!isValid) {
      console.log("Void validation failed");
      return;
    }

    console.log(
      "Void validation passed, requiresManagerApproval:",
      requiresManagerApproval
    );
    // Show manager approval dialog if needed
    if (requiresManagerApproval) {
      setShowManagerDialog(true);
      return;
    }

    console.log("Executing void...");
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-red-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Void Transaction</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetModal}
            className="text-white hover:bg-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 max-h-[calc(90vh-5rem)] overflow-auto">
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
                  <h3 className="text-lg font-semibold mb-4">
                    Find Transaction to Void
                  </h3>

                  {/* Search Method Selector */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <Button
                      variant={
                        searchMethod === "recent" ? "default" : "outline"
                      }
                      onClick={() => setSearchMethod("recent")}
                      className="w-full"
                    >
                      Recent Sales
                    </Button>
                    <Button
                      variant={
                        searchMethod === "receipt" ? "default" : "outline"
                      }
                      onClick={() => setSearchMethod("receipt")}
                      className="w-full"
                    >
                      Receipt #
                    </Button>
                    <Button
                      variant={searchMethod === "id" ? "default" : "outline"}
                      onClick={() => setSearchMethod("id")}
                      className="w-full"
                    >
                      Transaction ID
                    </Button>
                  </div>

                  {/* Search Input */}
                  {(searchMethod === "receipt" || searchMethod === "id") && (
                    <div className="flex gap-2 mb-4">
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
                      />
                      <Button
                        onClick={searchTransaction}
                        disabled={isLoading || !searchValue.trim()}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Recent Transactions List */}
                  {searchMethod === "recent" && (
                    <div className="space-y-2">
                      <h4 className="font-medium mb-2">
                        Recent Completed Sales
                      </h4>
                      {isLoading ? (
                        <div className="text-center py-4">Loading...</div>
                      ) : recentTransactions.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-auto">
                          {recentTransactions.map((transaction) => (
                            <Card
                              key={transaction.id}
                              className="cursor-pointer hover:bg-slate-50 transition-colors"
                              onClick={() => selectTransaction(transaction)}
                            >
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">
                                      {transaction.receiptNumber}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                      {formatDate(transaction.timestamp)}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                      {transaction.items.length} items
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold">
                                      {formatCurrency(transaction.total)}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-slate-600">
                                      {transaction.paymentMethod === "cash" ? (
                                        <Banknote className="h-3 w-3" />
                                      ) : (
                                        <CreditCard className="h-3 w-3" />
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
                        <div className="text-center py-4 text-slate-600">
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
                  <h3 className="text-lg font-semibold mb-4">
                    Confirm Void Transaction
                  </h3>

                  {/* Transaction Details */}
                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Transaction Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Receipt Number</Label>
                          <div className="font-medium">
                            {selectedTransaction.receiptNumber}
                          </div>
                        </div>
                        <div>
                          <Label>Total Amount</Label>
                          <div className="font-semibold text-lg">
                            {formatCurrency(selectedTransaction.total)}
                          </div>
                        </div>
                        <div>
                          <Label>Date & Time</Label>
                          <div>{formatDate(selectedTransaction.timestamp)}</div>
                        </div>
                        <div>
                          <Label>Payment Method</Label>
                          <div className="flex items-center gap-1">
                            {selectedTransaction.paymentMethod === "cash" ? (
                              <Banknote className="h-4 w-4" />
                            ) : (
                              <CreditCard className="h-4 w-4" />
                            )}
                            {selectedTransaction.paymentMethod}
                          </div>
                        </div>
                      </div>

                      {/* Transaction Items */}
                      <div className="mt-4">
                        <Label>
                          Items ({selectedTransaction.items.length})
                        </Label>
                        <div className="mt-2 space-y-1">
                          {selectedTransaction.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {item.quantity}x {item.productName}
                              </span>
                              <span>{formatCurrency(item.totalPrice)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Void Reason */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="void-reason">Void Reason *</Label>
                      <Select value={voidReason} onValueChange={setVoidReason}>
                        <SelectTrigger>
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
                        <Label htmlFor="custom-reason">Custom Reason *</Label>
                        <Textarea
                          id="custom-reason"
                          placeholder="Please specify the reason for voiding this transaction..."
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  {/* Warning Messages */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">
                          Void Transaction Warning
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          This action will permanently void the transaction and
                          restore inventory. The cash drawer will be adjusted if
                          payment was made in cash. This action cannot be
                          undone.
                        </p>
                        {requiresManagerApproval && (
                          <p className="text-sm font-medium text-yellow-700 mt-2">
                            ⚠️ Manager approval required for this void
                            operation.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("search")}
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
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {requiresManagerApproval
                      ? "Request Manager Approval"
                      : "Void Transaction"}
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">
                  Processing Void...
                </h3>
                <p className="text-slate-600">
                  Please wait while we process the void transaction.
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
              This void operation requires manager authorization. Please enter
              the manager PIN to continue.
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
                setCurrentStep("confirm");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleManagerApproval}
              disabled={!managerPin.trim()}
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
