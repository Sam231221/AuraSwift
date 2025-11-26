import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Product } from "@/features/products/types/product.types";
import {
  AdaptiveKeyboard,
  AdaptiveFormField,
} from "@/components/adaptive-keyboard";
import type { KeyboardMode } from "@/components/adaptive-keyboard";

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
  // Keyboard state
  const [activeField, setActiveField] = useState<"quantity" | "reason" | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleFieldFocus = useCallback((field: "quantity" | "reason") => {
    setActiveField(field);
    setShowKeyboard(true);
  }, []);

  const handleCloseKeyboard = useCallback(() => {
    setShowKeyboard(false);
    setActiveField(null);
  }, []);

  const handleInput = useCallback((char: string) => {
    if (activeField === "quantity") {
      onQuantityChange(quantity + char);
    } else if (activeField === "reason") {
      onReasonChange(reason + char);
    }
  }, [activeField, quantity, reason, onQuantityChange, onReasonChange]);

  const handleBackspace = useCallback(() => {
    if (activeField === "quantity") {
      onQuantityChange(quantity.slice(0, -1));
    } else if (activeField === "reason") {
      onReasonChange(reason.slice(0, -1));
    }
  }, [activeField, quantity, reason, onQuantityChange, onReasonChange]);

  const handleClear = useCallback(() => {
    if (activeField === "quantity") {
      onQuantityChange("");
    } else if (activeField === "reason") {
      onReasonChange("");
    }
  }, [activeField, onQuantityChange, onReasonChange]);

  const getKeyboardMode = (): KeyboardMode => {
    return activeField === "quantity" ? "numeric" : "qwerty";
  };

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
        className={`bg-white rounded-xl shadow-2xl mx-4 flex flex-col transition-all duration-200 ${
          showKeyboard ? "w-[700px] max-w-[95vw]" : "w-[500px] max-w-[90vw]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            Adjust Stock: {product.name}
          </h3>
          <div className="mt-3 flex gap-4 text-sm">
            <div className="bg-blue-50 px-3 py-2 rounded-lg">
              <span className="text-blue-600">Current Stock:</span>{" "}
              <span className="font-semibold text-blue-900">
                {product.stockLevel}
              </span>
            </div>
            <div className="bg-amber-50 px-3 py-2 rounded-lg">
              <span className="text-amber-600">Minimum Level:</span>{" "}
              <span className="font-semibold text-amber-900">
                {product.minStockLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Adjustment Type Tabs */}
          <div className="flex gap-3">
            <Button
              type="button"
              size="lg"
              className="flex-1 h-12"
              variant={adjustmentType === "add" ? "default" : "outline"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCloseKeyboard();
                onTypeChange("add");
              }}
            >
              Add Stock
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1 h-12"
              variant={adjustmentType === "remove" ? "default" : "outline"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCloseKeyboard();
                onTypeChange("remove");
              }}
            >
              Remove Stock
            </Button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity Input */}
            <div>
              <Label htmlFor="stock-quantity" className="text-sm font-medium">
                Quantity to {adjustmentType === "add" ? "Add" : "Remove"}
              </Label>
              <AdaptiveFormField
                id="stock-quantity"
                label=""
                placeholder="Enter quantity"
                value={quantity}
                readOnly
                onFocus={() => handleFieldFocus("quantity")}
                className="mt-1.5"
              />
            </div>

            {/* Reason Input */}
            <div>
              <Label htmlFor="stock-reason" className="text-sm font-medium">
                Reason
              </Label>
              <AdaptiveFormField
                id="stock-reason"
                label=""
                placeholder="Stock received"
                value={reason}
                readOnly
                onFocus={() => handleFieldFocus("reason")}
                className="mt-1.5"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* Adaptive Keyboard */}
        {showKeyboard && (
          <div className="border-t bg-background px-2 py-2">
            <div className="max-w-full overflow-hidden">
              <AdaptiveKeyboard
                visible={showKeyboard}
                initialMode={getKeyboardMode()}
                onInput={handleInput}
                onBackspace={handleBackspace}
                onClear={handleClear}
                onEnter={handleCloseKeyboard}
                onClose={handleCloseKeyboard}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50/50 rounded-b-xl flex gap-3">
          <Button 
            type="button" 
            size="lg"
            className="flex-1 h-12" 
            onClick={handleConfirm}
          >
            Confirm Adjustment
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1 h-12"
            onClick={handleClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;

