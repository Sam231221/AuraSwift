import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Plus,
  Search,
  Filter,
  Edit,
  Package,
  X,
  Settings,
  AlertTriangle,
  MenuSquare,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Upload,
  Minus,
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
import type { Product, Modifier } from "@/types/product.types";
import ManageCategoriesView from "./manage-categories-view";

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

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    costPrice: 0,
    taxRate: 10,
    sku: "",
    plu: "",
    image: "",
    category: "",
    stockLevel: 0,
    minStockLevel: 5,
    modifiers: [] as Modifier[],
    // Weight-based product fields
    requiresWeight: false,
    unit: "each" as "lb" | "kg" | "oz" | "g" | "each",
    pricePerUnit: 0,
  });

  // API functions
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await window.productAPI.getByBusiness(user!.businessId);
      if (response.success && response.products) {
        console.log("Loaded products:", response.products);
        console.log(
          "First product modifiers:",
          response.products[0]?.modifiers
        );
        setProducts(response.products);
      } else {
        toast.error("Failed to load products");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await window.categoryAPI.getByBusiness(user!.businessId);
      if (response.success && response.categories) {
        setCategories(response.categories);
      } else {
        toast.error("Failed to load categories");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
    }
  }, [user]);

  // Load data on component mount
  useEffect(() => {
    if (user?.businessId) {
      loadProducts();
      loadCategories();
    }
  }, [user, loadProducts, loadCategories]);

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
  const lowStockProducts = products.filter(
    (p) => p.stockLevel <= p.minStockLevel && p.isActive
  );

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;
    const matchesStock =
      filterStock === "all" ||
      (filterStock === "low" && product.stockLevel <= product.minStockLevel) ||
      (filterStock === "in_stock" &&
        product.stockLevel > product.minStockLevel) ||
      (filterStock === "out_of_stock" && product.stockLevel === 0);
    return matchesSearch && matchesCategory && matchesStock;
  });

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
      price: 0,
      costPrice: 0,
      taxRate: 10,
      sku: "",
      plu: "",
      image: "",
      category: categories.length > 0 ? categories[0].id : "",
      stockLevel: 0,
      minStockLevel: 5,
      modifiers: [],
      requiresWeight: false,
      unit: "each" as "lb" | "kg" | "oz" | "g" | "each",
      pricePerUnit: 0,
    });
    setEditingProduct(null);
  }, [categories]);

  const openAddProductDrawer = useCallback(() => {
    // Ensure we have categories loaded before opening
    if (categories.length === 0) {
      toast.error("Please wait for categories to load or add a category first");
      return;
    }
    resetForm();
    setIsDrawerOpen(true);
  }, [categories, resetForm]);

  const handleAddProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.sku ||
      !newProduct.category ||
      !user?.businessId
    ) {
      toast.error(
        "Please fill in all required fields (name, SKU, and category)"
      );
      return;
    }

    // Additional validation for category
    if (!categories.find((cat) => cat.id === newProduct.category)) {
      toast.error("Please select a valid category");
      return;
    }

    // Validate modifiers - remove empty ones and validate required fields
    const validModifiers = newProduct.modifiers
      .filter((modifier) => {
        if (!modifier.name.trim()) return false;
        // Ensure modifier has at least one valid option
        const validOptions = modifier.options.filter((option) =>
          option.name.trim()
        );
        return validOptions.length > 0;
      })
      .map((modifier) => ({
        ...modifier,
        options: modifier.options.filter((option) => option.name.trim()),
        businessId: user.businessId,
        updatedAt: new Date().toISOString(),
      }));

    try {
      setLoading(true);

      const productData = {
        ...newProduct,
        businessId: user.businessId,
        // Include only valid modifiers
        modifiers: validModifiers,
      };

      console.log("Saving product data:", productData);
      console.log("Product category:", productData.category);
      console.log("Available categories:", categories);
      console.log("Product modifiers count:", productData.modifiers.length);
      console.log(
        "Product modifiers detail:",
        JSON.stringify(productData.modifiers, null, 2)
      );
      console.log("requiresWeight value:", productData.requiresWeight);
      console.log("requiresWeight type:", typeof productData.requiresWeight);

      if (editingProduct) {
        // Update existing product
        const response = await window.productAPI.update(
          editingProduct.id,
          productData
        );
        if (response.success && response.product) {
          console.log("Updated product response:", response.product);
          console.log("Updated product modifiers:", response.product.modifiers);
          setProducts(
            products.map((p) =>
              p.id === editingProduct.id ? response.product! : p
            )
          );
          toast.success("Product updated successfully");

          // If there are modifiers, handle them separately if needed
          if (newProduct.modifiers && newProduct.modifiers.length > 0) {
            console.log("Original modifiers sent:", newProduct.modifiers);
            console.log(
              "Modifiers in updated product:",
              response.product.modifiers
            );
            if (
              !response.product.modifiers ||
              response.product.modifiers.length === 0
            ) {
              console.warn(
                "WARNING: Modifiers were not saved to the database!"
              );
              console.log(
                "This indicates the backend API needs to be updated to handle modifiers properly"
              );
              console.log("Expected modifiers:", validModifiers);
              console.log("Received modifiers:", response.product.modifiers);
              toast.error(
                "Product updated but modifiers were not saved. Please check the backend API."
              );
            }
          }
        } else {
          console.error("Product update failed:", response);
          toast.error(response.message || "Failed to update product");
        }
      } else {
        // Create new product
        const response = await window.productAPI.create(productData);
        if (response.success && response.product) {
          console.log("Created product response:", response.product);
          console.log("Created product modifiers:", response.product.modifiers);
          setProducts([...products, response.product]);
          toast.success("Product created successfully");

          // If there are modifiers, handle them separately if needed
          if (newProduct.modifiers && newProduct.modifiers.length > 0) {
            console.log("Original modifiers sent:", newProduct.modifiers);
            console.log(
              "Modifiers in created product:",
              response.product.modifiers
            );
            if (
              !response.product.modifiers ||
              response.product.modifiers.length === 0
            ) {
              console.warn(
                "WARNING: Modifiers were not saved to the database!"
              );
              console.log(
                "This indicates the backend API needs to be updated to handle modifiers properly"
              );
              console.log("Expected modifiers:", validModifiers);
              console.log("Received modifiers:", response.product.modifiers);
              toast.error(
                "Product saved but modifiers were not saved. Please check the backend API."
              );
            }
          }
        } else {
          console.error("Product creation failed:", response);
          toast.error(response.message || "Failed to create product");
        }
      }

      resetForm();
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    console.log("Editing product:", product);
    console.log("Product modifiers:", product.modifiers);
    console.log("Product requiresWeight value:", product.requiresWeight);
    console.log("Product requiresWeight type:", typeof product.requiresWeight);

    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      taxRate: product.taxRate,
      sku: product.sku,
      plu: product.plu || "",
      image: product.image || "",
      category: product.category,
      stockLevel: product.stockLevel,
      minStockLevel: product.minStockLevel,
      modifiers: product.modifiers || [], // Ensure it's always an array
      requiresWeight: Boolean(product.requiresWeight), // Ensure it's a proper boolean
      unit: product.unit || "each",
      pricePerUnit: product.pricePerUnit || 0,
    });
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

  const addModifier = () => {
    const now = new Date().toISOString();
    const newModifier: Modifier = {
      id: `modifier_${Date.now()}`,
      name: "",
      type: "single",
      required: false,
      businessId: user?.businessId || "",
      createdAt: now,
      updatedAt: now,
      options: [
        {
          id: `option_${Date.now()}`,
          name: "",
          price: 0,
          createdAt: now,
        },
      ],
    };
    console.log("Adding new modifier:", newModifier);
    setNewProduct({
      ...newProduct,
      modifiers: [...newProduct.modifiers, newModifier],
    });
  };

  const updateModifier = (index: number, modifier: Modifier) => {
    const updatedModifiers = [...newProduct.modifiers];
    updatedModifiers[index] = {
      ...modifier,
      updatedAt: new Date().toISOString(),
      businessId: user?.businessId || modifier.businessId,
    };
    console.log(
      `Updating modifier at index ${index}:`,
      updatedModifiers[index]
    );
    setNewProduct({ ...newProduct, modifiers: updatedModifiers });
  };

  const removeModifier = useCallback((index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      modifiers: prev.modifiers.filter((_, i) => i !== index),
    }));
  }, []);

  const handleInputChange = useCallback(
    (field: string, value: string | number) => {
      console.log("handleInputChange called:", field, value);
      setNewProduct((prev) => ({ ...prev, [field]: value }));
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
                      products.reduce((sum, p) => sum + p.price, 0) /
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
      <div className="bg-white p-4 rounded-lg shadow-sm border">
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
                                (cat) => cat.id === product.category
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
                                  {product.requiresWeight
                                    ? product.pricePerUnit?.toFixed(2) ||
                                      product.price.toFixed(2)
                                    : product.price.toFixed(2)}
                                  {product.requiresWeight && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      /{product.unit}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Cost: £{product.costPrice.toFixed(2)}
                                </div>
                              </div>
                              {product.requiresWeight && (
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Adjust Stock: {stockAdjustmentProduct.name}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  Current Stock:{" "}
                  <span className="font-medium">
                    {stockAdjustmentProduct.stockLevel}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Minimum Level:{" "}
                  <span className="font-medium">
                    {stockAdjustmentProduct.minStockLevel}
                  </span>
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const quantity = parseInt(
                      prompt("Enter quantity to add:") || "0"
                    );
                    const reason =
                      prompt("Reason for adjustment:") || "Stock received";
                    if (quantity > 0) {
                      handleStockAdjustment(
                        stockAdjustmentProduct.id,
                        "add",
                        quantity,
                        reason
                      );
                    }
                  }}
                >
                  Add Stock
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const quantity = parseInt(
                      prompt("Enter quantity to remove:") || "0"
                    );
                    const reason =
                      prompt("Reason for adjustment:") || "Stock adjustment";
                    if (quantity > 0) {
                      handleStockAdjustment(
                        stockAdjustmentProduct.id,
                        "remove",
                        quantity,
                        reason
                      );
                    }
                  }}
                >
                  Remove Stock
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStockAdjustmentProduct(null)}
              >
                Cancel
              </Button>
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
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
                <TabsTrigger value="modifiers">Modifiers</TabsTrigger>
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
                    />
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
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={newProduct.category}
                      onValueChange={(value) =>
                        setNewProduct({ ...newProduct, category: value })
                      }
                    >
                      <SelectTrigger>
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
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={newProduct.sku}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, sku: e.target.value })
                      }
                      placeholder="Enter SKU"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="plu">PLU Code (Optional)</Label>
                    <Input
                      id="plu"
                      value={newProduct.plu}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, plu: e.target.value })
                      }
                      placeholder="Enter PLU code"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Sale Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
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
                    />
                  </div>

                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={newProduct.taxRate}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          taxRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <Label>Profit Margin</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                      {newProduct.price > 0 && newProduct.costPrice > 0
                        ? `${(
                            ((newProduct.price - newProduct.costPrice) /
                              newProduct.price) *
                            100
                          ).toFixed(1)}%`
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Weight-based Product Configuration */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium mb-4">
                    Weight Configuration
                  </h4>

                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="requiresWeight"
                      checked={Boolean(newProduct.requiresWeight)}
                      onCheckedChange={(checked) =>
                        setNewProduct({
                          ...newProduct,
                          requiresWeight: Boolean(checked),
                          // Reset pricing when switching modes
                          pricePerUnit: checked ? newProduct.price : 0,
                        })
                      }
                    />
                    <Label htmlFor="requiresWeight">Sold by Weight</Label>
                  </div>

                  {newProduct.requiresWeight && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Select
                          value={newProduct.unit}
                          onValueChange={(
                            value: "lb" | "kg" | "oz" | "g" | "each"
                          ) =>
                            setNewProduct({
                              ...newProduct,
                              unit: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lb">Pounds (lb)</SelectItem>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="oz">Ounces (oz)</SelectItem>
                            <SelectItem value="g">Grams (g)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="pricePerUnit">
                          Price per {newProduct.unit}
                        </Label>
                        <Input
                          id="pricePerUnit"
                          type="number"
                          step="0.01"
                          value={newProduct.pricePerUnit}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              pricePerUnit: parseFloat(e.target.value) || 0,
                              // Update main price for display purposes
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This will be multiplied by the weight during checkout
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
                    />
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
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="modifiers" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Product Modifiers</h4>
                  <Button onClick={addModifier} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Modifier
                  </Button>
                </div>

                {/* Debug info */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>
                    Debug: {newProduct.modifiers?.length || 0} modifiers found
                    {editingProduct && <span> (editing mode)</span>}
                  </div>
                  {newProduct.modifiers && newProduct.modifiers.length > 0 && (
                    <div>
                      Modifiers:{" "}
                      {newProduct.modifiers
                        .map(
                          (m, i) =>
                            `${i + 1}. ${m.name || "Unnamed"} (${
                              m.options.length
                            } options)`
                        )
                        .join(", ")}
                    </div>
                  )}
                </div>

                {newProduct.modifiers && newProduct.modifiers.length > 0 ? (
                  newProduct.modifiers.map((modifier, index) => (
                    <div
                      key={modifier.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Modifier {index + 1}</h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeModifier(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Modifier Name</Label>
                          <Input
                            value={modifier.name}
                            onChange={(e) =>
                              updateModifier(index, {
                                ...modifier,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g. Cooking Level"
                          />
                        </div>

                        <div>
                          <Label>Type</Label>
                          <Select
                            value={modifier.type}
                            onValueChange={(value: "single" | "multiple") =>
                              updateModifier(index, {
                                ...modifier,
                                type: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">
                                Single Choice
                              </SelectItem>
                              <SelectItem value="multiple">
                                Multiple Choice
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Options</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const now = new Date().toISOString();
                              const newOption = {
                                id: `option_${Date.now()}_${Math.random()
                                  .toString(36)
                                  .substr(2, 9)}`,
                                name: "",
                                price: 0,
                                createdAt: now,
                              };
                              console.log(
                                "Adding new option to modifier:",
                                newOption
                              );
                              updateModifier(index, {
                                ...modifier,
                                options: [...modifier.options, newOption],
                              });
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Option
                          </Button>
                        </div>

                        {modifier.options.map((option, optionIndex) => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-2 mb-2"
                          >
                            <Input
                              placeholder="Option name"
                              value={option.name}
                              onChange={(e) => {
                                const updatedOptions = [...modifier.options];
                                updatedOptions[optionIndex] = {
                                  ...option,
                                  name: e.target.value,
                                };
                                updateModifier(index, {
                                  ...modifier,
                                  options: updatedOptions,
                                });
                              }}
                            />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Price"
                              value={option.price}
                              onChange={(e) => {
                                const updatedOptions = [...modifier.options];
                                updatedOptions[optionIndex] = {
                                  ...option,
                                  price: parseFloat(e.target.value) || 0,
                                };
                                updateModifier(index, {
                                  ...modifier,
                                  options: updatedOptions,
                                });
                              }}
                              className="w-24"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedOptions = modifier.options.filter(
                                  (_, i) => i !== optionIndex
                                );
                                updateModifier(index, {
                                  ...modifier,
                                  options: updatedOptions,
                                });
                              }}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    No modifiers added yet.
                  </div>
                )}
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
