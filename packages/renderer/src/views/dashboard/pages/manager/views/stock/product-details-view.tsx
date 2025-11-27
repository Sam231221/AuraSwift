import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  Plus,
  ChevronLeft,
  ImageIcon,
  Scale,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import type { Product } from "./types/product.types";

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

interface ProductDetailsViewProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  searchTerm: string;
  filterCategory: string;
  filterStock: string;
  showFields: {
    name: boolean;
    category: boolean;
    price: boolean;
    stock: boolean;
    sku: boolean;
    status: boolean;
  };
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onBack: () => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAdjustStock: (product: Product) => void;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStockFilterChange: (value: string) => void;
  onShowFieldsChange: (fields: {
    name: boolean;
    category: boolean;
    price: boolean;
    stock: boolean;
    sku: boolean;
    status: boolean;
  }) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  products,
  categories,
  loading,
  searchTerm,
  filterCategory,
  filterStock,
  showFields,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onBack,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAdjustStock,
  onSearchChange,
  onCategoryFilterChange,
  onStockFilterChange,
  onShowFieldsChange,
  onPageChange,
  onPageSizeChange,
}) => {
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
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Product Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage all menu items and inventory
            </p>
          </div>
        </div>

        <Button onClick={onAddProduct} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <Select
              value={filterCategory}
              onValueChange={onCategoryFilterChange}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStock} onValueChange={onStockFilterChange}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-600">
              Show fields:
            </span>
            {Object.entries(showFields).map(([field, show]) => (
              <Button
                key={field}
                variant={show ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  onShowFieldsChange({ ...showFields, [field]: !show })
                }
                className="text-xs sm:text-sm"
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-4">
              {totalItems === 0
                ? "Get started by adding your first product to the menu."
                : "Try adjusting your search criteria or filters."}
            </p>
            <Button onClick={onAddProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Image
                    </th>
                    {showFields.name && (
                      <th className="text-left p-4 font-semibold text-gray-900">
                        Name
                      </th>
                    )}
                    {showFields.category && (
                      <th className="text-left p-4 font-semibold text-gray-900">
                        Category
                      </th>
                    )}
                    {showFields.price && (
                      <th className="text-left p-4 font-semibold text-gray-900">
                        Price
                      </th>
                    )}
                    {showFields.stock && (
                      <th className="text-left p-4 font-semibold text-gray-900">
                        Stock
                      </th>
                    )}
                    {showFields.sku && (
                      <th className="text-left p-4 font-semibold text-gray-900">
                        SKU
                      </th>
                    )}
                    {showFields.status && (
                      <th className="text-left p-4 font-semibold text-gray-900">
                        Status
                      </th>
                    )}
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => {
                    const dbProduct = product as unknown as Record<
                      string,
                      unknown
                    >;
                    const categoryId =
                      (dbProduct.categoryId as string | undefined) ||
                      product.category;
                    const usesScale =
                      (dbProduct.usesScale as boolean | undefined) ?? false;
                    const pricePerKg =
                      (dbProduct.pricePerKg as number | undefined) ||
                      (dbProduct.basePrice as number | undefined) ||
                      product.price ||
                      0;
                    const basePrice =
                      (dbProduct.basePrice as number | undefined) ||
                      product.price ||
                      0;
                    const salesUnit =
                      (dbProduct.salesUnit as string | undefined) || "KG";

                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        </td>
                        {showFields.name && (
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description}
                              </div>
                            </div>
                          </td>
                        )}
                        {showFields.category && (
                          <td className="p-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {categories.find((cat) => cat.id === categoryId)
                                ?.name || "Unknown"}
                            </span>
                          </td>
                        )}
                        {showFields.price && (
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="text-gray-900 font-medium">
                                  £
                                  {usesScale
                                    ? pricePerKg.toFixed(2)
                                    : basePrice.toFixed(2)}
                                  {usesScale && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      /{salesUnit}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Cost: £{(product.costPrice || 0).toFixed(2)}
                                </div>
                              </div>
                              {usesScale && (
                                <Scale className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                          </td>
                        )}
                        {showFields.stock && (
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`font-medium ${
                                  product.stockLevel <= product.minStockLevel
                                    ? "text-red-600"
                                    : product.stockLevel <=
                                      product.minStockLevel * 2
                                    ? "text-orange-600"
                                    : "text-green-600"
                                }`}
                              >
                                {product.stockLevel}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onAdjustStock(product)}
                              >
                                Adjust
                              </Button>
                            </div>
                            {product.stockLevel <= product.minStockLevel && (
                              <div className="text-xs text-red-600 mt-1">
                                Low Stock!
                              </div>
                            )}
                          </td>
                        )}
                        {showFields.sku && (
                          <td className="p-4 text-gray-600 font-mono text-sm">
                            {product.sku}
                          </td>
                        )}
                        {showFields.status && (
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                product.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        )}
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDeleteProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              showPageSizeSelector={true}
              showPageInfo={true}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsView;
