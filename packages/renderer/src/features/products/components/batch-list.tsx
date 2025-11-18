import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import type { ProductBatch } from "../types/batch.types";
import {
  formatExpiryDate,
  getExpiryStatus,
  getExpiryStatusColor,
} from "../utils/expiry-calculations";
import { cn } from "@/shared/utils/cn";

interface BatchListProps {
  batches: ProductBatch[];
  expirySettings?: {
    criticalAlertDays: number;
    warningAlertDays: number;
    infoAlertDays: number;
  };
  onEdit?: (batch: ProductBatch) => void;
  onDelete?: (batch: ProductBatch) => void;
  onView?: (batch: ProductBatch) => void;
  onAdjustStock?: (batch: ProductBatch) => void;
  onCreatePromotion?: (batch: ProductBatch) => void;
  onMarkAsWaste?: (batch: ProductBatch) => void;
}

const BatchList: React.FC<BatchListProps> = ({
  batches,
  expirySettings = {
    criticalAlertDays: 3,
    warningAlertDays: 7,
    infoAlertDays: 14,
  },
  onEdit,
  onDelete,
  onView,
  onAdjustStock,
  onCreatePromotion,
  onMarkAsWaste,
}) => {
  const getStatusBadge = (batch: ProductBatch) => {
    const { status } = getExpiryStatus(
      batch.expiryDate,
      expirySettings.criticalAlertDays,
      expirySettings.warningAlertDays,
      expirySettings.infoAlertDays
    );

    const color = getExpiryStatusColor(status);

    return (
      <Badge variant={color as any} className="capitalize">
        {status === "expired" && <AlertTriangle className="w-3 h-3 mr-1" />}
        {status === "critical" && <TrendingDown className="w-3 h-3 mr-1" />}
        {status}
      </Badge>
    );
  };

  if (batches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No batches found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Batch Number</TableHead>
            <TableHead>Current Stock</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => {
            const { status, daysUntil } = getExpiryStatus(
              batch.expiryDate,
              expirySettings.criticalAlertDays,
              expirySettings.warningAlertDays,
              expirySettings.infoAlertDays
            );

            return (
              <TableRow
                key={batch.id}
                className={cn(
                  status === "expired" && "bg-red-50 dark:bg-red-950/20",
                  status === "critical" && "bg-orange-50 dark:bg-orange-950/20"
                )}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {batch.product?.image && (
                      <img
                        src={batch.product.image}
                        alt={batch.product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{batch.product?.name || "Unknown Product"}</div>
                      <div className="text-sm text-gray-500">{batch.product?.sku || ""}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{batch.batchNumber}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{batch.currentQuantity}</span>
                    <span className="text-sm text-gray-500">
                      / {batch.initialQuantity}
                    </span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full",
                          (batch.currentQuantity / batch.initialQuantity) * 100 < 20
                            ? "bg-red-500"
                            : (batch.currentQuantity / batch.initialQuantity) * 100 < 50
                            ? "bg-orange-500"
                            : "bg-green-500"
                        )}
                        style={{
                          width: `${(batch.currentQuantity / batch.initialQuantity) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatExpiryDate(batch.expiryDate, true)}
                  </div>
                  {daysUntil <= 7 && daysUntil >= 0 && (
                    <div className="text-xs text-orange-600 mt-1">
                      {daysUntil === 0
                        ? "Expires today"
                        : `${daysUntil} day${daysUntil !== 1 ? "s" : ""} left`}
                    </div>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(batch)}</TableCell>
                <TableCell>
                  {batch.supplier ? (
                    <span className="text-sm">{batch.supplier.name}</span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(batch)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(batch)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Batch
                        </DropdownMenuItem>
                      )}
                      {onAdjustStock && (
                        <DropdownMenuItem onClick={() => onAdjustStock(batch)}>
                          <TrendingDown className="w-4 h-4 mr-2" />
                          Adjust Stock
                        </DropdownMenuItem>
                      )}
                      {onCreatePromotion && status !== "good" && (
                        <DropdownMenuItem onClick={() => onCreatePromotion(batch)}>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Create Promotion
                        </DropdownMenuItem>
                      )}
                      {onMarkAsWaste && (
                        <DropdownMenuItem
                          onClick={() => onMarkAsWaste(batch)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Mark as Waste
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(batch)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default BatchList;

