/**
 * Cart panel component
 * Main container for cart display
 */

import { CardContent } from "@/components/ui/card";
import { CartItemsTable } from "./cart-items-table";
import { CartSummary } from "./cart-summary";
import type { CartItemWithProduct } from "../../../types/cart.types";

interface CartPanelProps {
  cartItems: CartItemWithProduct[];
  loadingCart: boolean;
  subtotal: number;
  tax: number;
  total: number;
  onRemoveItem: (itemId: string) => void;
}

export function CartPanel({
  cartItems,
  loadingCart,
  subtotal,
  tax,
  total,
  onRemoveItem,
}: CartPanelProps) {
  return (
    <div className="bg-white border-b-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
      <CardContent className="p-2 sm:p-3 flex-1 flex flex-col min-h-0">
        <CartItemsTable
          items={cartItems}
          loading={loadingCart}
          onRemove={onRemoveItem}
        />
        <CartSummary
          subtotal={subtotal}
          tax={tax}
          total={total}
          itemCount={cartItems.length}
        />
      </CardContent>
    </div>
  );
}

