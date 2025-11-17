import React, { useState, useCallback } from "react";
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
  Plus,
  Search,
  Filter,
  ChevronLeft,
  Package,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import { useBatchData } from "../hooks/use-batch-data";
import { useExpiryAlerts } from "../hooks/use-expiry-alerts";
import BatchList from "./batch-list";
import BatchFormDrawer from "./batch-form-drawer";
import ExpiryDashboard from "./expiry-dashboard";
import ExpiryAlertCenter from "./expiry-alert-center";
import type { ProductBatch } from "../types/batch.types";
import type { Product } from "../types/product.types";
import { useProductData } from "../hooks/use-product-data";
import { toast } from "sonner";

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
  const [currentView, setCurrentView] = useState<ViewMode>("dashboard");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");

  // Load products for selection
  const { products } = useProductData({ businessId: user?.businessId });

  // Load batch data
  const {
    batches,
    suppliers,
    expirySettings,
    loading,
    loadBatches,
    createBatch,
    updateBatch,
    deleteBatch,
  } = useBatchData({
    businessId: user?.businessId,
    productId: selectedProduct?.id || initialProductId,
  });

  // Get expiry alerts
  const {
    criticalAlerts,
    warningAlerts,
    infoAlerts,
  } = useExpiryAlerts({
    batches,
    expirySettings,
    businessId: user?.businessId,
  });

  // Filter batches
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      !searchTerm ||
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.product?.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || batch.status === statusFilter;

    // Expiry filter
    let matchesExpiry = true;
    if (expiryFilter !== "all" && expirySettings) {
      const daysUntil = Math.ceil(
        (new Date(batch.expiryDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (expiryFilter === "expired") {
        matchesExpiry = daysUntil < 0;
      } else if (expiryFilter === "critical") {
        matchesExpiry =
          daysUntil >= 0 && daysUntil <= expirySettings.criticalAlertDays;
      } else if (expiryFilter === "warning") {
        matchesExpiry =
          daysUntil > expirySettings.criticalAlertDays &&
          daysUntil <= expirySettings.warningAlertDays;
      } else if (expiryFilter === "info") {
        matchesExpiry =
          daysUntil > expirySettings.warningAlertDays &&
          daysUntil <= expirySettings.infoAlertDays;
      }
    }

    return matchesSearch && matchesStatus && matchesExpiry;
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

      const response = await deleteBatch(batch.id);
      if (response.success) {
        toast.success("Batch deleted successfully");
        loadBatches();
      } else {
        toast.error(response.error || "Failed to delete batch");
      }
    },
    [deleteBatch, loadBatches]
  );

  const handleSaveBatch = useCallback(
    (batch: ProductBatch) => {
      loadBatches();
    },
    [loadBatches]
  );

  const handleUpdateBatch = useCallback(
    (batchId: string, batch: ProductBatch) => {
      loadBatches();
    },
    [loadBatches]
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
          batches={batches}
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
          onAcknowledge={(alert) => {
            toast.info("Acknowledgment coming soon");
          }}
          onCreatePromotion={(alert) => {
            toast.info("Promotion creation coming soon");
          }}
          onAdjustStock={(alert) => {
            handleEditBatch(alert.batch);
          }}
          onMarkAsWaste={(alert) => {
            updateBatch(alert.batch.id, { status: "REMOVED" });
            toast.success("Batch marked as waste");
            loadBatches();
          }}
        />
      )}

      {currentView === "list" && (
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Batch Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage product batches and expiry tracking
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setCurrentView("dashboard")}>
                Dashboard
              </Button>
              <Button variant="outline" onClick={() => setCurrentView("alerts")}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Alerts ({criticalAlerts.length + warningAlerts.length})
              </Button>
              <Button onClick={handleCreateBatch}>
                <Plus className="w-4 h-4 mr-2" />
                Create Batch
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search batches, products, SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
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
                  <SelectTrigger className="w-full sm:w-40">
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
                  <SelectTrigger className="w-full sm:w-48">
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading batches...</p>
              </div>
            </div>
          ) : (
            <BatchList
              batches={filteredBatches}
              expirySettings={expirySettings || undefined}
              onEdit={handleEditBatch}
              onDelete={handleDeleteBatch}
              onView={(batch) => {
                setEditingBatch(batch);
                setIsBatchFormOpen(true);
              }}
              onAdjustStock={handleEditBatch}
              onCreatePromotion={(batch) => {
                toast.info("Promotion creation coming soon");
              }}
              onMarkAsWaste={(batch) => {
                updateBatch(batch.id, { status: "REMOVED" });
                toast.success("Batch marked as waste");
                loadBatches();
              }}
            />
          )}
        </div>
      )}

      {/* Batch Form Drawer */}
      {user.businessId && (
        <BatchFormDrawer
          isOpen={isBatchFormOpen}
          editingBatch={editingBatch}
          product={selectedProduct || products.find((p) => p.id === initialProductId) || null}
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
    </>
  );
};

export default BatchManagementView;

