/**
 * Cart items table component
 */

import { AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { CartItemRow } from "./cart-item-row";
import type { CartItemWithProduct } from "../../../types/cart.types";

interface CartItemsTableProps {
  items: CartItemWithProduct[];
  loading: boolean;
  onRemove: (itemId: string) => void;
}

export function CartItemsTable({
  items,
  loading,
  onRemove,
}: CartItemsTableProps) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
      <div className="shrink-0">
        <Table>
          <TableHeader className="bg-linear-to-r from-sky-200 to-blue-300">
            <TableRow className="h-10 border-b-0">
              <TableHead
                className="text-center font-semibold text-slate-800 h-10"
                style={{ width: "100px" }}
              >
                Unit/Weight
              </TableHead>
              <TableHead className="text-left font-semibold text-slate-800 h-10">
                Product
              </TableHead>
              <TableHead
                className="text-center font-semibold text-slate-800 h-10"
                style={{ width: "120px" }}
              >
                Price
              </TableHead>
              <TableHead
                className="text-center font-semibold text-slate-800 h-10"
                style={{ width: "100px" }}
              >
                Total
              </TableHead>
              <TableHead
                className="text-center font-semibold text-slate-800 h-10"
                style={{ width: "80px" }}
              >
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <Table>
          <TableBody>
            <AnimatePresence>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-slate-400 text-center py-8"
                  >
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading cart...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-slate-400 text-center py-8"
                  >
                    No items in Basket. Scan or search for products.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <CartItemRow key={item.id} item={item} onRemove={onRemove} />
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

