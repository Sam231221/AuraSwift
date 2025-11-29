import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  Settings,
  AlertTriangle,
  MenuSquare,
  DollarSign,
  TrendingDown,
  Tag,
  PackageCheck,
  FileSpreadsheet,
} from "lucide-react";
import type { Product } from "@/types/domain";
import { ImportBookerModal } from "./components/import-booker-modal";

interface Category {
  id: string;
  name: string;
  description?: string;
  businessId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductDashboardViewProps {
  products: Product[];
  categories: Category[];
  lowStockProducts: Product[];
  onBack: () => void;
  onManageProducts: () => void;
  onManageCategories: () => void;
  onAddProduct: () => void;
  onRestockProduct: (product: Product) => void;
  onManageBatches?: () => void;
  onProductsImported?: () => void;
}

const ProductDashboardView: React.FC<ProductDashboardViewProps> = ({
  products,
  categories,
  lowStockProducts,
  onBack,
  onManageProducts,
  onManageCategories,

  onRestockProduct,
  onManageBatches,
  onProductsImported,
}) => {
  const [importModalOpen, setImportModalOpen] = useState(false);
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Product & Menu Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your inventory and menu items
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-4">
          <Button onClick={onBack} className="w-full sm:w-auto">Go to dashboard</Button>

          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Alert for low stock */}
      {lowStockProducts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {lowStockProducts.length} product(s) are running low on stock and
            need attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Products</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {products.length}
              </p>
              <p className="text-xs sm:text-sm text-blue-600 mt-1">
                {products.filter((p) => p.isActive).length} active
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Categories</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {categories.length}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Menu categories</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MenuSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Low Stock Items</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {lowStockProducts.length}
              </p>
              <p className="text-xs sm:text-sm text-orange-600 mt-1">Need restocking</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Average Price</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                £
                {products.length > 0
                  ? (
                      products.reduce((sum, p) => sum + (p.basePrice || 0), 0) /
                      products.length
                    ).toFixed(2)
                  : "0.00"}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Across all items</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onManageProducts}
            >
              <Package className="w-4 h-4 mr-3" />
              <span className="text-sm sm:text-base">Manage Products</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onManageCategories}
            >
              <Tag className="w-4 h-4 mr-3" />
              <span className="text-sm sm:text-base">Manage Categories</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onManageBatches}
            >
              <PackageCheck className="w-4 h-4 mr-3" />
              <span className="text-sm sm:text-base">Batch & Expiry Management</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setImportModalOpen(true)}
            >
              <FileSpreadsheet className="w-4 h-4 mr-3" />
              <span className="text-sm sm:text-base">Import from Booker</span>
            </Button>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Low Stock Alerts
          </h3>
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-xs sm:text-sm">
              All products are well stocked!
            </p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 bg-orange-50 rounded"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-600">
                      {product.stockLevel} left (min: {product.minStockLevel})
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRestockProduct(product)}
                    className="w-full sm:w-auto"
                  >
                    Restock
                  </Button>
                </div>
              ))}
              {lowStockProducts.length > 3 && (
                <p className="text-xs sm:text-sm text-gray-500 text-center pt-2">
                  +{lowStockProducts.length - 3} more items need attention
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import from Booker Modal */}
      <ImportBookerModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        importType="product"
        onSuccess={onProductsImported}
      />
    </div>
  );
};

export default ProductDashboardView;
