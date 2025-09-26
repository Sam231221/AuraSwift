import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import { toast } from "sonner";

// Types
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

interface RefundItem {
  originalItemId: string;
  productId: string;
  productName: string;
  originalQuantity: number;
  refundQuantity: number;
  unitPrice: number;
  refundAmount: number;
  reason: string;
  restockable: boolean;
}

interface RefundTransactionViewProps {
  onBack?: () => void;
  onClose?: () => void;
}

const REFUND_REASONS = [
  "Defective/Damaged Item",
  "Wrong Item/Size",
  "Customer Dissatisfaction",
  "Pricing Error",
  "Duplicate Purchase",
  "Item Not as Described",
  "Changed Mind",
  "Store Error",
  "Other",
];

const RefundTransactionView: React.FC<RefundTransactionViewProps> = ({
  onBack,
  onClose,
}) => {
  const handleClose = onBack || onClose;
  // State management
  const [searchType, setSearchType] = useState<
    "receipt" | "transaction" | "recent"
  >("receipt");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [originalTransaction, setOriginalTransaction] =
    useState<Transaction | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [selectedItems, setSelectedItems] = useState<Map<string, RefundItem>>(
    new Map()
  );
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<
    "original" | "store_credit" | "cash" | "card"
  >("original");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user } = useAuth();

  // Load recent transactions
  const loadRecentTransactions = useCallback(async () => {
    if (!user?.businessId) return;

    try {
      setIsSearching(true);
      const response = await window.refundAPI.getRecentTransactions(
        user.businessId,
        20
      );

      if (response.success && "transactions" in response) {
        const transactionsResponse = response as {
          success: boolean;
          transactions: Transaction[];
        };
        setRecentTransactions(transactionsResponse.transactions || []);
      } else {
        toast.error("Failed to load recent transactions");
      }
    } catch (error) {
      console.error("Error loading recent transactions:", error);
      toast.error("Failed to load recent transactions");
    } finally {
      setIsSearching(false);
    }
  }, [user?.businessId]);

  // Search for transaction
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setIsSearching(true);

    try {
      let response;

      if (searchType === "receipt") {
        response = await window.refundAPI.getTransactionByReceipt(
          searchQuery.trim()
        );
      } else {
        response = await window.refundAPI.getTransactionById(
          searchQuery.trim()
        );
      }

      if (response.success && "transaction" in response) {
        const transactionResponse = response as unknown as {
          success: boolean;
          transaction: Transaction;
        };
        setOriginalTransaction(transactionResponse.transaction);
        setSelectedItems(new Map());
      } else {
        toast.error(response.message || "Transaction not found");
        setOriginalTransaction(null);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Select transaction from recent list
  const selectTransaction = (transaction: Transaction) => {
    setOriginalTransaction(transaction);
    setSelectedItems(new Map());
  };

  // Add item to refund selection
  const addItemToRefund = (item: TransactionItem) => {
    const availableQuantity = item.quantity - (item.refundedQuantity || 0);

    if (availableQuantity <= 0) {
      toast.error("This item has already been fully refunded");
      return;
    }

    const refundItem: RefundItem = {
      originalItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      originalQuantity: item.quantity,
      refundQuantity: 1,
      unitPrice: item.unitPrice,
      refundAmount: item.unitPrice,
      reason: REFUND_REASONS[0],
      restockable: true,
    };

    setSelectedItems((prev) => new Map(prev.set(item.id, refundItem)));
  };

  // Remove item from refund selection
  const removeItemFromRefund = (itemId: string) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      newMap.delete(itemId);
      return newMap;
    });
  };

  // Update refund item quantity
  const updateRefundQuantity = (itemId: string, newQuantity: number) => {
    const item = selectedItems.get(itemId);
    if (!item) return;

    const originalItem = originalTransaction?.items.find(
      (i) => i.id === itemId
    );
    if (!originalItem) return;

    const availableQuantity =
      originalItem.quantity - (originalItem.refundedQuantity || 0);
    const clampedQuantity = Math.max(
      1,
      Math.min(newQuantity, availableQuantity)
    );

    const updatedItem = {
      ...item,
      refundQuantity: clampedQuantity,
      refundAmount: item.unitPrice * clampedQuantity,
    };

    setSelectedItems((prev) => new Map(prev.set(itemId, updatedItem)));
  };

  // Update refund item reason
  const updateRefundReason = (itemId: string, reason: string) => {
    const item = selectedItems.get(itemId);
    if (!item) return;

    setSelectedItems((prev) => new Map(prev.set(itemId, { ...item, reason })));
  };

  // Update restockable status
  const updateRestockable = (itemId: string, restockable: boolean) => {
    const item = selectedItems.get(itemId);
    if (!item) return;

    setSelectedItems(
      (prev) => new Map(prev.set(itemId, { ...item, restockable }))
    );
  };

  // Calculate refund totals
  const refundTotal = Array.from(selectedItems.values()).reduce(
    (sum, item) => sum + item.refundAmount,
    0
  );

  // Process refund
  const processRefund = async () => {
    if (!originalTransaction || !user) {
      toast.error("Missing transaction or user data");
      return;
    }

    if (selectedItems.size === 0) {
      toast.error("Please select items to refund");
      return;
    }

    if (!refundReason.trim()) {
      toast.error("Please provide a reason for the refund");
      return;
    }

    setIsProcessing(true);

    try {
      // Get active shift
      const shiftResponse = await window.shiftAPI.getActive(user.id);
      if (!shiftResponse.success || !shiftResponse.data) {
        toast.error("No active shift found. Please start your shift first.");
        return;
      }

      const activeShift = shiftResponse.data as { id: string };

      const refundData = {
        originalTransactionId: originalTransaction.id,
        shiftId: activeShift.id,
        businessId: user.businessId,
        refundItems: Array.from(selectedItems.values()),
        refundReason: refundReason.trim(),
        refundMethod,
        cashierId: user.id,
      };

      const response = await window.refundAPI.createRefund(refundData);

      if (response.success) {
        toast.success("Refund processed successfully");

        // Reset form
        setOriginalTransaction(null);
        setSelectedItems(new Map());
        setRefundReason("");
        setRefundMethod("original");
        setSearchQuery("");
        setShowConfirmDialog(false);

        // TODO: Print refund receipt
      } else {
        toast.error(response.message || "Failed to process refund");
      }
    } catch (error) {
      console.error("Refund processing error:", error);
      toast.error("Failed to process refund");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handleClose}
          className="border-slate-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Process Refund</h1>
          <p className="text-slate-600">
            Find and refund items from previous transactions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Transaction Search */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-green-600" />
                Find Original Transaction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Type Selection */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={searchType === "receipt" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSearchType("receipt")}
                  className={searchType === "receipt" ? "bg-green-600" : ""}
                >
                  Receipt #
                </Button>
                <Button
                  variant={searchType === "transaction" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSearchType("transaction")}
                  className={searchType === "transaction" ? "bg-green-600" : ""}
                >
                  Transaction ID
                </Button>
                <Button
                  variant={searchType === "recent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSearchType("recent");
                    loadRecentTransactions();
                  }}
                  className={searchType === "recent" ? "bg-green-600" : ""}
                >
                  Recent
                </Button>
              </div>

              {/* Search Input */}
              {searchType !== "recent" && (
                <div className="flex gap-2">
                  <Input
                    placeholder={`Enter ${
                      searchType === "receipt"
                        ? "receipt number"
                        : "transaction ID"
                    }`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSearching ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              {/* Recent Transactions List */}
              {searchType === "recent" && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading recent transactions...
                    </div>
                  ) : recentTransactions.length === 0 ? (
                    <div className="text-center py-4 text-slate-500">
                      No recent transactions found
                    </div>
                  ) : (
                    recentTransactions.map((transaction) => (
                      <motion.div
                        key={transaction.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
                        onClick={() => selectTransaction(transaction)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              #{transaction.receiptNumber}
                            </div>
                            <div className="text-sm text-slate-500">
                              {new Date(transaction.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              £{transaction.total.toFixed(2)}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {transaction.items.length} items
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Original Transaction Details */}
          {originalTransaction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-blue-600" />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-600">
                        Receipt Number
                      </Label>
                      <div className="font-medium">
                        #{originalTransaction.receiptNumber}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">
                        Date & Time
                      </Label>
                      <div className="font-medium">
                        {new Date(
                          originalTransaction.timestamp
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">
                        Total Amount
                      </Label>
                      <div className="font-medium text-green-600">
                        £{originalTransaction.total.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">
                        Payment Method
                      </Label>
                      <Badge variant="outline" className="ml-2">
                        {originalTransaction.paymentMethod}
                      </Badge>
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <Label className="text-sm text-slate-600 mb-2 block">
                      Items
                    </Label>
                    <div className="space-y-2">
                      {originalTransaction.items.map((item) => {
                        const availableQuantity =
                          item.quantity - (item.refundedQuantity || 0);
                        const isSelected = selectedItems.has(item.id);

                        return (
                          <div
                            key={item.id}
                            className={`p-3 border rounded-lg ${
                              isSelected
                                ? "border-green-300 bg-green-50"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium">
                                  {item.productName}
                                </div>
                                <div className="text-sm text-slate-500">
                                  Qty: {item.quantity} × £
                                  {item.unitPrice.toFixed(2)}
                                  {item.refundedQuantity ? (
                                    <span className="ml-2 text-red-600">
                                      ({item.refundedQuantity} refunded)
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-sm font-medium text-slate-700">
                                  £{item.totalPrice.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {availableQuantity > 0 && !isSelected && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addItemToRefund(item)}
                                    className="border-green-300 text-green-600 hover:bg-green-50"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add to Refund
                                  </Button>
                                )}
                                {isSelected && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      removeItemFromRefund(item.id)
                                    }
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                )}
                                {availableQuantity === 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Fully Refunded
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column - Refund Configuration */}
        <div className="space-y-6">
          {selectedItems.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-red-600" />
                    Refund Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Selected Items */}
                  <div>
                    <Label className="text-sm text-slate-600 mb-3 block">
                      Selected Items
                    </Label>
                    <div className="space-y-3">
                      {Array.from(selectedItems.values()).map((item) => (
                        <div
                          key={item.originalItemId}
                          className="p-3 border border-green-300 rounded-lg bg-green-50"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">
                                  {item.productName}
                                </div>
                                <div className="text-sm text-slate-600">
                                  £{item.unitPrice.toFixed(2)} each
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">
                                  £{item.refundAmount.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {/* Quantity Selection */}
                            <div className="flex items-center gap-2">
                              <Label className="text-sm w-16">Quantity:</Label>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateRefundQuantity(
                                      item.originalItemId,
                                      item.refundQuantity - 1
                                    )
                                  }
                                  disabled={item.refundQuantity <= 1}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.refundQuantity}
                                  onChange={(e) =>
                                    updateRefundQuantity(
                                      item.originalItemId,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-16 h-8 text-center"
                                  min="1"
                                  max={item.originalQuantity}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateRefundQuantity(
                                      item.originalItemId,
                                      item.refundQuantity + 1
                                    )
                                  }
                                  disabled={
                                    item.refundQuantity >= item.originalQuantity
                                  }
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Reason Selection */}
                            <div>
                              <Label className="text-sm">Reason:</Label>
                              <Select
                                value={item.reason}
                                onValueChange={(value) =>
                                  updateRefundReason(item.originalItemId, value)
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {REFUND_REASONS.map((reason) => (
                                    <SelectItem key={reason} value={reason}>
                                      {reason}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Restockable Checkbox */}
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`restock-${item.originalItemId}`}
                                checked={item.restockable}
                                onChange={(e) =>
                                  updateRestockable(
                                    item.originalItemId,
                                    e.target.checked
                                  )
                                }
                                className="rounded"
                              />
                              <Label
                                htmlFor={`restock-${item.originalItemId}`}
                                className="text-sm"
                              >
                                Return to inventory
                              </Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Refund Method */}
                  <div>
                    <Label className="text-sm text-slate-600 mb-2 block">
                      Refund Method
                    </Label>
                    <Select
                      value={refundMethod}
                      onValueChange={(value: string) =>
                        setRefundMethod(
                          value as "original" | "store_credit" | "cash" | "card"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Original Payment Method
                          </div>
                        </SelectItem>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Cash Refund
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Card Refund
                          </div>
                        </SelectItem>
                        <SelectItem value="store_credit">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Store Credit
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Refund Reason */}
                  <div>
                    <Label className="text-sm text-slate-600 mb-2 block">
                      Overall Refund Reason
                    </Label>
                    <Textarea
                      placeholder="Provide a detailed reason for this refund..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="min-h-20"
                    />
                  </div>

                  {/* Refund Total */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Refund Total:</span>
                      <span className="text-red-600">
                        £{refundTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Process Button */}
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={selectedItems.size === 0 || !refundReason.trim()}
                    className="w-full bg-red-600 hover:bg-red-700 h-12 text-lg"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Process Refund
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Empty State */}
          {selectedItems.size === 0 && originalTransaction && (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  No Items Selected
                </h3>
                <p className="text-slate-500">
                  Select items from the transaction to process a refund
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirm Refund
            </DialogTitle>
            <DialogDescription>
              Please review the refund details before processing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Refund Summary:</h4>
              <div className="space-y-1">
                {Array.from(selectedItems.values()).map((item) => (
                  <div
                    key={item.originalItemId}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {item.productName} × {item.refundQuantity}
                    </span>
                    <span>£{item.refundAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total Refund:</span>
                <span className="text-red-600">£{refundTotal.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-600">
                <strong>Method:</strong>{" "}
                {refundMethod === "original"
                  ? "Original Payment Method"
                  : refundMethod}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Reason:</strong> {refundReason}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={processRefund}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RefundTransactionView;
