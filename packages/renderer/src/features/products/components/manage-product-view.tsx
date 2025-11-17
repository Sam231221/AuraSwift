import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/shared/hooks/use-auth";
import type { Product } from "@/features/products/types/product.types";
import ManageCategoriesView from "@/features/categories/components/manage-categories-view";
import ProductDashboardView from "./product-dashboard-view";
import ProductDetailsView from "./product-details-view";
import StockAdjustmentModal from "./stock-adjustment-modal";
import ProductFormDrawer from "./product-form-drawer";
import BatchManagementView from "./batch-management-view";
import { useProductData } from "../hooks/use-product-data";
import {
  filterProducts,
  getLowStockProducts,
  paginateProducts,
} from "../utils/product-filters";

interface ProductManagementViewProps {
  onBack: () => void;
}

const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  onBack,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // View state
  const [currentView, setCurrentView] = useState<
    | "productDashboard"
    | "productManagement"
    | "categoryManagement"
    | "batchManagement"
  >("productDashboard");

  // Data loading
  const {
    products,
    categories,
    vatCategories,
    loading,
    setProducts,
    loadProducts,
    loadCategories,
  } = useProductData({ businessId: user?.businessId });

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStock, setFilterStock] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFields, setShowFields] = useState({
    name: true,
    category: true,
    price: true,
    stock: true,
    sku: true,
    status: true,
  });

  // Product form state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Stock adjustment state
  const [stockAdjustmentProduct, setStockAdjustmentProduct] =
    useState<Product | null>(null);
  const [stockAdjustmentType, setStockAdjustmentType] = useState<
    "add" | "remove"
  >("add");
  const [stockAdjustmentQuantity, setStockAdjustmentQuantity] = useState("");
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState("");

  const productsPerPage = 10;

  // Computed values
  const lowStockProducts = getLowStockProducts(products);
  const filteredProducts = filterProducts(products, {
    searchTerm,
    filterCategory,
    filterStock,
  });
  const {
    paginatedProducts: currentProducts,
    startIndex,
    totalPages,
  } = paginateProducts(filteredProducts, currentPage, productsPerPage);

  // Reload categories when returning from category management
  useEffect(() => {
    setIsDrawerOpen(false);
    if (currentView === "productManagement" && user?.businessId) {
      loadCategories();
    }
  }, [currentView, user?.businessId, loadCategories]);

  // Reset stock adjustment form when modal opens
  useEffect(() => {
    if (stockAdjustmentProduct) {
      setStockAdjustmentQuantity("");
      setStockAdjustmentReason("");
      setStockAdjustmentType("add");
    }
  }, [stockAdjustmentProduct]);

  // Handlers
  const handleDeleteProduct = useCallback(
    async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this product?")) {
        return;
      }

      try {
        const response = await window.productAPI.delete(id);
        if (response.success) {
          setProducts(products.filter((p) => p.id !== id));
          toast.success("Product deleted successfully");
        } else {
          toast.error(response.message || "Failed to delete product");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      }
    },
    [products, setProducts]
  );

  const handleStockAdjustment = useCallback(
    async (
      productId: string,
      type: "add" | "remove",
      quantity: number,
      reason: string
    ) => {
      if (!user?.businessId || !user.id) {
        toast.error("User information not available");
        return;
      }

      try {
        const adjustmentData = {
          productId,
          type: type as "add" | "remove" | "sale" | "waste" | "adjustment",
          quantity,
          reason,
          userId: user.id,
          businessId: user.businessId,
        };

        const response = await window.productAPI.adjustStock(adjustmentData);
        if (response.success) {
          await loadProducts();
          toast.success("Stock adjustment completed successfully");
          setStockAdjustmentProduct(null);
        } else {
          toast.error(response.message || "Failed to adjust stock");
        }
      } catch (error) {
        console.error("Error adjusting stock:", error);
        toast.error("Failed to adjust stock");
      }
    },
    [user, loadProducts]
  );

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsDrawerOpen(true);
  }, []);

  const openAddProductDrawer = useCallback(() => {
    setEditingProduct(null);
    setIsDrawerOpen(true);
  }, []);

  const handleSaveProduct = useCallback(
    (product: Product) => {
      setProducts([...products, product]);
      loadProducts(); // Reload to ensure consistency
    },
    [products, setProducts, loadProducts]
  );

  const handleUpdateProduct = useCallback(
    (productId: string, updatedProduct: Product) => {
      setProducts(
        products.map((p) => (p.id === productId ? updatedProduct : p))
      );
      loadProducts(); // Reload to ensure consistency
    },
    [products, setProducts, loadProducts]
  );

  if (!user) {
    navigate("/");
    return null;
  }

  // Show loading state while initial data is being fetched
  if (loading && products.length === 0 && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product management...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{
            x: currentView === "productDashboard" ? 300 : -300,
            opacity: 0,
          }}
          animate={{ x: 0, opacity: 1 }}
          exit={{
            x: currentView === "productDashboard" ? -300 : 300,
            opacity: 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full"
        >
          {currentView === "productDashboard" ? (
            <ProductDashboardView
              products={products}
              categories={categories}
              lowStockProducts={lowStockProducts}
              onBack={onBack}
              onManageProducts={() => setCurrentView("productManagement")}
              onManageCategories={() => setCurrentView("categoryManagement")}
              onAddProduct={openAddProductDrawer}
              onRestockProduct={setStockAdjustmentProduct}
              onManageBatches={() => setCurrentView("batchManagement")}
            />
          ) : currentView === "categoryManagement" ? (
            <ManageCategoriesView
              onBack={() => setCurrentView("productDashboard")}
            />
          ) : currentView === "batchManagement" ? (
            <BatchManagementView
              onBack={() => setCurrentView("productDashboard")}
            />
          ) : (
            <ProductDetailsView
              products={products}
              categories={categories}
              filteredProducts={filteredProducts}
              currentProducts={currentProducts}
              loading={loading}
              searchTerm={searchTerm}
              filterCategory={filterCategory}
              filterStock={filterStock}
              showFields={showFields}
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              productsPerPage={productsPerPage}
              onBack={() => setCurrentView("productDashboard")}
              onAddProduct={openAddProductDrawer}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onAdjustStock={setStockAdjustmentProduct}
              onSearchChange={setSearchTerm}
              onCategoryFilterChange={setFilterCategory}
              onStockFilterChange={setFilterStock}
              onShowFieldsChange={setShowFields}
              onPageChange={setCurrentPage}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        product={stockAdjustmentProduct}
        adjustmentType={stockAdjustmentType}
        quantity={stockAdjustmentQuantity}
        reason={stockAdjustmentReason}
        onClose={() => {
          setStockAdjustmentProduct(null);
          setStockAdjustmentQuantity("");
          setStockAdjustmentReason("");
          setStockAdjustmentType("add");
        }}
        onTypeChange={setStockAdjustmentType}
        onQuantityChange={setStockAdjustmentQuantity}
        onReasonChange={setStockAdjustmentReason}
        onConfirm={handleStockAdjustment}
      />

      {/* Product Form Drawer */}
      {user?.businessId ? (
        <ProductFormDrawer
          isOpen={isDrawerOpen}
          editingProduct={editingProduct}
          categories={categories}
          vatCategories={vatCategories}
          businessId={user.businessId}
          onClose={() => setIsDrawerOpen(false)}
          onSave={handleSaveProduct}
          onUpdate={handleUpdateProduct}
        />
      ) : null}
    </>
  );
};

export default ProductManagementView;
