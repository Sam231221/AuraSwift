import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Product } from "@/features/products/types/product.types";

interface StockAdjustmentModalProps {
  product: Product | null;
  adjustmentType: "add" | "remove";
  quantity: string;
  reason: string;
  onClose: () => void;
  onTypeChange: (type: "add" | "remove") => void;
  onQuantityChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onConfirm: (
    productId: string,
    type: "add" | "remove",
    quantity: number,
    reason: string
  ) => void;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  product,
  adjustmentType,
  quantity,
  reason,
  onClose,
  onTypeChange,
  onQuantityChange,
  onReasonChange,
  onConfirm,
}) => {
  if (!product) return null;

  const handleConfirm = () => {
    const quantityNum = parseInt(quantity);
    const reasonText = reason.trim() || "Stock received";
    if (quantityNum > 0 && reasonText) {
      onConfirm(product.id, adjustmentType, quantityNum, reasonText);
      onClose();
    } else {
      toast.error("Please enter a valid quantity and reason");
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg p-6 w-96 max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          Adjust Stock: {product.name}
        </h3>
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              Current Stock:{" "}
              <span className="font-medium text-gray-900">
                {product.stockLevel}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Minimum Level:{" "}
              <span className="font-medium text-gray-900">
                {product.minStockLevel}
              </span>
            </p>
          </div>

          {/* Adjustment Type Tabs */}
          <div className="flex space-x-2">
            <Button
              type="button"
              className="flex-1"
              variant={adjustmentType === "add" ? "default" : "outline"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTypeChange("add");
              }}
            >
              Add Stock
            </Button>
            <Button
              type="button"
              className="flex-1"
              variant={adjustmentType === "remove" ? "default" : "outline"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTypeChange("remove");
              }}
            >
              Remove Stock
            </Button>
          </div>

          {/* Quantity Input */}
          <div>
            <Label htmlFor="stock-quantity">
              Quantity to {adjustmentType === "add" ? "Add" : "Remove"}
            </Label>
            <Input
              id="stock-quantity"
              type="number"
              min="1"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Reason Input */}
          <div>
            <Label htmlFor="stock-reason">Reason</Label>
            <Input
              id="stock-reason"
              type="text"
              placeholder="Stock received"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="mt-1"
              autoComplete="off"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button type="button" className="flex-1" onClick={handleConfirm}>
              Confirm Adjustment
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;

