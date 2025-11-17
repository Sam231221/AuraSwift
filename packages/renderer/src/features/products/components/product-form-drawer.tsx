import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Product, Modifier } from "@/features/products/types/product.types";
import type { Category, VatCategory } from "../hooks/use-product-data";

interface ProductFormData {
  name: string;
  description: string;
  basePrice: number;
  costPrice: number;
  sku: string;
  barcode: string;
  plu: string;
  image: string;
  categoryId: string;
  productType: "STANDARD" | "WEIGHTED" | "GENERIC";
  salesUnit: "PIECE" | "KG" | "GRAM" | "LITRE" | "ML" | "PACK";
  usesScale: boolean;
  pricePerKg: number;
  isGenericButton: boolean;
  genericDefaultPrice: number;
  trackInventory: boolean;
  stockLevel: number;
  minStockLevel: number;
  reorderPoint: number;
  vatCategoryId: string;
  vatOverridePercent: string;
  isActive: boolean;
  allowPriceOverride: boolean;
  allowDiscount: boolean;
  modifiers: Modifier[];
}

interface ProductFormDrawerProps {
  isOpen: boolean;
  editingProduct: Product | null;
  categories: Category[];
  vatCategories: VatCategory[];
  businessId: string;
  onClose: () => void;
  onSave: (product: Product) => void;
  onUpdate: (productId: string, product: Product) => void;
}

const getDefaultFormData = (categories: Category[]): ProductFormData => ({
  name: "",
  description: "",
  basePrice: 0,
  costPrice: 0,
  sku: "",
  barcode: "",
  plu: "",
  image: "",
  categoryId: categories.length > 0 ? categories[0].id : "",
  productType: "STANDARD",
  salesUnit: "PIECE",
  usesScale: false,
  pricePerKg: 0,
  isGenericButton: false,
  genericDefaultPrice: 0,
  trackInventory: true,
  stockLevel: 0,
  minStockLevel: 5,
  reorderPoint: 0,
  vatCategoryId: "",
  vatOverridePercent: "",
  isActive: true,
  allowPriceOverride: false,
  allowDiscount: true,
  modifiers: [],
});

