import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ProductBatch, BatchFormData, Supplier } from "../types/batch.types";
import { generateBatchNumber } from "../utils/expiry-calculations";
import type { Product } from "../types/product.types";

interface BatchFormDrawerProps {
  isOpen: boolean;
  editingBatch: ProductBatch | null;
  product: Product | null;
  products?: Product[]; // For product selection when creating new batch
  suppliers: Supplier[];
  businessId: string;
  onClose: () => void;
  onSave: (batch: ProductBatch) => void;
  onUpdate: (batchId: string, batch: ProductBatch) => void;
}

const BatchFormDrawer: React.FC<BatchFormDrawerProps> = ({
  isOpen,
  editingBatch,
  product: initialProduct,
  products = [],
  suppliers,
  businessId,
  onClose,
  onSave,
  onUpdate,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || null);
  const [formData, setFormData] = useState<BatchFormData>({
    productId: "",
    batchNumber: "",
    manufacturingDate: "",
    expiryDate: "",
    initialQuantity: 0,
    supplierId: "none",
    purchaseOrderNumber: "",
    costPrice: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [autoGenerateBatchNumber, setAutoGenerateBatchNumber] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    // Update selected product when initialProduct changes
    if (initialProduct && !editingBatch) {
      setSelectedProduct(initialProduct);
    }

    if (editingBatch) {
      setSelectedProduct(initialProduct);
      setFormData({
        productId: editingBatch.productId,
        batchNumber: editingBatch.batchNumber,
        manufacturingDate: editingBatch.manufacturingDate
          ? new Date(editingBatch.manufacturingDate).toISOString().split("T")[0]
          : "",
        expiryDate: new Date(editingBatch.expiryDate).toISOString().split("T")[0],
        initialQuantity: editingBatch.initialQuantity,
        supplierId: editingBatch.supplierId || "none",
        purchaseOrderNumber: editingBatch.purchaseOrderNumber || "",
        costPrice: editingBatch.costPrice || 0,
      });
      setAutoGenerateBatchNumber(false);
    } else if (selectedProduct) {
      const today = new Date().toISOString().split("T")[0];
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30);
      const defaultExpiryStr = defaultExpiry.toISOString().split("T")[0];

      setFormData({
        productId: selectedProduct.id,
        batchNumber: autoGenerateBatchNumber
          ? generateBatchNumber(selectedProduct.sku, defaultExpiryStr)
          : "",
        manufacturingDate: today,
        expiryDate: defaultExpiryStr,
        initialQuantity: 0,
        supplierId: "none",
        purchaseOrderNumber: "",
        costPrice: selectedProduct.costPrice || 0,
      });
    } else {
      // Reset form when no product is selected
      setFormData({
        productId: "",
        batchNumber: "",
        manufacturingDate: "",
        expiryDate: "",
        initialQuantity: 0,
        supplierId: "none",
        purchaseOrderNumber: "",
        costPrice: 0,
      });
    }
  }, [isOpen, editingBatch, selectedProduct, autoGenerateBatchNumber, initialProduct]);

  const resetForm = () => {
    setSelectedProduct(initialProduct || null);
    setFormData({
      productId: "",
      batchNumber: "",
      manufacturingDate: "",
      expiryDate: "",
      initialQuantity: 0,
      supplierId: "none",
      purchaseOrderNumber: "",
      costPrice: 0,
    });
    setFormErrors({});
    setAutoGenerateBatchNumber(true);
  };

  const handleInputChange = useCallback(
    (field: keyof BatchFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (formErrors[field]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [formErrors]
  );

  const clearFieldError = useCallback((field: string) => {
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const validateForm = (): { success: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!formData.productId) {
      errors.productId = "Product is required";
    }
    if (!formData.batchNumber && !autoGenerateBatchNumber) {
      errors.batchNumber = "Batch number is required";
    }
    if (!formData.expiryDate) {
      errors.expiryDate = "Expiry date is required";
    }
    if (formData.initialQuantity <= 0) {
      errors.initialQuantity = "Initial quantity must be greater than 0";
    }

    // Validate expiry date is in the future (unless editing)
    if (formData.expiryDate && !editingBatch) {
      const expiry = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiry < today) {
        errors.expiryDate = "Expiry date cannot be in the past";
      }
    }

    return {
      success: Object.keys(errors).length === 0,
      errors,
    };
  };

  const handleSubmit = async () => {
    setFormErrors({});
    const validation = validateForm();

    if (!validation.success) {
      setFormErrors(validation.errors);
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);

        const batchData = {
          productId: formData.productId,
          batchNumber:
            formData.batchNumber ||
            (selectedProduct
              ? generateBatchNumber(selectedProduct.sku, formData.expiryDate)
              : ""),
          manufacturingDate: formData.manufacturingDate
            ? new Date(formData.manufacturingDate).toISOString()
            : undefined,
          expiryDate: new Date(formData.expiryDate).toISOString(),
          initialQuantity: formData.initialQuantity,
          currentQuantity: editingBatch
            ? editingBatch.currentQuantity
            : formData.initialQuantity,
          supplierId: formData.supplierId && formData.supplierId !== "none" ? formData.supplierId : undefined,
          purchaseOrderNumber: formData.purchaseOrderNumber || undefined,
          costPrice: formData.costPrice > 0 ? formData.costPrice : undefined,
          businessId,
        };

      if (editingBatch) {
        const response = await window.batchAPI?.update(editingBatch.id, batchData);
        if (response?.success && response.batch) {
          onUpdate(editingBatch.id, response.batch);
          toast.success("Batch updated successfully");
          onClose();
        } else {
          toast.error(response?.error || "Failed to update batch");
        }
      } else {
        const response = await window.batchAPI?.create(batchData);
        if (response?.success && response.batch) {
          onSave(response.batch);
          toast.success("Batch created successfully");
          onClose();
        } else {
          toast.error(response?.error || "Failed to create batch");
        }
      }
    } catch (error) {
      console.error("Error saving batch:", error);
      toast.error("Failed to save batch");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!businessId) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()} direction="right">
      <DrawerContent className="h-full w-[600px] mt-0 rounded-none fixed right-0 top-0">
        <DrawerHeader className="border-b">
          <DrawerTitle>
            {editingBatch ? "Edit Batch" : "Create New Batch"}
          </DrawerTitle>
          <DrawerDescription>
            {editingBatch
              ? "Update the batch information below."
              : "Enter batch details to track product expiry."}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Product Selection */}
          <div>
            <Label htmlFor="productId">Product *</Label>
            {editingBatch ? (
              // Read-only when editing
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {selectedProduct ? (
                  <div className="flex items-center space-x-3">
                    {selectedProduct.image && (
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{selectedProduct.name}</div>
                      <div className="text-sm text-gray-500">{selectedProduct.sku}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">No product selected</span>
                )}
              </div>
            ) : (
              // Product selector when creating new batch
              <Select
                value={selectedProduct?.id || undefined}
                onValueChange={(value) => {
                  const product = products.find((p) => p.id === value);
                  setSelectedProduct(product || null);
                  if (product) {
                    handleInputChange("productId", product.id);
                    handleInputChange("costPrice", product.costPrice || 0);
                    // Auto-generate batch number if enabled
                    if (autoGenerateBatchNumber && formData.expiryDate) {
                      handleInputChange(
                        "batchNumber",
                        generateBatchNumber(product.sku, formData.expiryDate)
                      );
                    } else if (autoGenerateBatchNumber) {
                      // Set default expiry if not set
                      const defaultExpiry = new Date();
                      defaultExpiry.setDate(defaultExpiry.getDate() + 30);
                      const defaultExpiryStr = defaultExpiry.toISOString().split("T")[0];
                      handleInputChange("expiryDate", defaultExpiryStr);
                      handleInputChange(
                        "batchNumber",
                        generateBatchNumber(product.sku, defaultExpiryStr)
                      );
                    }
                  } else {
                    handleInputChange("productId", "");
                  }
                  clearFieldError("productId");
                }}
              >
                <SelectTrigger
                  id="productId"
                  className={formErrors.productId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No products available
                    </div>
                  ) : (
                    products.map((prod) => (
                      <SelectItem key={prod.id} value={prod.id}>
                        <div className="flex items-center space-x-2">
                          {prod.image && (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-6 h-6 rounded object-cover"
                            />
                          )}
                          <span>{prod.name}</span>
                          <span className="text-xs text-gray-500">({prod.sku})</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {formErrors.productId && (
              <p className="text-sm text-red-500 mt-1">{formErrors.productId}</p>
            )}
          </div>

          {/* Batch Number */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              {!editingBatch && (
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoGenerateBatchNumber}
                    onChange={(e) => {
                      setAutoGenerateBatchNumber(e.target.checked);
                    if (e.target.checked && selectedProduct) {
                      handleInputChange(
                        "batchNumber",
                        generateBatchNumber(
                          selectedProduct.sku,
                          formData.expiryDate || new Date().toISOString()
                        )
                      );
                    }
                    }}
                    className="rounded"
                  />
                  <span>Auto-generate</span>
                </label>
              )}
            </div>
            <Input
              id="batchNumber"
              value={formData.batchNumber}
              onChange={(e) => handleInputChange("batchNumber", e.target.value)}
              placeholder="Enter batch number"
              disabled={autoGenerateBatchNumber && !editingBatch}
              className={formErrors.batchNumber ? "border-red-500" : ""}
            />
            {formErrors.batchNumber && (
              <p className="text-sm text-red-500 mt-1">{formErrors.batchNumber}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manufacturingDate">Manufacturing Date (Optional)</Label>
              <Input
                id="manufacturingDate"
                type="date"
                value={formData.manufacturingDate}
                onChange={(e) => handleInputChange("manufacturingDate", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => {
                  handleInputChange("expiryDate", e.target.value);
                  // Auto-update batch number if auto-generate is enabled
                  if (autoGenerateBatchNumber && selectedProduct && e.target.value) {
                    handleInputChange(
                      "batchNumber",
                      generateBatchNumber(selectedProduct.sku, e.target.value)
                    );
                  }
                }}
                className={formErrors.expiryDate ? "border-red-500" : ""}
              />
              {formErrors.expiryDate && (
                <p className="text-sm text-red-500 mt-1">{formErrors.expiryDate}</p>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="initialQuantity">Initial Quantity *</Label>
            <Input
              id="initialQuantity"
              type="number"
              min="1"
              step="0.01"
              value={formData.initialQuantity}
              onChange={(e) =>
                handleInputChange("initialQuantity", parseFloat(e.target.value) || 0)
              }
              className={formErrors.initialQuantity ? "border-red-500" : ""}
            />
            {formErrors.initialQuantity && (
              <p className="text-sm text-red-500 mt-1">{formErrors.initialQuantity}</p>
            )}
            {editingBatch && (
              <p className="text-xs text-gray-500 mt-1">
                Current stock: {editingBatch.currentQuantity} units
              </p>
            )}
          </div>

          {/* Supplier */}
          <div>
            <Label htmlFor="supplierId">Supplier (Optional)</Label>
            <Select
              value={formData.supplierId || undefined}
              onValueChange={(value) => handleInputChange("supplierId", value === "none" ? "" : value)}
            >
              <SelectTrigger id="supplierId">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No suppliers available
                  </div>
                ) : (
                  <>
                    <SelectItem value="none">None</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Purchase Order & Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchaseOrderNumber">Purchase Order # (Optional)</Label>
              <Input
                id="purchaseOrderNumber"
                value={formData.purchaseOrderNumber}
                onChange={(e) =>
                  handleInputChange("purchaseOrderNumber", e.target.value)
                }
                placeholder="PO-12345"
              />
            </div>

            <div>
              <Label htmlFor="costPrice">Cost Price (Optional)</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) =>
                  handleInputChange("costPrice", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-6 border-t">
            <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
              {loading
                ? "Saving..."
                : editingBatch
                ? "Update Batch"
                : "Create Batch"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BatchFormDrawer;

