/**
 * Cart item row component
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { CartItemWithProduct } from "../../../types/cart.types";

interface CartItemRowProps {
  item: CartItemWithProduct;
  onRemove: (itemId: string) => void;
}

export function CartItemRow({ item, onRemove }: CartItemRowProps) {
  return (
    <tr className="border-b border-slate-200">
      <td className="text-center" style={{ width: "100px" }}>
        {item.itemType === "WEIGHT" && item.weight
          ? `${item.weight.toFixed(2)} ${item.unitOfMeasure || "kg"}`
          : item.itemType === "UNIT" && item.quantity
          ? `${item.quantity}x`
          : "-"}
      </td>
      <td className="font-medium">
        {item.product?.name || item.itemName || "Unknown Product"}
        {item.ageRestrictionLevel !== "NONE" && (
          <Badge
            variant="outline"
            className="ml-2 text-xs bg-orange-50 text-orange-700 border-orange-200"
          >
            {item.ageRestrictionLevel}
          </Badge>
        )}
      </td>
      <td className="text-center" style={{ width: "120px" }}>
        £{item.unitPrice.toFixed(2)}
        {item.itemType === "WEIGHT" && item.unitOfMeasure && (
          <span className="text-xs text-slate-500"> / {item.unitOfMeasure}</span>
        )}
      </td>
      <td className="text-center font-semibold" style={{ width: "100px" }}>
        £{item.totalPrice.toFixed(2)}
      </td>
      <td className="text-center" style={{ width: "80px" }}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(item.id)}
          className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  );
}

