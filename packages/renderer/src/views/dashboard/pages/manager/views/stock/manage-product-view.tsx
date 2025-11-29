import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/shared/hooks/use-auth";
import type { Product } from "@/features/products/types/product.types";

import ManageCategoriesView from "@/views/dashboard/pages/manager/views/stock/manage-categories-view";
import ProductDashboardView from "./product-dashboard-view";
import ProductDetailsView from "./product-details-view";
import StockAdjustmentModal from "./components/stock-adjustment-modal";
import ProductFormDrawer from "./components/product-form-drawer";
import BatchManagementView from "./product-batch-management-view";
import StockMovementHistoryView from "./stock-movement-history-view";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('manage-product-view');
import type {
  Category,
  VatCategory,
} from "../../../../../../../../../types/db";

interface ProductManagementViewProps {
  onBack: () => void;
}

const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  onBack,
}) => {
  const { user } = useAuth();

  // View state
  const [currentView, setCurrentView] = useState<
    | "productDashboard"
    | "productManagement"
    | "categoryManagement"
    | "batchManagement"
    | "stockMovementHistory"
  >("productDashboard");

  // Track which product to filter batches by
  const [batchFilterProductId, setBatchFilterProductId] = useState<
    string | undefined
  >(undefined);

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // For dashboard stats
  const [categories, setCategories] = useState<Category[]>([]);
  const [vatCategories, setVatCategories] = useState<VatCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStock, setFilterStock] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
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

  // Computed values for dashboard
  const lowStockProducts = allProducts.filter(
    (p) => p.isActive && p.stockLevel <= p.minStockLevel
  );

  // Load paginated products
  const loadProducts = useCallback(async () => {
    if (!user?.businessId) return;

    setLoading(true);
    try {
      const response = await window.productAPI.getPaginated(
        user.businessId,
        {
          page: currentPage,
          pageSize,
          sortBy: "name",
          sortOrder: "asc",
        },
        {
          searchTerm: searchTerm || undefined,
          categoryId: filterCategory !== "all" ? filterCategory : undefined,
          stockStatus: filterStock as
            | "all"
            | "in_stock"
            | "low"
            | "out_of_stock",
          isActive:
            filterStatus === "all"
              ? undefined
              : filterStatus === "active"
              ? true
              : false,
        }
      );

      if (response.success && response.data) {
        setProducts(response.data.items);
        setTotalItems(response.data.pagination.totalItems);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        toast.error("Failed to load products");
      }
    } catch (error) {
      logger.error("Error loading products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [
    user?.businessId,
    currentPage,
    pageSize,
    searchTerm,
    filterCategory,
    filterStock,
    filterStatus,
  ]);

  // Load all products for dashboard stats (without pagination)
  const loadAllProducts = useCallback(async () => {
    if (!user?.businessId) return;

    try {
      const response = await window.productAPI.getByBusiness(user.businessId);
      if (response.success && response.products) {
        setAllProducts(response.products);
      }
    } catch (error) {
      logger.error("Error loading all products:", error);
    }
  }, [user?.businessId]);

  // Load categories
  const loadCategories = useCallback(async () => {
    if (!user?.businessId) return;

    try {
      const response = await window.categoryAPI.getByBusiness(user.businessId);
      if (response.success && response.categories) {
        setCategories(response.categories as any);
      }
    } catch (error) {
      logger.error("Error loading categories:", error);
    }
  }, [user?.businessId]);

  // Load VAT categories
  const loadVatCategories = useCallback(async () => {
    if (!user?.businessId) return;

    try {
      const response = await window.categoryAPI.getVatCategories(
        user.businessId
      );
      if (response.success && response.vatCategories) {
        setVatCategories(response.vatCategories as any);
      }
    } catch (error) {
      logger.error("Error loading VAT categories:", error);
    }
  }, [user?.businessId]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadAllProducts();
    loadCategories();
    loadVatCategories();
  }, [loadAllProducts, loadCategories, loadVatCategories]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterCategory, filterStock, filterStatus]);

  // Reload categories when returning from category management
  useEffect(() => {
    setIsDrawerOpen(false);
    if (currentView === "categoryManagement" && user?.businessId) {
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
          toast.success("Product deleted successfully");
          loadProducts();
          loadAllProducts();
        } else {
          toast.error(response.message || "Failed to delete product");
        }
      } catch (error) {
        logger.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      }
    },
    [loadProducts, loadAllProducts]
  );

  const handleAdjustStockClick = useCallback((product: Product) => {
    // Show quick adjustment modal for products
    // TODO: Check if product requires batch tracking once the field is added to schema
    setStockAdjustmentProduct(product);
  }, []);

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
          await loadAllProducts();
          toast.success("Stock adjustment completed successfully");
          setStockAdjustmentProduct(null);
        } else {
          toast.error(response.message || "Failed to adjust stock");
        }
      } catch (error) {
        logger.error("Error adjusting stock:", error);
        toast.error("Failed to adjust stock");
      }
    },
    [user, loadProducts, loadAllProducts]
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
    (_product: Product) => {
      loadProducts(); // Reload to ensure consistency
      loadAllProducts(); // Update dashboard stats
    },
    [loadProducts, loadAllProducts]
  );

  const handleUpdateProduct = useCallback(
    (_productId: string, _updatedProduct: Product) => {
      loadProducts(); // Reload to ensure consistency
      loadAllProducts(); // Update dashboard stats
    },
    [loadProducts, loadAllProducts]
  );

  if (!user) {
    return null;
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
              products={allProducts}
              categories={categories as any}
              lowStockProducts={lowStockProducts}
              onBack={onBack}
              onManageProducts={() => setCurrentView("productManagement")}
              onManageCategories={() => setCurrentView("categoryManagement")}
              onAddProduct={openAddProductDrawer}
              onRestockProduct={handleAdjustStockClick}
              onManageBatches={() => setCurrentView("batchManagement")}
              onProductsImported={() => {
                loadProducts();
                loadAllProducts();
              }}
            />
          ) : currentView === "categoryManagement" ? (
            <ManageCategoriesView
              onBack={() => setCurrentView("productDashboard")}
            />
          ) : currentView === "batchManagement" ? (
            <BatchManagementView
              onBack={() => {
                setBatchFilterProductId(undefined);
                setCurrentView("productDashboard");
              }}
              initialProductId={batchFilterProductId}
            />
          ) : currentView === "stockMovementHistory" ? (
            <StockMovementHistoryView
              onBack={() => setCurrentView("productDashboard")}
            />
          ) : (
            <ProductDetailsView
              products={products}
              categories={categories as any}
              loading={loading}
              searchTerm={searchTerm}
              filterCategory={filterCategory}
              filterStock={filterStock}
              filterStatus={filterStatus}
              showFields={showFields}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onBack={() => setCurrentView("productDashboard")}
              onAddProduct={openAddProductDrawer}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onAdjustStock={handleAdjustStockClick}
              onSearchChange={setSearchTerm}
              onCategoryFilterChange={setFilterCategory}
              onStockFilterChange={(value: string) => setFilterStock(value)}
              onStatusFilterChange={(value: string) => setFilterStatus(value)}
              onShowFieldsChange={setShowFields}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
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
          categories={categories as any}
          vatCategories={vatCategories as any}
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
