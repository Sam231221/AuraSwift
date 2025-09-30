import React, { useState, useCallback, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  GripVertical,
  Tag,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/shared/hooks/use-auth";

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
  parentId?: string | null;
}

interface ManageCategoriesViewProps {
  onBack: () => void;
}

const ManageCategoriesView: React.FC<ManageCategoriesViewProps> = ({
  onBack,
}) => {
  const { user } = useAuth();

  // State management
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parentId: "",
  });

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await window.categoryAPI.getByBusiness(user!.businessId);
      if (response.success && response.categories) {
        // Sort by sortOrder
        const sortedCategories = response.categories.sort(
          (a: Category, b: Category) => a.sortOrder - b.sortOrder
        );
        setCategories(sortedCategories);
      } else {
        toast.error("Failed to load categories");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load categories on component mount
  useEffect(() => {
    if (user?.businessId) {
      loadCategories();
    }
  }, [user, loadCategories]);

  const resetForm = useCallback(() => {
    setNewCategory({
      name: "",
      description: "",
      parentId: "",
    });
    setEditingCategory(null);
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.name || !user?.businessId) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      setLoading(true);

      const categoryData = {
        name: newCategory.name,
        description: newCategory.description,
        businessId: user.businessId,
        sortOrder: categories.length + 1, // Add to end by default
        parentId: newCategory.parentId || null,
      };

      if (editingCategory) {
        // Update existing category
        const response = await window.categoryAPI.update(
          editingCategory.id,
          categoryData
        );
        if (response.success && response.category) {
          setCategories(
            categories.map((c) =>
              c.id === editingCategory.id ? response.category! : c
            )
          );
          toast.success("Category updated successfully");
        } else {
          toast.error(response.message || "Failed to update category");
        }
      } else {
        // Create new category
        const response = await window.categoryAPI.create(categoryData);
        if (response.success && response.category) {
          setCategories([...categories, response.category]);
          toast.success("Category created successfully");
        } else {
          toast.error(response.message || "Failed to create category");
        }
      }

      resetForm();
      setIsDrawerOpen(false);
      loadCategories(); // Reload to get updated order
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId ?? "",
    });
    setIsDrawerOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await window.categoryAPI.delete(id);
      if (response.success) {
        setCategories(categories.filter((c) => c.id !== id));
        toast.success("Category deleted successfully");
      } else {
        toast.error(response.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const handleReorderCategory = async (
    categoryId: string,
    direction: "up" | "down"
  ) => {
    const currentIndex = categories.findIndex((c) => c.id === categoryId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === categories.length - 1)
    ) {
      return; // Can't move beyond boundaries
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const reorderedCategories = [...categories];

    // Swap categories
    [reorderedCategories[currentIndex], reorderedCategories[newIndex]] = [
      reorderedCategories[newIndex],
      reorderedCategories[currentIndex],
    ];

    // Update local state immediately for better UX
    setCategories(reorderedCategories);

    try {
      // Send new order to backend
      const categoryIds = reorderedCategories.map((c) => c.id);
      const response = await window.categoryAPI.reorder(
        user!.businessId,
        categoryIds
      );

      if (!response.success) {
        // Revert on failure
        setCategories(categories);
        toast.error("Failed to reorder categories");
      } else {
        toast.success("Categories reordered successfully");
      }
    } catch (error) {
      console.error("Error reordering categories:", error);
      // Revert on error
      setCategories(categories);
      toast.error("Failed to reorder categories");
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Category Management
              </h1>
              <p className="text-gray-600 mt-1">
                Organize your products with categories
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              resetForm();
              setIsDrawerOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Alert for no categories */}
        {categories.length === 0 && !loading && (
          <Alert className="border-blue-200 bg-blue-50">
            <Tag className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              You don't have any categories yet. Create your first category to
              organize your products.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.length}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {categories.filter((c) => c.isActive).length} active
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Most Recent</p>
                <p className="text-lg font-bold text-gray-900">
                  {categories.length > 0
                    ? categories.sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )[0]?.name
                    : "None"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {categories.length > 0
                    ? new Date(
                        categories.sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )[0]?.createdAt
                      ).toLocaleDateString()
                    : ""}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quick Actions</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    resetForm();
                    setIsDrawerOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Category
                </Button>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
            <p className="text-sm text-gray-600 mt-1">
              Drag and drop to reorder categories
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  Loading categories...
                </span>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No categories found
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first category to organize your products.
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setIsDrawerOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="p-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorderCategory(category.id, "up")}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleReorderCategory(category.id, "down")
                        }
                        disabled={index === categories.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        ↓
                      </Button>
                    </div>

                    <div className="cursor-grab">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>

                    <div>
                      <div className="font-medium text-gray-900">
                        {category.name}
                      </div>
                      {category.description && (
                        <div className="text-sm text-gray-500">
                          {category.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Order: {category.sortOrder} • Created:{" "}
                        {new Date(category.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Category Drawer */}
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
        <DrawerContent className="h-full w-[500px] mt-0 rounded-none fixed right-0 top-0">
          <DrawerHeader className="border-b">
            <DrawerTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DrawerTitle>
            <DrawerDescription>
              {editingCategory
                ? "Update the category information below."
                : "Create a new category to organize your products."}
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <Label htmlFor="categoryDescription">
                  Description (Optional)
                </Label>
                <Textarea
                  id="categoryDescription"
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="parentCategory">Parent Category</Label>
                <select
                  id="parentCategory"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={newCategory.parentId}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, parentId: e.target.value })
                  }
                >
                  <option value="">None (Top-level)</option>
                  {categories
                    .filter(
                      (cat) => !editingCategory || cat.id !== editingCategory.id
                    )
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {editingCategory && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Category Information
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      Created:{" "}
                      {new Date(editingCategory.createdAt).toLocaleString()}
                    </div>
                    <div>
                      Last Updated:{" "}
                      {new Date(editingCategory.updatedAt).toLocaleString()}
                    </div>
                    <div>Sort Order: {editingCategory.sortOrder}</div>
                    <div>
                      Status: {editingCategory.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-6 border-t mt-6">
              <Button onClick={handleAddCategory} className="flex-1">
                {editingCategory ? "Update Category" : "Add Category"}
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

export default ManageCategoriesView;
