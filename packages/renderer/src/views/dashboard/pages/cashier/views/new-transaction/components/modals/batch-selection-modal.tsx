/**
 * Batch Selection Modal
 *
 * Allows cashiers to manually select which batch(es) to use when selling
 * products that require batch tracking. Displays batches sorted by FEFO
 * (First-Expiry-First-Out) to encourage selling oldest stock first.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/features/products/types/product.types";

/**
 * Batch data from the API
 */
export interface BatchInfo {
  id: string;
  batchNumber: string;
  expiryDate: Date | string | number;
  currentQuantity: number;
  status: "ACTIVE" | "EXPIRED" | "SOLD_OUT" | "REMOVED";
  costPrice?: number;
  supplierId?: string;
  supplier?: {
    id: string;
    name: string;
  };
}

/**
 * Selected batch data returned when user confirms selection
 */
export interface SelectedBatchData {
  batchId: string;
  batchNumber: string;
  expiryDate: Date;
  quantityFromBatch: number;
}

interface BatchSelectionModalProps {
  isOpen: boolean;
  product: Product;
  requestedQuantity: number;
  onSelect: (data: SelectedBatchData) => void;
  onAutoSelect: () => void; // Use automatic FEFO selection
  onCancel: () => void;
  businessId: string;
}

/**
 * Calculate days until expiry
 */
