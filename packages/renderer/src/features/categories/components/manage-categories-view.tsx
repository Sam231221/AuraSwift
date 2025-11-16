import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Plus, ChevronLeft, Tag, Settings } from "lucide-react";
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
import { validateCategory } from "@/features/categories/schemas/category-schema";
import type { Category } from "../../../../../../types/db";
import { buildCategoryTree, focusFirstErrorField } from "./utilities";
import { CategoryRow } from "./utilities/category-row";

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
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parentId: "",
    vatCategoryId: "",
    color: "",
    image: "",
    isActive: true,
  });

  // Build hierarchical category tree
  const categoryTree = useMemo(
    () => buildCategoryTree(categories),
    [categories]
  );

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await window.categoryAPI.getByBusiness(user!.businessId);
      if (response.success && response.categories) {
        // Normalize all fields to match Category type
        const normalized: Category[] = response.categories.map(
          (cat: unknown) => {
            const c = cat as Partial<Category> & { [key: string]: unknown };
            return {
              ...c,
              parentId: c.parentId ?? null,
              vatCategoryId: c.vatCategoryId ?? null,
              color: c.color ?? null,
              image: c.image ?? null,
              isActive: typeof c.isActive === "boolean" ? c.isActive : true,
              sortOrder: c.sortOrder ?? 0,
              createdAt: c.createdAt
                ? new Date(c.createdAt as string | Date)
                : new Date(),
              updatedAt: c.updatedAt
                ? new Date(c.updatedAt as string | Date)
                : null,
              description: c.description ?? "",
            } as Category;
          }
        );
        // Sort by sortOrder, handling nulls
        const sortedCategories = normalized.sort(
          (a: Category, b: Category) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
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
      vatCategoryId: "",
      color: "",
      image: "",
      isActive: true,
    });
    setEditingCategory(null);
    setFormErrors({});
  }, []);

  const handleAddCategory = async () => {
    setFormErrors({});

    if (!user?.businessId) {
      toast.error("Business ID not found");
      return;
    }

    // Prepare data for validation and API
    const categoryPayload = {
      ...newCategory,
      businessId: user.businessId,
      sortOrder:
        editingCategory && typeof editingCategory.sortOrder === "number"
          ? editingCategory.sortOrder
          : categories.length + 1,
      parentId: newCategory.parentId ? newCategory.parentId : undefined,
      vatCategoryId: newCategory.vatCategoryId
        ? newCategory.vatCategoryId
        : undefined,
      color: newCategory.color ? newCategory.color : undefined,
      image: newCategory.image ? newCategory.image : undefined,
      isActive:
        typeof newCategory.isActive === "boolean" ? newCategory.isActive : true,
      ...(editingCategory && { id: editingCategory.id }),
    };

    // Validate using Zod schema
    const validationResult = validateCategory(categoryPayload);
    if (!validationResult.success && validationResult.errors) {
      setFormErrors(validationResult.errors);
      focusFirstErrorField(validationResult.errors);
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);
      let response;
      if (editingCategory) {
        response = await window.categoryAPI.update(
          editingCategory.id,
          categoryPayload
        );
      } else {
        response = await window.categoryAPI.create(categoryPayload);
      }

      // Normalize the returned category object
      const normalizeCategory = (cat: unknown): Category => {
        const c = cat as Partial<Category> & { [key: string]: unknown };
        return {
          ...c,
          parentId: c.parentId ?? null,
          vatCategoryId: c.vatCategoryId ?? null,
          color: c.color ?? null,
          image: c.image ?? null,
          isActive: typeof c.isActive === "boolean" ? c.isActive : true,
          sortOrder: c.sortOrder ?? 0,
          createdAt: c.createdAt
            ? new Date(c.createdAt as string | Date)
            : new Date(),
          updatedAt: c.updatedAt
            ? new Date(c.updatedAt as string | Date)
            : null,
          description: c.description ?? "",
        } as Category;
      };

      if (response.success && response.category) {
        const normalizedCat = normalizeCategory(response.category);
        if (editingCategory) {
          setCategories(
            categories.map((c) =>
              c.id === editingCategory.id ? normalizedCat : c
            )
          );
          toast.success("Category updated successfully");
        } else {
          setCategories([...categories, normalizedCat]);
          toast.success("Category created successfully");
        }
        resetForm();
        setIsDrawerOpen(false);
      } else {
        const errorMsg =
          response.message ||
          (editingCategory
            ? "Failed to update category"
            : "Failed to create category");
        const lowerErrorMsg = errorMsg.toLowerCase();
        if (
          (lowerErrorMsg.includes("name") &&
            lowerErrorMsg.includes("already exists")) ||
          lowerErrorMsg.includes("unique constraint failed: categories.name")
        ) {
          setFormErrors({
            name: "This category name already exists. Please use a different name.",
          });
          focusFirstErrorField({
            name: "This category name already exists. Please use a different name.",
          });
          toast.error("Category name already exists");
        } else {
          toast.error(errorMsg);
        }
      }
      await loadCategories();
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
      vatCategoryId: category.vatCategoryId ?? "",
      color: category.color ?? "",
      image: category.image ?? "",
      isActive:
        typeof category.isActive === "boolean" ? category.isActive : true,
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
    // Find the category being moved
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    // Get siblings (categories with same parent)
    const siblings = categories.filter((c) =>
      category.parentId ? c.parentId === category.parentId : !c.parentId
    );

    // Sort siblings by sortOrder (copy, don't mutate)
    const sortedSiblings = siblings
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const currentIndex = sortedSiblings.findIndex((c) => c.id === categoryId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === sortedSiblings.length - 1)
    ) {
      return; // Can't move beyond boundaries
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Swap the two siblings
    const reorderedSiblings = sortedSiblings.slice();
    const [moved] = reorderedSiblings.splice(currentIndex, 1);
    reorderedSiblings.splice(newIndex, 0, moved);

    // Update sortOrder for affected siblings
    const updatedSiblings = reorderedSiblings.map((sibling, idx) => ({
      ...sibling,
      sortOrder: idx + 1,
    }));

    // Merge updated siblings back into categories
    const updatedCategories = categories.map((cat) => {
      const updated = updatedSiblings.find((s) => s.id === cat.id);
      return updated ? updated : cat;
    });

    setCategories(updatedCategories);

    try {
      // Send new order to backend (all category IDs sorted by sortOrder)
      const categoryIds = [...updatedCategories]
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((c) => c.id);

      const response = await window.categoryAPI.reorder(
        user!.businessId,
        categoryIds
      );

      if (!response.success) {
        // Revert on failure
        setCategories(categories);
        toast.error("Failed to reorder categories");
      } else {
        // Reload to ensure consistency
        await loadCategories();
      }
    } catch (error) {
      console.error("Error reordering categories:", error);
      // Revert on error
      setCategories(categories);
      toast.error("Failed to reorder categories");
    }
  };

  // Helper function to clear field-specific errors
  const clearFieldError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
              Use ↑↓ buttons to reorder, click ▶ to expand/collapse
              subcategories
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
              {categoryTree.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  level={0}
                  isExpanded={expandedCategories.has(category.id)}
                  onToggleExpand={toggleExpand}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  allCategories={categories}
                  onReorder={handleReorderCategory}
                  expandedCategories={expandedCategories}
                />
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
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => {
                    setNewCategory({ ...newCategory, name: e.target.value });
                    clearFieldError("name");
                  }}
                  placeholder="Enter category name"
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => {
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    });
                    clearFieldError("description");
                  }}
                  placeholder="Enter category description"
                  rows={3}
                  className={formErrors.description ? "border-red-500" : ""}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="parentId">Parent Category</Label>
                <select
                  id="parentId"
                  className={`w-full border rounded px-3 py-2 mt-1 ${
                    formErrors.parentId ? "border-red-500" : ""
                  }`}
                  value={newCategory.parentId}
                  onChange={(e) => {
                    setNewCategory({
                      ...newCategory,
                      parentId: e.target.value,
                    });
                    clearFieldError("parentId");
                  }}
                >
                  <option value="">None (Top-level)</option>
                  {buildCategoryTree(categories)
                    .filter(
                      (cat) => !editingCategory || cat.id !== editingCategory.id
                    )
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                {formErrors.parentId && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.parentId}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="vatCategoryId">VAT Category</Label>
                <Input
                  id="vatCategoryId"
                  value={newCategory.vatCategoryId}
                  onChange={(e) => {
                    setNewCategory({
                      ...newCategory,
                      vatCategoryId: e.target.value,
                    });
                    clearFieldError("vatCategoryId");
                  }}
                  placeholder="Enter VAT category ID (optional)"
                  className={formErrors.vatCategoryId ? "border-red-500" : ""}
                />
                {formErrors.vatCategoryId && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.vatCategoryId}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={newCategory.color}
                  onChange={(e) => {
                    setNewCategory({ ...newCategory, color: e.target.value });
                    clearFieldError("color");
                  }}
                  placeholder="Enter color (optional)"
                  className={formErrors.color ? "border-red-500" : ""}
                />
                {formErrors.color && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.color}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={newCategory.image}
                  onChange={(e) => {
                    setNewCategory({ ...newCategory, image: e.target.value });
                    clearFieldError("image");
                  }}
                  placeholder="Enter image URL (optional)"
                  className={formErrors.image ? "border-red-500" : ""}
                />
                {formErrors.image && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.image}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={newCategory.isActive}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      isActive: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              {editingCategory && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Category Information
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      Created:{" "}
                      {editingCategory.createdAt instanceof Date
                        ? editingCategory.createdAt.toLocaleString()
                        : new Date(editingCategory.createdAt).toLocaleString()}
                    </div>
                    <div>
                      Last Updated:{" "}
                      {editingCategory.updatedAt
                        ? editingCategory.updatedAt instanceof Date
                          ? editingCategory.updatedAt.toLocaleString()
                          : new Date(editingCategory.updatedAt).toLocaleString()
                        : "-"}
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
