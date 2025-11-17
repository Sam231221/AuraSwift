import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Plus,
  Search,
  Filter,
  Edit,
  Package,
  Settings,
  AlertTriangle,
  MenuSquare,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Upload,
  TrendingDown,
  Scale,
  Tag,
} from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/shared/hooks/use-auth";
import type {
  Product,
  Modifier,
} from "@/features/products/types/product.types";
// import { validateProduct } from "@/features/products/schemas/product-schema"; // TODO: Update schema validation
import ManageCategoriesView from "@/features/categories/components/manage-categories-view";

// Category type
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

interface ProductManagementViewProps {
  onBack: () => void;
}

const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  onBack,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [currentView, setCurrentView] = useState<
    "productDashboard" | "productManagement" | "categoryManagement"
  >("productDashboard");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vatCategories, setVatCategories] = useState<
    Array<{ id: string; name: string; ratePercent: number }>
  >([]);
  const [loading, setLoading] = useState(true);

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockAdjustmentProduct, setStockAdjustmentProduct] =
    useState<Product | null>(null);
  const [stockAdjustmentType, setStockAdjustmentType] = useState<
    "add" | "remove"
  >("add");
  const [stockAdjustmentQuantity, setStockAdjustmentQuantity] = useState("");
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState("");

  // Reset stock adjustment form when modal opens
  useEffect(() => {
    if (stockAdjustmentProduct) {
      // Reset form when modal opens with a new product
      setStockAdjustmentQuantity("");
      setStockAdjustmentReason("");
      setStockAdjustmentType("add");
    }
  }, [stockAdjustmentProduct]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<string>("basic");

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    basePrice: 0,
    costPrice: 0,
    sku: "",
    barcode: "",
    plu: "",
    image: "",
    categoryId: "",
    productType: "STANDARD" as "STANDARD" | "WEIGHTED" | "GENERIC",
    salesUnit: "PIECE" as "PIECE" | "KG" | "GRAM" | "LITRE" | "ML" | "PACK",
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
    modifiers: [] as Modifier[],
  });

  // API functions
  const loadProducts = useCallback(async () => {
    if (!user?.businessId) {
      console.warn("Cannot load products: user or businessId is missing");
      setProducts([]);
      return;
    }
    try {
      setLoading(true);
      const response = await window.productAPI.getByBusiness(user.businessId);
      if (response.success && response.products) {
        // Ensure products is always an array
        setProducts(Array.isArray(response.products) ? response.products : []);
      } else {
        console.warn("Failed to load products");
        setProducts([]); // Set to empty array on error
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadCategories = useCallback(async () => {
    if (!user?.businessId) {
      console.warn("Cannot load categories: user or businessId is missing");
      setCategories([]);
      return;
    }
    try {
      const response = await window.categoryAPI.getByBusiness(user.businessId);
      if (response.success && response.categories) {
        // Ensure categories is always an array
        setCategories(
          Array.isArray(response.categories) ? response.categories : []
        );
      } else {
        console.warn("Failed to load categories");
        setCategories([]); // Set to empty array on error
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]); // Set to empty array on error
    }
  }, [user]);

  const loadVatCategories = useCallback(async () => {
    if (!user?.businessId) {
      setVatCategories([]);
      return;
    }
    try {
      const response = await window.categoryAPI.getVatCategories(
        user.businessId
      );
      if (response.success && response.vatCategories) {
        setVatCategories(response.vatCategories);
      } else {
        console.error("Failed to load VAT categories:", response.message);
        setVatCategories([]);
      }
    } catch (error) {
      console.error("Error loading VAT categories:", error);
      setVatCategories([]);
    }
  }, [user]);

  // Load data on component mount
  useEffect(() => {
    if (user?.businessId) {
      loadProducts();
      loadCategories();
      loadVatCategories();
    }
  }, [user, loadProducts, loadCategories, loadVatCategories]);

  // Close drawer when view changes and reload categories
  useEffect(() => {
    setIsDrawerOpen(false);

    // Reload categories when returning from category management
    // This ensures newly created categories appear in the dropdown
    if (currentView === "productManagement" && user?.businessId) {
      loadCategories();
    }
  }, [currentView, user?.businessId, loadCategories]);

  const productsPerPage = 10;

  // Get low stock products
  const lowStockProducts = Array.isArray(products)
    ? products.filter((p) => p.stockLevel <= p.minStockLevel && p.isActive)
    : [];

  // Filter products
  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => {
        const matchesSearch =
          (product.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (product.description || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (product.sku || "").toLowerCase().includes(searchTerm.toLowerCase());
        const productCategoryId =
          ((product as unknown as Record<string, unknown>).categoryId as
            | string
            | undefined) || product.category;
        const matchesCategory =
          filterCategory === "all" || productCategoryId === filterCategory;
        const matchesStock =
          filterStock === "all" ||
          (filterStock === "low" &&
            product.stockLevel <= product.minStockLevel) ||
          (filterStock === "in_stock" &&
            product.stockLevel > product.minStockLevel) ||
          (filterStock === "out_of_stock" && product.stockLevel === 0);
        return matchesSearch && matchesCategory && matchesStock;
      })
    : [];

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const resetForm = useCallback(() => {
    setNewProduct({
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
    setEditingProduct(null);
    setFormErrors({}); // Clear form errors
    setActiveTab("basic"); // Reset to basic tab
  }, [categories]);

  const openAddProductDrawer = useCallback(() => {
    resetForm();
    setIsDrawerOpen(true);
  }, [resetForm]);

  const handleAddProduct = async () => {
    // Clear previous errors
    setFormErrors({});

    if (!user?.businessId) {
      toast.error("Business ID not found");
      return;
    }

    // Basic validation (skip old schema validation for now)
    // TODO: Update product-schema.ts to match new schema
    const validationErrors: Record<string, string> = {};

    if (!newProduct.name.trim()) {
      validationErrors.name = "Product name is required";
    }
    if (!newProduct.sku.trim()) {
      validationErrors.sku = "SKU is required";
    }
    if (!newProduct.categoryId) {
      validationErrors.categoryId = "Category is required";
    }
    if (newProduct.basePrice <= 0) {
      validationErrors.basePrice = "Sale price must be greater than 0";
    }
    if (newProduct.usesScale && newProduct.pricePerKg <= 0) {
      validationErrors.pricePerKg =
        "Price per kg must be greater than 0 for weighted products";
    }

    const validationResult =
      Object.keys(validationErrors).length > 0
        ? { success: false, errors: validationErrors }
        : { success: true };

    // Show all errors if any exist
    if (!validationResult.success && validationResult.errors) {
      setFormErrors(validationResult.errors);

      // Log validation errors for debugging
      console.log("Product validation failed:", validationResult.errors);

      // Determine which tab has the first error and switch to it
      const errorFields = Object.keys(validationResult.errors);
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

      // Check which tab contains the first error
      if (errorFields.some((field) => basicInfoFields.includes(field))) {
        setActiveTab("basic");
        // Focus on the first error field after a short delay
        setTimeout(() => {
          const firstErrorField = errorFields.find((field) =>
            basicInfoFields.includes(field)
          );
          if (firstErrorField) {
            const element = document.getElementById(firstErrorField);
            if (element) {
              // For Select components (like category), trigger click to open dropdown
              if (firstErrorField === "category") {
                element.click();
              } else {
                element.focus();
              }
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
              console.warn(`Element with id '${firstErrorField}' not found`);
            }
          }
        }, 100);
      } else if (errorFields.some((field) => pricingFields.includes(field))) {
        setActiveTab("pricing");
        // Focus on the first error field after a short delay
        setTimeout(() => {
          const firstErrorField = errorFields.find((field) =>
            pricingFields.includes(field)
          );
          if (firstErrorField) {
            const element = document.getElementById(firstErrorField);
            if (element) {
              element.focus();
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
              console.warn(`Element with id '${firstErrorField}' not found`);
            }
          }
        }, 100);
      }

      toast.error("Please fix the errors in the form");
      return;
    }

    // Modifiers are handled separately if needed
    // const validModifiers = newProduct.modifiers...

    try {
      setLoading(true);

      // Map form data to schema fields
      const productData = {
        name: newProduct.name.trim(),
        description: (newProduct.description || "").trim() || undefined,
        basePrice: newProduct.basePrice,
        costPrice: newProduct.costPrice || 0,
        sku: newProduct.sku.trim(),
        barcode: (newProduct.barcode || "").trim() || undefined,
        plu: (newProduct.plu || "").trim() || undefined,
        image: (newProduct.image || "").trim() || undefined,
        categoryId: newProduct.categoryId,
        productType: newProduct.productType || "STANDARD",
        salesUnit: newProduct.salesUnit || "PIECE",
        usesScale: newProduct.usesScale || false,
        pricePerKg:
          newProduct.usesScale && newProduct.pricePerKg > 0
            ? newProduct.pricePerKg
            : undefined,
        isGenericButton: newProduct.isGenericButton || false,
        genericDefaultPrice:
          newProduct.isGenericButton && newProduct.genericDefaultPrice > 0
            ? newProduct.genericDefaultPrice
            : undefined,
        trackInventory:
          newProduct.trackInventory !== undefined
            ? newProduct.trackInventory
            : true,
        stockLevel: newProduct.stockLevel || 0,
        minStockLevel: newProduct.minStockLevel || 0,
        reorderPoint: newProduct.reorderPoint || 0,
        vatCategoryId: newProduct.vatCategoryId || undefined,
        vatOverridePercent: newProduct.vatOverridePercent
          ? parseFloat(newProduct.vatOverridePercent)
          : undefined,
        businessId: user!.businessId,
        isActive:
          newProduct.isActive !== undefined ? newProduct.isActive : true,
        allowPriceOverride: newProduct.allowPriceOverride || false,
        allowDiscount:
          newProduct.allowDiscount !== undefined
            ? newProduct.allowDiscount
            : true,
      };

      if (editingProduct) {
        // Update existing product
        const response = await window.productAPI.update(
          editingProduct.id,
          productData
        );
        if (response.success && response.product) {
          setProducts(
            products.map((p) =>
              p.id === editingProduct.id ? response.product! : p
            )
          );
          toast.success("Product updated successfully");

          // If there are modifiers, handle them separately if needed
          if (newProduct.modifiers && newProduct.modifiers.length > 0) {
            if (
              !response.product.modifiers ||
              response.product.modifiers.length === 0
            ) {
              toast.error(
                "Product updated but modifiers were not saved. Please check the backend API."
              );
            }
          }
          resetForm();
          setIsDrawerOpen(false);
        } else {
          console.error("Product update failed:", response);
          // Check if it's a duplicate error
          const errorMsg = response.message || "Failed to update product";
          console.log("Update error message:", errorMsg);
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
            setTimeout(() => {
              const skuField = document.getElementById("sku");
              if (skuField) {
                skuField.focus();
                skuField.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }, 100);
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
            setTimeout(() => {
              const pluField = document.getElementById("plu");
              if (pluField) {
                pluField.focus();
                pluField.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }, 100);
            toast.error("PLU code already exists");
          } else {
            toast.error(errorMsg);
          }
        }
      } else {
        // Create new product
        const response = await window.productAPI.create(productData);
        if (response.success && response.product) {
          setProducts([...products, response.product]);
          toast.success("Product created successfully");

          // If there are modifiers, handle them separately if needed
          if (newProduct.modifiers && newProduct.modifiers.length > 0) {
            if (
              !response.product.modifiers ||
              response.product.modifiers.length === 0
            ) {
              toast.error(
                "Product saved but modifiers were not saved. Please check the backend API."
              );
            }
          }
          resetForm();
          setIsDrawerOpen(false);
        } else {
          // Check if it's a duplicate error
          console.log("Create product failed. Full response:", response);
          const errorMsg = response.message || "Failed to create product";
          console.log("Error message:", errorMsg);
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
            setTimeout(() => {
              const skuField = document.getElementById("sku");
              if (skuField) {
                skuField.focus();
                skuField.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }, 100);
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
            setTimeout(() => {
              const pluField = document.getElementById("plu");
              if (pluField) {
                pluField.focus();
                pluField.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }, 100);
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);

    // Check if product's category still exists in the categories list
    const productCategoryId =
      ((product as unknown as Record<string, unknown>).categoryId as
        | string
        | undefined) || product.category;
    const categoryExists = categories.some(
      (cat) => cat.id === productCategoryId
    );
    const validCategory = categoryExists
      ? productCategoryId
      : categories.length > 0
      ? categories[0].id
      : "";

    // Show warning if category was changed
    if (!categoryExists && productCategoryId) {
      toast.error(
        "This product's category no longer exists. Please select a new category."
      );
    }

    // Normalize modifiers to ensure they have all required properties
    const normalizedModifiers = (product.modifiers || []).map((modifier) => ({
      ...modifier,
      // Ensure multiSelect property exists (derived from type if missing)
      multiSelect:
        "multiSelect" in modifier
          ? Boolean((modifier as { multiSelect?: boolean }).multiSelect)
          : modifier.type === "multiple",
      // Ensure required property exists
      required: modifier.required ?? false,
    }));

    // Map database product to form fields (handle both old and new field names)
    const dbProduct = product as unknown as Record<string, unknown>; // Type assertion to access all possible fields
    setNewProduct({
      name: product.name,
      description: product.description || "",
      basePrice:
        (dbProduct.basePrice as number | undefined) ?? product.price ?? 0,
      costPrice: product.costPrice || 0,
      sku: product.sku,
      barcode: (dbProduct.barcode as string | undefined) || "",
      plu: product.plu || "",
      image: product.image || "",
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
        Boolean(product.requiresWeight),
      pricePerKg:
        (dbProduct.pricePerKg as number | undefined) ??
        product.pricePerUnit ??
        0,
      isGenericButton:
        (dbProduct.isGenericButton as boolean | undefined) || false,
      genericDefaultPrice:
        (dbProduct.genericDefaultPrice as number | undefined) || 0,
      trackInventory:
        (dbProduct.trackInventory as boolean | undefined) !== undefined
          ? (dbProduct.trackInventory as boolean)
          : true,
      stockLevel: product.stockLevel || 0,
      minStockLevel: product.minStockLevel || 0,
      reorderPoint: (dbProduct.reorderPoint as number | undefined) || 0,
      vatCategoryId: (dbProduct.vatCategoryId as string | undefined) || "",
      vatOverridePercent: dbProduct.vatOverridePercent
        ? (dbProduct.vatOverridePercent as number).toString()
        : "",
      isActive: product.isActive !== undefined ? product.isActive : true,
      allowPriceOverride:
        (dbProduct.allowPriceOverride as boolean | undefined) || false,
      allowDiscount:
        (dbProduct.allowDiscount as boolean | undefined) !== undefined
          ? (dbProduct.allowDiscount as boolean)
          : true,
      modifiers: normalizedModifiers,
    });

    // If category was invalid, show the error
    if (!validCategory) {
      setFormErrors({ category: "Please select a category" });
    }

    setIsDrawerOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (
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
      setLoading(true);
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
        // Reload products to get updated stock levels
        await loadProducts();
        toast.success("Stock adjustment completed successfully");
        setStockAdjustmentProduct(null);
      } else {
        toast.error(response.message || "Failed to adjust stock");
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error("Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setNewProduct((prev) => ({
            ...prev,
            image: e.target?.result as string,
          }));
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  // Modifier functions - removed as they're not currently used in the UI
  // They can be re-added when modifier management UI is implemented

  const handleInputChange = useCallback(
    (field: string, value: string | number) => {
      setNewProduct((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field when user starts typing
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

  // Helper to clear specific field error
  const clearFieldError = useCallback((field: string) => {
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Stock adjustment input handlers - memoized to prevent re-renders
  const handleStockQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStockAdjustmentQuantity(e.target.value);
    },
    []
  );

  const handleStockReasonChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStockAdjustmentReason(e.target.value);
    },
    []
  );

  const ProductDashboardView = React.memo(() => (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Product & Menu Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your inventory and menu items
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={onBack}> Go to dashboard</Button>

          <Button variant="outline" size="sm">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.length}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {products.filter((p) => p.isActive).length} active
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Menu categories</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MenuSquare className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {lowStockProducts.length}
              </p>
              <p className="text-sm text-orange-600 mt-1">Need restocking</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Price</p>
              <p className="text-2xl font-bold text-gray-900">
                £
                {products.length > 0
                  ? (
                      products.reduce((sum, p) => sum + (p.price || 0), 0) /
                      products.length
                    ).toFixed(2)
                  : "0.00"}
              </p>
              <p className="text-sm text-gray-500 mt-1">Across all items</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setCurrentView("productManagement");
              }}
            >
              <Package className="w-4 h-4 mr-3" />
              Manage Products
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setCurrentView("categoryManagement");
              }}
            >
              <Tag className="w-4 h-4 mr-3" />
              Manage Categories
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={openAddProductDrawer}
            >
              <Plus className="w-4 h-4 mr-3" />
              Add New Product
            </Button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Low Stock Alerts
          </h3>
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">
              All products are well stocked!
            </p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 bg-orange-50 rounded"
                >
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-gray-600">
                      {product.stockLevel} left (min: {product.minStockLevel})
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStockAdjustmentProduct(product)}
                  >
                    Restock
                  </Button>
                </div>
              ))}
              {lowStockProducts.length > 3 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  +{lowStockProducts.length - 3} more items need attention
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  ));

  const ProductsDetailsView = React.memo(() => (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentView("productDashboard");
            }}
          >
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

        <Button onClick={openAddProductDrawer}>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
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

            <Select value={filterStock} onValueChange={setFilterStock}>
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
                onClick={() => setShowFields({ ...showFields, [field]: !show })}
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
            <Button onClick={openAddProductDrawer}>
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
                    currentProducts.map((product) => (
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
                              {categories.find(
                                (cat) =>
                                  cat.id ===
                                  (((
                                    product as unknown as Record<
                                      string,
                                      unknown
                                    >
                                  ).categoryId as string | undefined) ||
                                    product.category)
                              )?.name || "Unknown"}
                            </span>
                          </td>
                        )}
                        {showFields.price && (
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="text-gray-900 font-medium">
                                  £
                                  {((
                                    product as unknown as Record<
                                      string,
                                      unknown
                                    >
                                  ).usesScale as boolean | undefined)
                                    ? (
                                        ((
                                          product as unknown as Record<
                                            string,
                                            unknown
                                          >
                                        ).pricePerKg as number | undefined) ||
                                        ((
                                          product as unknown as Record<
                                            string,
                                            unknown
                                          >
                                        ).basePrice as number | undefined) ||
                                        product.price ||
                                        0
                                      ).toFixed(2)
                                    : (
                                        ((
                                          product as unknown as Record<
                                            string,
                                            unknown
                                          >
                                        ).basePrice as number | undefined) ||
                                        product.price ||
                                        0
                                      ).toFixed(2)}
                                  {((
                                    product as unknown as Record<
                                      string,
                                      unknown
                                    >
                                  ).usesScale as boolean | undefined) && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      /
                                      {((
                                        product as unknown as Record<
                                          string,
                                          unknown
                                        >
                                      ).salesUnit as string | undefined) ||
                                        "KG"}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Cost: £{(product.costPrice || 0).toFixed(2)}
                                </div>
                              </div>
                              {((product as unknown as Record<string, unknown>)
                                .usesScale as boolean | undefined) && (
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
                                onClick={() =>
                                  setStockAdjustmentProduct(product)
                                }
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
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
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
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                            onClick={() => setCurrentPage(pageNum)}
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
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
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

      {/* Stock Adjustment Modal */}
      {stockAdjustmentProduct && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Close modal when clicking outside
            if (e.target === e.currentTarget) {
              setStockAdjustmentProduct(null);
            }
          }}
        >
          <div
            className="bg-white rounded-lg p-6 w-96 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">
              Adjust Stock: {stockAdjustmentProduct.name}
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  Current Stock:{" "}
                  <span className="font-medium text-gray-900">
                    {stockAdjustmentProduct.stockLevel}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Minimum Level:{" "}
                  <span className="font-medium text-gray-900">
                    {stockAdjustmentProduct.minStockLevel}
                  </span>
                </p>
              </div>

              {/* Adjustment Type Tabs */}
              <div className="flex space-x-2">
                <Button
                  type="button"
                  className="flex-1"
                  variant={
                    stockAdjustmentType === "add" ? "default" : "outline"
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setStockAdjustmentType("add");
                  }}
                >
                  Add Stock
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  variant={
                    stockAdjustmentType === "remove" ? "default" : "outline"
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setStockAdjustmentType("remove");
                  }}
                >
                  Remove Stock
                </Button>
              </div>

              {/* Quantity Input */}
              <div>
                <Label htmlFor="stock-quantity">
                  Quantity to {stockAdjustmentType === "add" ? "Add" : "Remove"}
                </Label>
                <Input
                  id="stock-quantity"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={stockAdjustmentQuantity}
                  onChange={handleStockQuantityChange}
                  className="mt-1"
                />
              </div>

              {/* Reason Input */}
              <div>
                <Label htmlFor="stock-reason">Reason</Label>
                <Input
                  id="stock-reason"
                  type="text"
                  placeholder="Stock received"
                  value={stockAdjustmentReason}
                  onChange={handleStockReasonChange}
                  className="mt-1"
                  autoComplete="off"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    const quantity = parseInt(stockAdjustmentQuantity);
                    // Use default "Stock received" if reason is empty
                    const reason =
                      stockAdjustmentReason.trim() || "Stock received";
                    if (quantity > 0 && reason) {
                      handleStockAdjustment(
                        stockAdjustmentProduct.id,
                        stockAdjustmentType,
                        quantity,
                        reason
                      );
                      // Reset form
                      setStockAdjustmentProduct(null);
                      setStockAdjustmentQuantity("");
                      setStockAdjustmentReason("");
                      setStockAdjustmentType("add");
                    } else {
                      toast.error("Please enter a valid quantity and reason");
                    }
                  }}
                >
                  Confirm Adjustment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStockAdjustmentProduct(null);
                    setStockAdjustmentQuantity("");
                    setStockAdjustmentReason("");
                    setStockAdjustmentType("add");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  ));

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
            <ProductDashboardView />
          ) : currentView === "categoryManagement" ? (
            <ManageCategoriesView
              onBack={() => setCurrentView("productDashboard")}
            />
          ) : (
            <ProductsDetailsView />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Single Drawer for both views */}
      <Drawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            resetForm();
          }
        }}
        direction="right"
      >
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
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-6">
                {/* Image Upload */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {newProduct.image ? (
                      <img
                        src={newProduct.image}
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
                      value={newProduct.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter product name"
                      className={formErrors.name ? "border-red-500" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoryId">Category *</Label>
                    <Select
                      value={newProduct.categoryId}
                      onValueChange={(value) => {
                        setNewProduct({ ...newProduct, categoryId: value });
                        clearFieldError("categoryId");
                      }}
                    >
                      <SelectTrigger
                        id="categoryId"
                        className={
                          formErrors.categoryId ? "border-red-500" : ""
                        }
                      >
                        <SelectValue
                          placeholder={
                            categories.length === 0
                              ? "No categories available"
                              : "Select a category"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <SelectItem value="" disabled>
                            No categories found - please add a category first
                          </SelectItem>
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
                      value={newProduct.sku}
                      onChange={(e) => {
                        setNewProduct({ ...newProduct, sku: e.target.value });
                        clearFieldError("sku");
                      }}
                      placeholder="Enter SKU"
                      className={formErrors.sku ? "border-red-500" : ""}
                    />
                    {formErrors.sku && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.sku}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="plu">PLU Code (Optional)</Label>
                    <Input
                      id="plu"
                      value={newProduct.plu}
                      onChange={(e) => {
                        setNewProduct({ ...newProduct, plu: e.target.value });
                        clearFieldError("plu");
                      }}
                      placeholder="Enter PLU code"
                      className={formErrors.plu ? "border-red-500" : ""}
                    />
                    {formErrors.plu && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.plu}
                      </p>
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
                      value={newProduct.basePrice}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          basePrice: parseFloat(e.target.value) || 0,
                        })
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
                      value={newProduct.costPrice}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          costPrice: parseFloat(e.target.value) || 0,
                        })
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
                      value={newProduct.barcode}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          barcode: e.target.value,
                        })
                      }
                      placeholder="Enter barcode"
                    />
                  </div>

                  <div>
                    <Label>Profit Margin</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                      {(newProduct.basePrice || 0) > 0 &&
                      (newProduct.costPrice || 0) > 0
                        ? `${(
                            (((newProduct.basePrice || 0) -
                              (newProduct.costPrice || 0)) /
                              (newProduct.basePrice || 1)) *
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
                      value={newProduct.productType}
                      onValueChange={(
                        value: "STANDARD" | "WEIGHTED" | "GENERIC"
                      ) =>
                        setNewProduct({
                          ...newProduct,
                          productType: value,
                          usesScale: value === "WEIGHTED",
                        })
                      }
                    >
                      <SelectTrigger id="productType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STANDARD">
                          Standard Product
                        </SelectItem>
                        <SelectItem value="WEIGHTED">
                          Weighted Product
                        </SelectItem>
                        <SelectItem value="GENERIC">Generic Button</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="usesScale"
                      checked={Boolean(newProduct.usesScale)}
                      onCheckedChange={(checked) =>
                        setNewProduct({
                          ...newProduct,
                          usesScale: Boolean(checked),
                          productType: checked ? "WEIGHTED" : "STANDARD",
                          // Reset pricing when switching modes
                          pricePerKg: checked ? newProduct.basePrice : 0,
                        })
                      }
                    />
                    <Label htmlFor="usesScale">
                      Sold by Weight (Uses Scale)
                    </Label>
                  </div>

                  {newProduct.usesScale && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                      <div>
                        <Label htmlFor="salesUnit">Sales Unit</Label>
                        <Select
                          value={newProduct.salesUnit}
                          onValueChange={(
                            value:
                              | "PIECE"
                              | "KG"
                              | "GRAM"
                              | "LITRE"
                              | "ML"
                              | "PACK"
                          ) =>
                            setNewProduct({
                              ...newProduct,
                              salesUnit: value,
                            })
                          }
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
                            <SelectItem value="LITRE">
                              Litres (LITRE)
                            </SelectItem>
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
                          Price per {newProduct.salesUnit}
                        </Label>
                        <Input
                          id="pricePerKg"
                          type="number"
                          step="0.01"
                          value={newProduct.pricePerKg}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              pricePerKg: parseFloat(e.target.value) || 0,
                              // Update base price for display purposes
                              basePrice: parseFloat(e.target.value) || 0,
                            })
                          }
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

                  {newProduct.productType === "GENERIC" && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div>
                        <Label htmlFor="genericDefaultPrice">
                          Default Price
                        </Label>
                        <Input
                          id="genericDefaultPrice"
                          type="number"
                          step="0.01"
                          value={newProduct.genericDefaultPrice}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              genericDefaultPrice:
                                parseFloat(e.target.value) || 0,
                            })
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
                      value={newProduct.stockLevel}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          stockLevel: parseInt(e.target.value) || 0,
                        })
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
                      value={newProduct.minStockLevel}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          minStockLevel: parseInt(e.target.value) || 0,
                        })
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
                      value={newProduct.reorderPoint}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          reorderPoint: parseFloat(e.target.value) || 0,
                        })
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
                  <h4 className="text-lg font-medium mb-4">
                    VAT Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vatCategoryId">VAT Category</Label>
                      <select
                        id="vatCategoryId"
                        className="w-full border rounded px-3 py-2 mt-1"
                        value={newProduct.vatCategoryId}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            vatCategoryId: e.target.value,
                          })
                        }
                      >
                        <option value="">None (Use Category Default)</option>
                        {vatCategories.map((vat) => (
                          <option key={vat.id} value={vat.id}>
                            {vat.name} ({vat.ratePercent}%)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="vatOverridePercent">
                        VAT Override (%)
                      </Label>
                      <Input
                        id="vatOverridePercent"
                        type="number"
                        step="0.01"
                        value={newProduct.vatOverridePercent}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            vatOverridePercent: e.target.value,
                          })
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
                        checked={newProduct.trackInventory}
                        onCheckedChange={(checked) =>
                          setNewProduct({
                            ...newProduct,
                            trackInventory: checked,
                          })
                        }
                      />
                      <Label htmlFor="trackInventory">Track Inventory</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowPriceOverride"
                        checked={newProduct.allowPriceOverride}
                        onCheckedChange={(checked) =>
                          setNewProduct({
                            ...newProduct,
                            allowPriceOverride: checked,
                          })
                        }
                      />
                      <Label htmlFor="allowPriceOverride">
                        Allow Price Override
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowDiscount"
                        checked={newProduct.allowDiscount}
                        onCheckedChange={(checked) =>
                          setNewProduct({
                            ...newProduct,
                            allowDiscount: checked,
                          })
                        }
                      />
                      <Label htmlFor="allowDiscount">Allow Discount</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={newProduct.isActive}
                        onCheckedChange={(checked) =>
                          setNewProduct({
                            ...newProduct,
                            isActive: checked,
                          })
                        }
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex space-x-2 pt-6 border-t mt-6">
              <Button onClick={handleAddProduct} className="flex-1">
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ProductManagementView;
