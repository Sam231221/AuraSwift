import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Plus, ChevronLeft, Tag, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/shared/hooks/use-auth";
import type {
  Category,
  VatCategory,
} from "../../../../../../../../../types/db";

import { buildCategoryTree } from "./utils";
import { CategoryRow } from "./utils/category-row";
import { CategoryFormDrawer } from "./components/category-form-drawer";

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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const [vatCategories, setVatCategories] = useState<VatCategory[]>([]);

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
              vatOverridePercent: c.vatOverridePercent ?? null,
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

  // Load VAT categories from backend
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

  useEffect(() => {
    loadVatCategories();
  }, [loadVatCategories]);

  // Load categories on component mount
  useEffect(() => {
    if (user?.businessId) {
      loadCategories();
    }
  }, [user, loadCategories]);

  // Normalize category from API response
  const normalizeCategory = useCallback((cat: unknown): Category => {
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
      updatedAt: c.updatedAt ? new Date(c.updatedAt as string | Date) : null,
      description: c.description ?? "",
      vatOverridePercent: c.vatOverridePercent ?? null,
    } as Category;
  }, []);

  const handleSaveCategory = useCallback(
    async (data: {
      name: string;
      description?: string;
      parentId?: string | null;
      vatCategoryId?: string | null;
      vatOverridePercent?: number | null;
      color?: string | null;
      image?: string | null;
      isActive: boolean;
      sortOrder?: number;
    }) => {
      if (!user?.businessId) {
        throw new Error("Business ID not found");
      }

      try {
        setLoading(true);
        const categoryPayload = {
          ...data,
          businessId: user.businessId,
          sortOrder: data.sortOrder ?? categories.length + 1,
        };

        const response = await window.categoryAPI.create(categoryPayload);

        if (response.success && response.category) {
          const normalizedCat = normalizeCategory(response.category);
          setCategories([...categories, normalizedCat]);
          await loadCategories();
        } else {
          const errorMsg = response.message || "Failed to create category";
          const lowerErrorMsg = errorMsg.toLowerCase();
          if (
            (lowerErrorMsg.includes("name") &&
              lowerErrorMsg.includes("already exists")) ||
            lowerErrorMsg.includes("unique constraint failed: categories.name")
          ) {
            throw new Error(
              "This category name already exists. Please use a different name."
            );
          }
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error("Error saving category:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user, categories, normalizeCategory, loadCategories]
  );

  const handleUpdateCategory = useCallback(
    async (
      id: string,
      data: {
        name: string;
        description?: string;
        parentId?: string | null;
        vatCategoryId?: string | null;
        vatOverridePercent?: number | null;
        color?: string | null;
        image?: string | null;
        isActive: boolean;
      }
    ) => {
      if (!user?.businessId) {
        throw new Error("Business ID not found");
      }

      try {
        setLoading(true);
        const categoryPayload = {
          ...data,
          businessId: user.businessId,
        };

        const response = await window.categoryAPI.update(id, categoryPayload);

        if (response.success && response.category) {
          const normalizedCat = normalizeCategory(response.category);
          setCategories(
            categories.map((c) => (c.id === id ? normalizedCat : c))
          );
          await loadCategories();
        } else {
          const errorMsg = response.message || "Failed to update category";
          const lowerErrorMsg = errorMsg.toLowerCase();
          if (
            (lowerErrorMsg.includes("name") &&
              lowerErrorMsg.includes("already exists")) ||
            lowerErrorMsg.includes("unique constraint failed: categories.name")
          ) {
            throw new Error(
              "This category name already exists. Please use a different name."
            );
          }
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error("Error updating category:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user, categories, normalizeCategory, loadCategories]
  );

  const handleEditCategory = useCallback((category: Category) => {
    setEditingCategory(category);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingCategory(null);
  }, []);

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
              setEditingCategory(null);
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
                    setEditingCategory(null);
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
                  setEditingCategory(null);
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
      <CategoryFormDrawer
        isOpen={isDrawerOpen}
        category={editingCategory as any}
        categories={categories as any}
        vatCategories={vatCategories}
        businessId={user?.businessId || ""}
        onClose={handleCloseDrawer}
        onSave={handleSaveCategory}
        onUpdate={handleUpdateCategory}
      />
    </>
  );
};

export default ManageCategoriesView;