const getDaysUntilExpiry = (expiryDate: Date | string | number): number => {
  const expiry =
    expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get expiry status color
 */
const getExpiryStatusColor = (daysUntil: number): string => {
  if (daysUntil < 0) return "bg-red-100 text-red-800 border-red-200";
  if (daysUntil <= 3) return "bg-red-50 text-red-700 border-red-200";
  if (daysUntil <= 7) return "bg-orange-50 text-orange-700 border-orange-200";
  if (daysUntil <= 14) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-green-50 text-green-700 border-green-200";
};

/**
 * Format expiry date for display
 */
const formatExpiryDate = (expiryDate: Date | string | number): string => {
  const date =
    expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const BatchSelectionModal: React.FC<BatchSelectionModalProps> = ({
  isOpen,
  product,
  requestedQuantity,
  onSelect,
  onAutoSelect,
  onCancel,
  businessId,
}) => {
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load available batches when modal opens
  useEffect(() => {
    if (isOpen && product.id) {
      loadBatches();
    }
  }, [isOpen, product.id]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      // Get active batches for this product sorted by FEFO
      const response = await window.batchesAPI?.getActiveBatches(
        product.id,
        (product.stockRotationMethod as "FIFO" | "FEFO" | "NONE") || "FEFO"
      );

      if (response?.success && response.batches) {
        // Filter to only show batches with sufficient quantity
        const availableBatches = response.batches.filter(
          (batch: BatchInfo) =>
            batch.status === "ACTIVE" && batch.currentQuantity > 0
        );
        setBatches(availableBatches);

        // Auto-select the first batch (FEFO recommendation)
        if (availableBatches.length > 0) {
          setSelectedBatchId(availableBatches[0].id);
        }
      } else {
        setBatches([]);
        toast.error("No batches available for this product");
      }
    } catch (error) {
      console.error("Failed to load batches:", error);
      toast.error("Failed to load batch information");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Get selected batch details
  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId),
    [batches, selectedBatchId]
  );

  // Check if selected batch has sufficient quantity
  const hasSufficientQuantity = selectedBatch
    ? selectedBatch.currentQuantity >= requestedQuantity
    : false;

  // Calculate total available quantity across all batches
  const totalAvailable = useMemo(
    () => batches.reduce((sum, b) => sum + b.currentQuantity, 0),
    [batches]
  );

  const handleConfirmSelection = () => {
    if (!selectedBatch) {
      toast.error("Please select a batch");
      return;
    }

    if (!hasSufficientQuantity) {
      toast.error(
        `Selected batch only has ${selectedBatch.currentQuantity} units available`
      );
      return;
    }

    const expiryDate =
      selectedBatch.expiryDate instanceof Date
        ? selectedBatch.expiryDate
        : new Date(selectedBatch.expiryDate);

    onSelect({
      batchId: selectedBatch.id,
      batchNumber: selectedBatch.batchNumber,
      expiryDate,
      quantityFromBatch: requestedQuantity,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-[calc(100vw-2rem)] mx-4 sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0" />
            Select Batch
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Choose which batch to use for this sale
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-4 overflow-y-auto flex-1">
          {/* Product Info */}
          <div className="bg-slate-50 p-2 sm:p-3 rounded-lg">
            <p className="font-semibold text-slate-900 text-sm sm:text-base line-clamp-2">
              {product.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-[10px] sm:text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                {product.sku}
              </Badge>
              <span className="text-xs text-slate-500">
                Qty needed: {requestedQuantity}
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-slate-500">
                Loading batches...
              </span>
            </div>
          )}

          {/* No Batches Available */}
          {!loading && batches.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600">
                No batches available for this product
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Add stock through batch management
              </p>
            </div>
          )}

          {/* Batch Selection */}
          {!loading && batches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm font-medium">
                  Available Batches
                </Label>
                <span className="text-xs text-slate-500">
                  Total: {totalAvailable} units
                </span>
              </div>

              <RadioGroup
                value={selectedBatchId || ""}
                onValueChange={setSelectedBatchId}
                className="space-y-2"
              >
                {batches.map((batch) => {
                  const daysUntil = getDaysUntilExpiry(batch.expiryDate);
                  const isExpired = daysUntil < 0;
                  const hasSufficient =
                    batch.currentQuantity >= requestedQuantity;

                  return (
                    <div
                      key={batch.id}
                      className={`relative flex items-start p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedBatchId === batch.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      } ${
                        !hasSufficient || isExpired
                          ? "opacity-60"
                          : ""
                      }`}
                      onClick={() =>
                        !isExpired && hasSufficient && setSelectedBatchId(batch.id)
                      }
                    >
                      <RadioGroupItem
                        value={batch.id}
                        id={batch.id}
                        className="mt-1"
                        disabled={isExpired || !hasSufficient}
                      />
                      <div className="ml-3 flex-1">
                        <Label
                          htmlFor={batch.id}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-semibold text-sm">
                            {batch.batchNumber}
                          </span>
                          {batches.indexOf(batch) === 0 && (
                            <Badge className="bg-green-600 text-[10px]">
                              FEFO Recommended
                            </Badge>
                          )}
                        </Label>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          {/* Quantity */}
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-slate-400" />
                            <span
                              className={
                                hasSufficient
                                  ? "text-slate-600"
                                  : "text-red-600"
                              }
                            >
                              {batch.currentQuantity} available
                              {!hasSufficient && " (insufficient)"}
                            </span>
                          </div>

                          {/* Expiry */}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-600">
                              {formatExpiryDate(batch.expiryDate)}
                            </span>
                          </div>
                        </div>

                        {/* Expiry Status Badge */}
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${getExpiryStatusColor(
                              daysUntil
                            )}`}
                          >
                            {isExpired ? (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expired {Math.abs(daysUntil)} days ago
                              </>
                            ) : daysUntil === 0 ? (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Expires today
                              </>
                            ) : daysUntil <= 7 ? (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expires in {daysUntil} days
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Expires in {daysUntil} days
                              </>
                            )}
                          </Badge>
                        </div>

                        {/* Supplier if available */}
                        {batch.supplier && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Supplier: {batch.supplier.name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onAutoSelect}
            className="w-full sm:w-auto min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Auto-Select (FEFO)
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedBatch || !hasSufficientQuantity}
            className="w-full sm:w-auto min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
          >
            <Package className="h-4 w-4 mr-2" />
            Use Selected Batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

