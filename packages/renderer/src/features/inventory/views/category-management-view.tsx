import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  ChevronLeft,
  Tag,
  Settings,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/shared/hooks/use-auth";
import type { Category, VatCategory } from "../hooks/use-product-data";

import { buildCategoryTree } from "../utils";
import { CategoryRow } from "../components/category/category-row";
import { CategoryFormDrawer } from "@/features/inventory/components/category/category-form-drawer";
import { ImportBookerModal } from "@/features/inventory/components/shared/import-booker-modal";

import { getLogger } from "@/shared/utils/logger";
const logger = getLogger("manage-categories-view");

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
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

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
                ? (typeof c.createdAt === "string" ? c.createdAt : c.createdAt instanceof Date ? c.createdAt.toISOString() : new Date().toISOString())
                : new Date().toISOString(),
              updatedAt: c.updatedAt
                ? (typeof c.updatedAt === "string" ? c.updatedAt : c.updatedAt instanceof Date ? c.updatedAt.toISOString() : null)
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
      logger.error("Error loading categories:", error);
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
        // Normalize VatCategory to match hook type (ratePercent instead of percentage)
        const normalized = response.vatCategories.map((vat: any) => ({
          id: vat.id,
          name: vat.name,
          ratePercent: vat.ratePercent ?? vat.percentage ?? 0,
        }));
        setVatCategories(normalized);
      } else {
        logger.error("Failed to load VAT categories:", response.message);
        setVatCategories([]);
      }
    } catch (error) {
      logger.error("Error loading VAT categories:", error);
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
        ? (typeof c.createdAt === "string" ? c.createdAt : c.createdAt instanceof Date ? c.createdAt.toISOString() : new Date().toISOString())
        : new Date().toISOString(),
      updatedAt: c.updatedAt
        ? (typeof c.updatedAt === "string" ? c.updatedAt : c.updatedAt instanceof Date ? c.updatedAt.toISOString() : null)
        : null,
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
        logger.error("Error saving category:", error);
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
        logger.error("Error updating category:", error);
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

  const handleDeleteCategory = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setLoading(true);
      const response = await window.categoryAPI.delete(categoryToDelete);
      if (response.success) {
        setCategories(categories.filter((c) => c.id !== categoryToDelete));
        toast.success("Category deleted successfully");
      } else {
        toast.error(response.message || "Failed to delete category");
      }
    } catch (error) {
      logger.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
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
      logger.error("Error reordering categories:", error);
      // Revert on error
      setCategories(categories);
      toast.error("Failed to reorder categories");
    }
  };

  return (
    <>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="w-fit"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Category Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Organize your products with categories
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Import from Booker</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setIsDrawerOpen(true);
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Total Categories
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {categories.length}
                </p>
                <p className="text-xs sm:text-sm text-green-600 mt-1">
                  {categories.filter((c) => c.isActive).length} active
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Most Recent</p>
                <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {categories.length > 0
                    ? categories.sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )[0]?.name
                    : "None"}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Quick Actions
                </p>
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-3 sm:p-4 border-b bg-gray-50">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Categories
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
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
        category={editingCategory}
        categories={categories}
        vatCategories={vatCategories}
        businessId={user?.businessId || ""}
        onClose={handleCloseDrawer}
        onSave={handleSaveCategory}
        onUpdate={handleUpdateCategory}
      />

      <ImportBookerModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        importType="department"
        onSuccess={loadCategories}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageCategoriesView;
