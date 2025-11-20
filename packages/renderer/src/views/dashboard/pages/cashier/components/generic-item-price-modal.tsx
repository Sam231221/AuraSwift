import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import { NumericKeypad } from "./numeric-keypad";
import type { Product } from "@/features/products/types/product.types";

interface GenericItemPriceModalProps {
  isOpen: boolean;
  product: Product;
  onConfirm: (price: number) => void;
  onCancel: () => void;
}

export const GenericItemPriceModal: React.FC<GenericItemPriceModalProps> = ({
  isOpen,
  product,
  onConfirm,
  onCancel,
}) => {
  const [price, setPrice] = useState("");
  const [displayPrice, setDisplayPrice] = useState("0.00");

  // Initialize with default price if available
  useEffect(() => {
    if (isOpen && product.genericDefaultPrice) {
      setPrice(product.genericDefaultPrice.toString());
      setDisplayPrice(product.genericDefaultPrice.toFixed(2));
    } else if (isOpen) {
      setPrice("");
      setDisplayPrice("0.00");
    }
  }, [isOpen, product.genericDefaultPrice]);

  const handleKeypadInput = (value: string) => {
    if (value === "Clear") {
      setPrice("");
      setDisplayPrice("0.00");
      return;
    }

    if (value === "Enter") {
      handleConfirm();
      return;
    }

    // Handle numeric input
    let newPrice = price;
    if (value === "00") {
      newPrice = price + "00";
    } else if (value === ".") {
      if (!price.includes(".")) {
        newPrice = price + ".";
      }
    } else {
      newPrice = price + value;
    }

    setPrice(newPrice);
    const numValue = parseFloat(newPrice) || 0;
    setDisplayPrice(numValue.toFixed(2));
  };

  const handleConfirm = () => {
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      return;
    }
    onConfirm(priceValue);
    // Reset on confirm
    setPrice("");
    setDisplayPrice("0.00");
  };

  const handleQuickPrice = (amount: number) => {
    setPrice(amount.toString());
    setDisplayPrice(amount.toFixed(2));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Enter Price for {product.name}
          </DialogTitle>
          <DialogDescription>
            Enter the price for this generic item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price Display */}
          <div className="bg-slate-50 p-6 rounded-lg text-center">
            <Label className="text-sm text-slate-600 mb-2 block">
              Entered Price
            </Label>
            <div className="text-4xl font-bold text-slate-900">
              £{displayPrice}
            </div>
          </div>

          {/* Quick Price Buttons */}
          {product.genericDefaultPrice && (
            <div className="space-y-2">
              <Label className="text-sm">Quick Select</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  product.genericDefaultPrice * 0.5,
                  product.genericDefaultPrice,
                  product.genericDefaultPrice * 1.5,
                  product.genericDefaultPrice * 2,
                ].map((amount, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrice(amount)}
                    className="text-xs"
                  >
                    £{amount.toFixed(2)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="space-y-2">
            <Label>Enter Amount</Label>
            <NumericKeypad
              onInput={handleKeypadInput}
              keysOverride={[
                ["7", "8", "9", "Clear"],
                ["4", "5", "6", "."],
                ["1", "2", "3", "00"],
                ["0", "", "", "Enter"],
              ]}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!price || parseFloat(price) <= 0}
            className="bg-sky-600 hover:bg-sky-700"
          >
            Add to Cart (£{displayPrice})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

