import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/shared/hooks/use-auth";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('stock-movement-history-view');

interface StockMovement {
  id: string;
  productId: string;
  batchId?: string;
  movementType: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TRANSFER" | "WASTE";
  quantity: number;
  reason?: string;
  reference?: string;
  userId: string;
  businessId: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface StockMovementHistoryViewProps {
  onBack: () => void;
}

const StockMovementHistoryView: React.FC<StockMovementHistoryViewProps> = ({
  onBack,
}) => {
  const { user } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Load products for filter dropdown
  const loadProducts = useCallback(async () => {
    if (!user?.businessId) return;

    try {
      const response = await window.productAPI.getByBusiness(user.businessId);
      if (response.success && response.products) {
        setProducts(response.products);
      }
    } catch (error) {
      logger.error("Error loading products:", error);
    }
  }, [user?.businessId]);

  // Load stock movements
  const loadMovements = useCallback(async () => {
    if (!user?.businessId) return;

    setLoading(true);
    try {
      // If filtering by specific product
      if (filterProduct !== "all") {
        const response = await window.stockMovementAPI.getByProduct(
          filterProduct
        );
        if (response.success && response.movements) {
          setMovements(response.movements);
        }
      } else {
        // Load all movements for business
        const response = await window.stockMovementAPI.getByBusiness(
          user.businessId
        );
        if (response.success && response.movements) {
          setMovements(response.movements);
        }
      }
    } catch (error) {
      logger.error("Error loading stock movements:", error);
      toast.error("Failed to load stock movement history");
    } finally {
      setLoading(false);
    }
  }, [user?.businessId, filterProduct]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  // Filter movements based on search and filters
  const filteredMovements = movements.filter((movement) => {
    // Search filter
    if (searchTerm) {
      const product = products.find((p) => p.id === movement.productId);
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        product?.name.toLowerCase().includes(searchLower) ||
        product?.sku.toLowerCase().includes(searchLower) ||
        movement.reason?.toLowerCase().includes(searchLower) ||
        movement.reference?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== "all" && movement.movementType !== filterType) {
      return false;
    }

    // Date filters
    if (startDate) {
      const movementDate = new Date(movement.createdAt);
      const filterStart = new Date(startDate);
      if (movementDate < filterStart) return false;
    }

    if (endDate) {
      const movementDate = new Date(movement.createdAt);
      const filterEnd = new Date(endDate);
      filterEnd.setHours(23, 59, 59, 999); // Include entire end date
      if (movementDate > filterEnd) return false;
    }

    return true;
  });

  // Calculate summary statistics
  const stats = {
    totalInbound: filteredMovements
      .filter((m) => m.movementType === "INBOUND")
      .reduce((sum, m) => sum + m.quantity, 0),
    totalOutbound: filteredMovements
      .filter((m) => m.movementType === "OUTBOUND")
      .reduce((sum, m) => sum + m.quantity, 0),
    totalWaste: filteredMovements
      .filter((m) => m.movementType === "WASTE")
      .reduce((sum, m) => sum + m.quantity, 0),
    totalAdjustments: filteredMovements.filter(
      (m) => m.movementType === "ADJUSTMENT"
    ).length,
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case "INBOUND":
        return "bg-green-100 text-green-800";
      case "OUTBOUND":
        return "bg-red-100 text-red-800";
      case "WASTE":
        return "bg-orange-100 text-orange-800";
      case "ADJUSTMENT":
        return "bg-blue-100 text-blue-800";
      case "TRANSFER":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case "INBOUND":
        return <TrendingUp className="w-4 h-4" />;
      case "OUTBOUND":
      case "WASTE":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="w-fit"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Stock Movement History
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Complete audit trail of all stock changes
            </p>
          </div>
        </div>

        <Button variant="outline" className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Inbound</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalInbound}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Outbound</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.totalOutbound}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Waste</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.totalWaste}
              </p>
            </div>
            <Package className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Adjustments</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalAdjustments}
              </p>
            </div>
            <Filter className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by product, reason, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Product Filter */}
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger>
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INBOUND">Inbound</SelectItem>
                <SelectItem value="OUTBOUND">Outbound</SelectItem>
                <SelectItem value="WASTE">Waste</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading movements...</p>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No movements found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or date range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    Date & Time
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    Product
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    Quantity
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    Reason
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.map((movement) => {
                  const product = products.find(
                    (p) => p.id === movement.productId
                  );
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(movement.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {product?.name || "Unknown Product"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product?.sku}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeColor(
                            movement.movementType
                          )}`}
                        >
                          {getMovementTypeIcon(movement.movementType)}
                          {movement.movementType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-semibold ${
                            movement.movementType === "INBOUND"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {movement.movementType === "INBOUND" ? "+" : "-"}
                          {movement.quantity}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {movement.reason || "-"}
                      </td>
                      <td className="p-4 text-sm text-gray-600 font-mono">
                        {movement.reference || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockMovementHistoryView;
