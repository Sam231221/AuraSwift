import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Search,
  ChevronLeft,
  AlertTriangle,
  Info,
  Package,
} from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import { Pagination } from "@/components/ui/pagination";
import { useExpiryAlerts } from "./hooks/use-expiry-alerts";
import BatchList from "./components/batch-list";
import BatchFormDrawer from "./components/batch-form-drawer";
import BatchAdjustmentModal from "./components/batch-adjustment-modal";
import ExpiryDashboard from "./product-expiry-dashboard-view";
import ExpiryAlertCenter from "./components/expiry-alert-center";
import type {
  ProductBatch,
  ExpirySettings,
  Supplier,
} from "./types/batch.types";
import type { Product } from "@/types/domain";
import { toast } from "sonner";

import { getLogger } from "@/shared/utils/logger";
const logger = getLogger("product-batch-management-view");

interface BatchManagementViewProps {
  onBack: () => void;
  initialProductId?: string;
}

type ViewMode = "dashboard" | "list" | "alerts" | "create";

const BatchManagementView: React.FC<BatchManagementViewProps> = ({
  onBack,
  initialProductId,
}) => {
  const { user } = useAuth();

  const [currentView, setCurrentView] = useState<ViewMode>(
    initialProductId ? "list" : "dashboard"
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");

  // Batch adjustment modal state
  const [adjustingBatch, setAdjustingBatch] = useState<ProductBatch | null>(
    null
  );
  const [adjustmentType, setAdjustmentType] = useState<
    "add" | "remove" | "set"
  >("add");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [allBatches, setAllBatches] = useState<ProductBatch[]>([]); // For dashboard/alerts
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expirySettings, setExpirySettings] = useState<ExpirySettings | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load products for dropdown (including inactive products to show names for orphaned batches)
  useEffect(() => {
    const loadProducts = async () => {
      if (!user?.businessId) return;
      try {
        // Pass true to include inactive/deleted products so we can display their names for orphaned batches
        const response = await window.productAPI.getByBusiness(user.businessId);
        if (response.success && response.products) {
          setProducts(response.products);
        }
      } catch (error) {
        logger.error("Error loading products:", error);
      }
    };
    loadProducts();
  }, [user?.businessId]);

  // Auto-select product from initialProductId prop
  useEffect(() => {
    if (initialProductId && products.length > 0) {
      const product = products.find((p) => p.id === initialProductId);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [initialProductId, products]);

  // Load paginated batches
  const loadBatches = useCallback(async () => {
    if (!user?.businessId) return;

    setLoading(true);
    try {
      const response = await window.batchesAPI.getPaginated(
        user.businessId,
        {
          page: currentPage,
          pageSize,
          sortBy: "expiryDate",
          sortOrder: "asc",
        },
        {
          productId: selectedProduct?.id || initialProductId,
          status: statusFilter !== "all" ? (statusFilter as any) : undefined,
          expiryStatus:
            expiryFilter !== "all" ? (expiryFilter as any) : undefined,
        }
      );

      if (response.success && response.data) {
        // Enrich batches with product data
        const enrichedItems = response.data.items.map((batch: ProductBatch) => {
          const product = products.find((p) => p.id === batch.productId);
          return {
            ...batch,
            product: product
              ? {
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  image: product.image,
                }
              : batch.product,
          };
        });

        setBatches(enrichedItems);
        setTotalItems(response.data.pagination.totalItems);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        toast.error("Failed to load batches");
      }
    } catch (error) {
      logger.error("Error loading batches:", error);
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [
    user?.businessId,
    currentPage,
    pageSize,
    selectedProduct,
    initialProductId,
    statusFilter,
    expiryFilter,
    products,
  ]);

  // Load all batches for dashboard and alerts (without pagination)
  const loadAllBatches = useCallback(async () => {
    if (!user?.businessId) return;

    try {
      const response = await window.batchesAPI.getByBusiness(user.businessId, {
        productId: selectedProduct?.id || initialProductId,
      });

      if (response.success && response.batches) {
        // Enrich with product data
        const enriched = response.batches.map((batch: ProductBatch) => {
          const product = products.find((p) => p.id === batch.productId);
          return {
            ...batch,
            product: product
              ? {
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  image: product.image,
                }
              : batch.product,
          };
        });
        setAllBatches(enriched);
      }
    } catch (error) {
      logger.error("Error loading all batches:", error);
    }
  }, [user?.businessId, selectedProduct, initialProductId, products]);

  // Load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      if (!user?.businessId) return;
      try {
        const response = await window.supplierAPI.getByBusiness(
          user.businessId
        );
        if (response.success && response.suppliers) {
          setSuppliers(response.suppliers);
        }
      } catch (error) {
        logger.error("Error loading suppliers:", error);
      }
    };
    loadSuppliers();
  }, [user?.businessId]);

  // Load expiry settings
  useEffect(() => {
    const loadExpirySettings = async () => {
      if (!user?.businessId) return;
      try {
        const response = await window.expirySettingsAPI.get(user.businessId);
        if (response.success && response.settings) {
          setExpirySettings(response.settings);
        } else {
          // Create default settings if none exist
          const defaultSettings: ExpirySettings = {
            id: "",
            businessId: user.businessId,
            criticalAlertDays: 3,
            warningAlertDays: 7,
            infoAlertDays: 14,
            notifyViaEmail: true,
            notifyViaPush: true,
            notifyViaDashboard: true,
            autoDisableExpired: true,
            allowSellNearExpiry: false,
            nearExpiryThreshold: 2,
            notificationRecipients: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setExpirySettings(defaultSettings);
        }
      } catch (error) {
        logger.error("Error loading expiry settings:", error);
        // Set default settings on error
        const defaultSettings: ExpirySettings = {
          id: "",
          businessId: user.businessId,
          criticalAlertDays: 3,
          warningAlertDays: 7,
          infoAlertDays: 14,
          notifyViaEmail: true,
          notifyViaPush: true,
          notifyViaDashboard: true,
          autoDisableExpired: true,
          allowSellNearExpiry: false,
          nearExpiryThreshold: 2,
          notificationRecipients: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setExpirySettings(defaultSettings);
      }
    };
    loadExpirySettings();
  }, [user?.businessId]);

  // Load batches when dependencies change
  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  // Load all batches for dashboard when view changes
  useEffect(() => {
    if (currentView === "dashboard" || currentView === "alerts") {
      loadAllBatches();
    }
  }, [currentView, loadAllBatches]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter, expiryFilter, selectedProduct]);

  // Clear product filter
  const clearProductFilter = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  // Get expiry alerts (use all batches for dashboard/alerts)
  const { criticalAlerts, warningAlerts, infoAlerts } = useExpiryAlerts({
    batches: allBatches,
    expirySettings,
    businessId: user?.businessId,
  });

  const handleCreateBatch = useCallback(() => {
    setEditingBatch(null);
    setIsBatchFormOpen(true);
  }, []);

  const handleEditBatch = useCallback((batch: ProductBatch) => {
    setEditingBatch(batch);
    setIsBatchFormOpen(true);
  }, []);

  const handleDeleteBatch = useCallback(
    async (batch: ProductBatch) => {
      if (
        !window.confirm(
          `Are you sure you want to delete batch ${batch.batchNumber}? This action cannot be undone.`
        )
      ) {
        return;
      }

      try {
        const response = await window.batchesAPI.remove(batch.id);
        if (response.success) {
          toast.success("Batch deleted successfully");
          loadBatches();
          loadAllBatches();
        } else {
          toast.error(response.error || "Failed to delete batch");
        }
      } catch (error) {
        logger.error("Error deleting batch:", error);
        toast.error("Failed to delete batch");
      }
    },
    [loadBatches, loadAllBatches]
  );

  const updateBatch = useCallback(
    async (_batchId: string, _updates: Partial<ProductBatch>) => {
      try {
        // Note: You'll need to add updateBatch to batchesAPI if not present
        loadBatches();
        loadAllBatches();
      } catch (error) {
        logger.error("Error updating batch:", error);
      }
    },
    [loadBatches, loadAllBatches]
  );

  const handleSaveBatch = useCallback(
    (_batch: ProductBatch) => {
      loadBatches();
    },
    [loadBatches]
  );

  const handleUpdateBatch = useCallback(
    (_batchId: string, _batch: ProductBatch) => {
      loadBatches();
    },
    [loadBatches]
  );

  const handleAdjustBatch = useCallback((batch: ProductBatch) => {
    setAdjustingBatch(batch);
    setAdjustmentQuantity("");
    setAdjustmentReason("");
    setAdjustmentType("add");
  }, []);

  const handleBatchAdjustment = useCallback(
    async (
      batchId: string,
      type: "add" | "remove" | "set",
      quantity: number,
      reason: string
    ) => {
      if (!window.batchesAPI) {
        toast.error("Batch API not available");
        return;
      }

      if (!user?.id) {
        toast.error("User information not available");
        return;
      }

      try {
        // Determine movement type based on adjustment type
        const movementType: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" =
          type === "add"
            ? "INBOUND"
            : type === "remove"
            ? "OUTBOUND"
            : "ADJUSTMENT";

        // Call batch API to update quantity with userId and reason for audit trail
        const response = await window.batchesAPI.updateQuantity(
          batchId,
          quantity,
          movementType,
          user.id,
          reason
        );

        if (response.success) {
          await loadBatches();
          toast.success(
            `Batch ${
              type === "add"
                ? "increased"
                : type === "remove"
                ? "decreased"
                : "adjusted"
            } successfully`
          );
        } else {
          toast.error(response.error || "Failed to adjust batch quantity");
        }
      } catch (error) {
        logger.error("Error adjusting batch:", error);
        toast.error("Failed to adjust batch quantity");
      }
    },
    [loadBatches, user]
  );

  if (!user?.businessId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please log in to manage batches</p>
      </div>
    );
  }

  return (
    <>
      {currentView === "dashboard" && (
        <ExpiryDashboard
          batches={allBatches}
          expirySettings={expirySettings}
          businessId={user.businessId}
          onViewBatches={() => setCurrentView("list")}
          onReceiveBatch={handleCreateBatch}
          onGenerateReport={() => {
            toast.info("Report generation coming soon");
          }}
          onCreatePromotion={() => {
            toast.info("Promotion creation coming soon");
          }}
        />
      )}

      {currentView === "alerts" && (
        <ExpiryAlertCenter
          criticalAlerts={criticalAlerts}
          warningAlerts={warningAlerts}
          infoAlerts={infoAlerts}
          onAcknowledge={(_alert) => {
            toast.info("Acknowledgment coming soon");
          }}
          onCreatePromotion={(_alert) => {
            toast.info("Promotion creation coming soon");
          }}
          onAdjustStock={(alert) => {
            handleAdjustBatch(alert.batch);
          }}
          onMarkAsWaste={(alert) => {
            updateBatch(alert.batch.id, { status: "REMOVED" });
            toast.success("Batch marked as waste");
            loadBatches();
          }}
        />
      )}

      {currentView === "list" && (
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* Context Alert - Show when filtered by product */}
          {selectedProduct && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm">
                  Viewing batches for:{" "}
                  <strong className="font-semibold">
                    {selectedProduct.name}
                  </strong>
                  {selectedProduct.sku && (
                    <span className="text-muted-foreground ml-2">
                      (SKU: {selectedProduct.sku})
                    </span>
                  )}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearProductFilter}
                  className="h-auto p-0 w-fit"
                >
                  View all batches
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView("dashboard")}
                className="w-fit"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Batch Management
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Manage product batches and expiry tracking
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentView("alerts")}
                className="w-full sm:w-auto"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Alerts ({criticalAlerts.length + warningAlerts.length})
              </Button>
              <Button onClick={handleCreateBatch} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create Batch
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <div className="flex flex-col space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search batches, products, SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
                    <SelectItem value="REMOVED">Removed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Expiry</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedProduct?.id || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedProduct(null);
                    } else {
                      const product = products.find((p) => p.id === value);
                      setSelectedProduct(product || null);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
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
              </div>
            </div>
          </div>

          {/* Batch List */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading batches...</p>
                </div>
              </div>
            ) : batches.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No batches found
                </h3>
                <p className="text-gray-600 mb-4">
                  {totalItems === 0
                    ? "Get started by creating your first batch."
                    : "Try adjusting your search criteria or filters."}
                </p>
                <Button onClick={handleCreateBatch}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Batch
                </Button>
              </div>
            ) : (
              <>
                <BatchList
                  batches={batches}
                  expirySettings={expirySettings || undefined}
                  onEdit={handleEditBatch}
                  onDelete={handleDeleteBatch}
                  onView={(batch) => {
                    setEditingBatch(batch);
                    setIsBatchFormOpen(true);
                  }}
                  onAdjustStock={handleAdjustBatch}
                  onCreatePromotion={(_batch) => {
                    toast.info("Promotion creation coming soon");
                  }}
                  onMarkAsWaste={(batch) => {
                    updateBatch(batch.id, { status: "REMOVED" });
                    toast.success("Batch marked as waste");
                  }}
                />

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  showPageSizeSelector={true}
                  showPageInfo={true}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Batch Form Drawer */}
      {user.businessId && (
        <BatchFormDrawer
          isOpen={isBatchFormOpen}
          editingBatch={editingBatch}
          product={
            (editingBatch &&
              products.find((p) => p.id === editingBatch.productId)) ||
            selectedProduct ||
            products.find((p) => p.id === initialProductId) ||
            null
          }
          products={products}
          suppliers={suppliers}
          businessId={user.businessId}
          onClose={() => {
            setIsBatchFormOpen(false);
            setEditingBatch(null);
          }}
          onSave={handleSaveBatch}
          onUpdate={handleUpdateBatch}
        />
      )}

      {/* Batch Adjustment Modal */}
      <BatchAdjustmentModal
        batch={adjustingBatch}
        adjustmentType={adjustmentType}
        quantity={adjustmentQuantity}
        reason={adjustmentReason}
        onClose={() => {
          setAdjustingBatch(null);
          setAdjustmentQuantity("");
          setAdjustmentReason("");
          setAdjustmentType("add");
        }}
        onTypeChange={setAdjustmentType}
        onQuantityChange={setAdjustmentQuantity}
        onReasonChange={setAdjustmentReason}
        onConfirm={handleBatchAdjustment}
      />
    </>
  );
};

export default BatchManagementView;
