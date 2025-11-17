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
  ChevronRight,
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
import type { Product } from "@/features/products/types/product.types";

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
  filteredProducts: Product[];
  currentProducts: Product[];
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
  startIndex: number;
  productsPerPage: number;
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
}

const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  products,
  categories,
  filteredProducts,
  currentProducts,
  loading,
  searchTerm,
  filterCategory,
  filterStock,
  showFields,
  currentPage,
  totalPages,
  startIndex,
  productsPerPage,
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
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Product Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all menu items and inventory
            </p>
          </div>
        </div>

        <Button onClick={onAddProduct}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-2 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            <Select value={filterCategory} onValueChange={onCategoryFilterChange}>
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

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Show fields:</span>
            {Object.entries(showFields).map(([field, show]) => (
              <Button
                key={field}
                variant={show ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  onShowFieldsChange({ ...showFields, [field]: !show })
                }
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {currentProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-4">
              {products.length === 0
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
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">
                            Loading products...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : currentProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    currentProducts.map((product) => {
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
                                    £{usesScale ? pricePerKg.toFixed(2) : basePrice.toFixed(2)}
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
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(
                    startIndex + productsPerPage,
                    filteredProducts.length
                  )}{" "}
                  of {filteredProducts.length} products
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum =
                        currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                      if (pageNum <= totalPages) {
                        return (
                          <Button
                            key={pageNum}
                            variant={
                              pageNum === currentPage ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => onPageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onPageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsView;