const ProductFormDrawer: React.FC<ProductFormDrawerProps> = ({
  isOpen,
  editingProduct,
  categories = [],
  vatCategories = [],
  businessId,
  onClose,
  onSave,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<ProductFormData>(() => {
    try {
      return getDefaultFormData(categories || []);
    } catch (error) {
      console.error("Error initializing form data:", error);
      return getDefaultFormData([]);
    }
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [loading, setLoading] = useState(false);

  // Reset form when drawer opens/closes or editing product changes
  useEffect(() => {
    try {
      if (!isOpen) {
        setFormData(getDefaultFormData(categories || []));
        setFormErrors({});
        setActiveTab("basic");
        return;
      }

      if (editingProduct) {
      // Map product to form data
      const dbProduct = editingProduct as unknown as Record<string, unknown>;
      const productCategoryId =
        (dbProduct.categoryId as string | undefined) ||
        editingProduct.category;
      const safeCategories = categories || [];
      const categoryExists = safeCategories.some((cat) => cat.id === productCategoryId);
      const validCategory = categoryExists
        ? productCategoryId
        : safeCategories.length > 0
        ? safeCategories[0].id
        : "";

      if (!categoryExists && productCategoryId) {
        toast.error(
          "This product's category no longer exists. Please select a new category."
        );
      }

      const normalizedModifiers = (editingProduct.modifiers || []).map(
        (modifier) => ({
          ...modifier,
          multiSelect:
            "multiSelect" in modifier
              ? Boolean((modifier as { multiSelect?: boolean }).multiSelect)
              : modifier.type === "multiple",
          required: modifier.required ?? false,
        })
      );

      setFormData({
        name: editingProduct.name,
        description: editingProduct.description || "",
        basePrice:
          (dbProduct.basePrice as number | undefined) ??
          editingProduct.price ??
          0,
        costPrice: editingProduct.costPrice || 0,
        sku: editingProduct.sku,
        barcode: (dbProduct.barcode as string | undefined) || "",
        plu: editingProduct.plu || "",
        image: editingProduct.image || "",
        categoryId: (dbProduct.categoryId as string | undefined) || validCategory,
        productType:
          (dbProduct.productType as
            | "STANDARD"
            | "WEIGHTED"
            | "GENERIC"
            | undefined) || "STANDARD",
        salesUnit:
          (dbProduct.salesUnit as
            | "PIECE"
            | "KG"
            | "GRAM"
            | "LITRE"
            | "ML"
            | "PACK"
            | undefined) ||
          ((dbProduct.usesScale as boolean | undefined) ? "KG" : "PIECE"),
        usesScale:
          (dbProduct.usesScale as boolean | undefined) ??
          Boolean(editingProduct.requiresWeight),
        pricePerKg:
          (dbProduct.pricePerKg as number | undefined) ??
          editingProduct.pricePerUnit ??
          0,
        isGenericButton:
          (dbProduct.isGenericButton as boolean | undefined) || false,
        genericDefaultPrice:
          (dbProduct.genericDefaultPrice as number | undefined) || 0,
        trackInventory:
          (dbProduct.trackInventory as boolean | undefined) !== undefined
            ? (dbProduct.trackInventory as boolean)
            : true,
        stockLevel: editingProduct.stockLevel || 0,
        minStockLevel: editingProduct.minStockLevel || 0,
        reorderPoint: (dbProduct.reorderPoint as number | undefined) || 0,
        vatCategoryId: (dbProduct.vatCategoryId as string | undefined) || "",
        vatOverridePercent: dbProduct.vatOverridePercent
          ? (dbProduct.vatOverridePercent as number).toString()
          : "",
        isActive:
          editingProduct.isActive !== undefined ? editingProduct.isActive : true,
        allowPriceOverride:
          (dbProduct.allowPriceOverride as boolean | undefined) || false,
        allowDiscount:
          (dbProduct.allowDiscount as boolean | undefined) !== undefined
            ? (dbProduct.allowDiscount as boolean)
            : true,
        modifiers: normalizedModifiers,
      });

      if (!validCategory) {
        setFormErrors({ categoryId: "Please select a category" });
      }
    } else {
      setFormData(getDefaultFormData(categories || []));
      setFormErrors({});
    }
    } catch (error) {
      console.error("Error in ProductFormDrawer useEffect:", error);
      setFormData(getDefaultFormData(categories || []));
      setFormErrors({});
    }
  }, [isOpen, editingProduct, categories]);

  const handleInputChange = useCallback(
    (field: keyof ProductFormData, value: string | number | boolean) => {
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

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          handleInputChange("image", e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [handleInputChange]
  );

  const validateForm = (): { success: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Product name is required";
    }
    if (!formData.sku.trim()) {
      errors.sku = "SKU is required";
    }
    if (!formData.categoryId) {
      errors.categoryId = "Category is required";
    }
    if (formData.basePrice <= 0) {
      errors.basePrice = "Sale price must be greater than 0";
    }
    if (formData.usesScale && formData.pricePerKg <= 0) {
      errors.pricePerKg =
        "Price per kg must be greater than 0 for weighted products";
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

      const errorFields = Object.keys(validation.errors);
      const basicInfoFields = ["name", "sku", "plu", "categoryId", "barcode"];
      const pricingFields = [
        "basePrice",
        "costPrice",
        "stockLevel",
        "minStockLevel",
        "reorderPoint",
        "salesUnit",
        "pricePerKg",
        "vatCategoryId",
        "vatOverridePercent",
      ];

      if (errorFields.some((field) => basicInfoFields.includes(field))) {
        setActiveTab("basic");
        setTimeout(() => {
          const firstErrorField = errorFields.find((field) =>
            basicInfoFields.includes(field)
          );
          if (firstErrorField) {
            const element = document.getElementById(firstErrorField);
            if (element) {
              if (firstErrorField === "categoryId") {
                element.click();
              } else {
                element.focus();
              }
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
        }, 100);
      } else if (errorFields.some((field) => pricingFields.includes(field))) {
        setActiveTab("pricing");
        setTimeout(() => {
          const firstErrorField = errorFields.find((field) =>
            pricingFields.includes(field)
          );
          if (firstErrorField) {
            const element = document.getElementById(firstErrorField);
            if (element) {
              element.focus();
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
        }, 100);
      }

      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);

      const productData = {
        name: formData.name.trim(),
        description: (formData.description || "").trim() || undefined,
        basePrice: formData.basePrice,
        costPrice: formData.costPrice || 0,
        sku: formData.sku.trim(),
        barcode: (formData.barcode || "").trim() || undefined,
        plu: (formData.plu || "").trim() || undefined,
        image: (formData.image || "").trim() || undefined,
        categoryId: formData.categoryId,
        productType: formData.productType || "STANDARD",
        salesUnit: formData.salesUnit || "PIECE",
        usesScale: formData.usesScale || false,
        pricePerKg:
          formData.usesScale && formData.pricePerKg > 0
            ? formData.pricePerKg
            : undefined,
        isGenericButton: formData.isGenericButton || false,
        genericDefaultPrice:
          formData.isGenericButton && formData.genericDefaultPrice > 0
            ? formData.genericDefaultPrice
            : undefined,
        trackInventory:
          formData.trackInventory !== undefined ? formData.trackInventory : true,
        stockLevel: formData.stockLevel || 0,
        minStockLevel: formData.minStockLevel || 0,
        reorderPoint: formData.reorderPoint || 0,
        vatCategoryId: formData.vatCategoryId || undefined,
        vatOverridePercent: formData.vatOverridePercent
          ? parseFloat(formData.vatOverridePercent)
          : undefined,
        businessId,
        isActive:
          formData.isActive !== undefined ? formData.isActive : true,
        allowPriceOverride: formData.allowPriceOverride || false,
        allowDiscount:
          formData.allowDiscount !== undefined ? formData.allowDiscount : true,
      };

      if (editingProduct) {
        const response = await window.productAPI.update(
          editingProduct.id,
          productData
        );
        if (response.success && response.product) {
          onUpdate(editingProduct.id, response.product);
          toast.success("Product updated successfully");
          onClose();
        } else {
          const errorMsg = response.message || "Failed to update product";
          const lowerErrorMsg = errorMsg.toLowerCase();

          if (
            (lowerErrorMsg.includes("sku") &&
              lowerErrorMsg.includes("already exists")) ||
            lowerErrorMsg.includes("unique constraint failed: products.sku")
          ) {
            setFormErrors({
              sku: "This SKU already exists. Please use a different SKU.",
            });
            setActiveTab("basic");
            toast.error("SKU already exists");
          } else if (
            (lowerErrorMsg.includes("plu") &&
              lowerErrorMsg.includes("already exists")) ||
            lowerErrorMsg.includes("unique constraint failed: products.plu")
          ) {
            setFormErrors({
              plu: "This PLU code already exists. Please use a different PLU.",
            });
            setActiveTab("basic");
            toast.error("PLU code already exists");
          } else {
            toast.error(errorMsg);
          }
        }
      } else {
        const response = await window.productAPI.create(productData);
        if (response.success && response.product) {
          onSave(response.product);
          toast.success("Product created successfully");
          onClose();
        } else {
          const errorMsg = response.message || "Failed to create product";
          const lowerErrorMsg = errorMsg.toLowerCase();

          if (
            (lowerErrorMsg.includes("sku") &&
              lowerErrorMsg.includes("already exists")) ||
            lowerErrorMsg.includes("unique constraint failed: products.sku")
          ) {
            setFormErrors({
              sku: "This SKU already exists. Please use a different SKU.",
            });
            setActiveTab("basic");
            toast.error("SKU already exists");
          } else if (
            (lowerErrorMsg.includes("plu") &&
              lowerErrorMsg.includes("already exists")) ||
            lowerErrorMsg.includes("unique constraint failed: products.plu")
          ) {
            setFormErrors({
              plu: "This PLU code already exists. Please use a different PLU.",
            });
            setActiveTab("basic");
            toast.error("PLU code already exists");
          } else {
            toast.error(errorMsg);
          }
        }
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(getDefaultFormData(categories || []));
    setFormErrors({});
    setActiveTab("basic");
    onClose();
  };

  // Safety check - don't render if businessId is missing
  if (!businessId) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()} direction="right">
      <DrawerContent className="h-full w-[800px] mt-0 rounded-none fixed right-0 top-0">
        <DrawerHeader className="border-b">
          <DrawerTitle>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DrawerTitle>
          <DrawerDescription>
            {editingProduct
              ? "Update the product information below."
              : "Fill in the details to create a new menu item."}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-6 overflow-y-auto flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              {/* Image Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div>
                  <Label htmlFor="image" className="cursor-pointer">
                    <div className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Upload Image</span>
                    </div>
                  </Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter product name"
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select
                    value={
                      !categories || categories.length === 0
                        ? undefined
                        : formData.categoryId &&
                          categories.some((cat) => cat.id === formData.categoryId)
                        ? formData.categoryId
                        : categories[0].id
                    }
                    onValueChange={(value) => {
                      handleInputChange("categoryId", value);
                      clearFieldError("categoryId");
                    }}
                    disabled={!categories || categories.length === 0}
                  >
                    <SelectTrigger
                      id="categoryId"
                      className={
                        formErrors.categoryId ? "border-red-500" : ""
                      }
                    >
                      <SelectValue
                        placeholder={
                          !categories || categories.length === 0
                            ? "No categories available"
                            : "Select a category"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {!categories || categories.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No categories found - please add a category first
                        </div>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.categoryId && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.categoryId}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => {
                      handleInputChange("sku", e.target.value);
                      clearFieldError("sku");
                    }}
                    placeholder="Enter SKU"
                    className={formErrors.sku ? "border-red-500" : ""}
                  />
                  {formErrors.sku && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.sku}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="plu">PLU Code (Optional)</Label>
                  <Input
                    id="plu"
                    value={formData.plu}
                    onChange={(e) => {
                      handleInputChange("plu", e.target.value);
                      clearFieldError("plu");
                    }}
                    placeholder="Enter PLU code"
                    className={formErrors.plu ? "border-red-500" : ""}
                  />
                  {formErrors.plu && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.plu}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="basePrice">Sale Price *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) =>
                      handleInputChange(
                        "basePrice",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                    className={formErrors.basePrice ? "border-red-500" : ""}
                  />
                  {formErrors.basePrice && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.basePrice}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="costPrice">Cost Price *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) =>
                      handleInputChange(
                        "costPrice",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                    className={formErrors.costPrice ? "border-red-500" : ""}
                  />
                  {formErrors.costPrice && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.costPrice}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="barcode">Barcode (Optional)</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange("barcode", e.target.value)}
                    placeholder="Enter barcode"
                  />
                </div>

                <div>
                  <Label>Profit Margin</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                    {(formData.basePrice || 0) > 0 && (formData.costPrice || 0) > 0
                      ? `${(
                          (((formData.basePrice || 0) - (formData.costPrice || 0)) /
                            (formData.basePrice || 1)) *
                          100
                        ).toFixed(1)}%`
                      : "N/A"}
                  </div>
                </div>
              </div>

              {/* Weight-based Product Configuration */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-medium mb-4">
                  Product Type & Weight Configuration
                </h4>

                <div className="mb-4">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select
                    value={formData.productType}
                    onValueChange={(value: "STANDARD" | "WEIGHTED" | "GENERIC") => {
                      handleInputChange("productType", value);
                      handleInputChange("usesScale", value === "WEIGHTED");
                    }}
                  >
                    <SelectTrigger id="productType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard Product</SelectItem>
                      <SelectItem value="WEIGHTED">Weighted Product</SelectItem>
                      <SelectItem value="GENERIC">Generic Button</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="usesScale"
                    checked={Boolean(formData.usesScale)}
                    onCheckedChange={(checked) => {
                      handleInputChange("usesScale", Boolean(checked));
                      handleInputChange(
                        "productType",
                        checked ? "WEIGHTED" : "STANDARD"
                      );
                      handleInputChange(
                        "pricePerKg",
                        checked ? formData.basePrice : 0
                      );
                    }}
                  />
                  <Label htmlFor="usesScale">Sold by Weight (Uses Scale)</Label>
                </div>

                {formData.usesScale && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div>
                      <Label htmlFor="salesUnit">Sales Unit</Label>
                      <Select
                        value={formData.salesUnit}
                        onValueChange={(
                          value:
                            | "PIECE"
                            | "KG"
                            | "GRAM"
                            | "LITRE"
                            | "ML"
                            | "PACK"
                        ) => handleInputChange("salesUnit", value)}
                      >
                        <SelectTrigger
                          className={
                            formErrors.salesUnit ? "border-red-500" : ""
                          }
                        >
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KG">Kilograms (KG)</SelectItem>
                          <SelectItem value="GRAM">Grams (GRAM)</SelectItem>
                          <SelectItem value="LITRE">Litres (LITRE)</SelectItem>
                          <SelectItem value="ML">Millilitres (ML)</SelectItem>
                          <SelectItem value="PACK">Pack (PACK)</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.salesUnit && (
                        <p className="text-sm text-red-500 mt-1">
                          {formErrors.salesUnit}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="pricePerKg">
                        Price per {formData.salesUnit}
                      </Label>
                      <Input
                        id="pricePerKg"
                        type="number"
                        step="0.01"
                        value={formData.pricePerKg}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          handleInputChange("pricePerKg", value);
                          handleInputChange("basePrice", value);
                        }}
                        placeholder="0.00"
                        className={
                          formErrors.pricePerKg ? "border-red-500" : ""
                        }
                      />
                      {formErrors.pricePerKg && (
                        <p className="text-sm text-red-500 mt-1">
                          {formErrors.pricePerKg}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        This will be multiplied by the weight during checkout
                      </p>
                    </div>
                  </div>
                )}

                {formData.productType === "GENERIC" && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div>
                      <Label htmlFor="genericDefaultPrice">Default Price</Label>
                      <Input
                        id="genericDefaultPrice"
                        type="number"
                        step="0.01"
                        value={formData.genericDefaultPrice}
                        onChange={(e) =>
                          handleInputChange(
                            "genericDefaultPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Suggested price for generic items
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stockLevel">Current Stock</Label>
                  <Input
                    id="stockLevel"
                    type="number"
                    value={formData.stockLevel}
                    onChange={(e) =>
                      handleInputChange(
                        "stockLevel",
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                    className={formErrors.stockLevel ? "border-red-500" : ""}
                  />
                  {formErrors.stockLevel && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.stockLevel}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) =>
                      handleInputChange(
                        "minStockLevel",
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="5"
                    className={
                      formErrors.minStockLevel ? "border-red-500" : ""
                    }
                  />
                  {formErrors.minStockLevel && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.minStockLevel}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reorderPoint">Reorder Point</Label>
                  <Input
                    id="reorderPoint"
                    type="number"
                    value={formData.reorderPoint}
                    onChange={(e) =>
                      handleInputChange(
                        "reorderPoint",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Stock level at which to reorder
                  </p>
                </div>
              </div>

              {/* VAT Configuration */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-medium mb-4">VAT Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vatCategoryId">VAT Category</Label>
                    <select
                      id="vatCategoryId"
                      className="w-full border rounded px-3 py-2 mt-1"
                      value={formData.vatCategoryId}
                      onChange={(e) =>
                        handleInputChange("vatCategoryId", e.target.value)
                      }
                    >
                      <option value="">None (Use Category Default)</option>
                      {vatCategories && vatCategories.length > 0
                        ? vatCategories.map((vat) => (
                            <option key={vat.id} value={vat.id}>
                              {vat.name} ({vat.ratePercent}%)
                            </option>
                          ))
                        : null}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="vatOverridePercent">VAT Override (%)</Label>
                    <Input
                      id="vatOverridePercent"
                      type="number"
                      step="0.01"
                      value={formData.vatOverridePercent}
                      onChange={(e) =>
                        handleInputChange("vatOverridePercent", e.target.value)
                      }
                      placeholder="Override VAT percent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Override VAT rate for this product
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Settings */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-medium mb-4">Product Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="trackInventory"
                      checked={formData.trackInventory}
                      onCheckedChange={(checked) =>
                        handleInputChange("trackInventory", checked)
                      }
                    />
                    <Label htmlFor="trackInventory">Track Inventory</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowPriceOverride"
                      checked={formData.allowPriceOverride}
                      onCheckedChange={(checked) =>
                        handleInputChange("allowPriceOverride", checked)
                      }
                    />
                    <Label htmlFor="allowPriceOverride">
                      Allow Price Override
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowDiscount"
                      checked={formData.allowDiscount}
                      onCheckedChange={(checked) =>
                        handleInputChange("allowDiscount", checked)
                      }
                    />
                    <Label htmlFor="allowDiscount">Allow Discount</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        handleInputChange("isActive", checked)
                      }
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex space-x-2 pt-6 border-t mt-6">
            <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
              {loading
                ? "Saving..."
                : editingProduct
                ? "Update Product"
                : "Add Product"}
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

export default ProductFormDrawer;

