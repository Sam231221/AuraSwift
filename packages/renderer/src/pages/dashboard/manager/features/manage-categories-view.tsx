import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
import { validateCategory } from "@/schemas/category-schema";

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

type CategoryWithChildren = Category & { children: CategoryWithChildren[] };

// CategoryRow component for hierarchical display
interface CategoryRowProps {
  category: CategoryWithChildren;
  level: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  allCategories: Category[];
  onReorder: (id: string, direction: "up" | "down") => void;
  expandedCategories: Set<string>;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  level,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  allCategories,
  onReorder,
  expandedCategories,
}) => {
  const hasChildren = category.children && category.children.length > 0;
  const paddingLeft = level * 24 + 16;

  // Get siblings at the same level for reordering
  const getSiblings = () => {
    if (!category.parentId) {
      // Top-level categories
      return allCategories.filter((c) => !c.parentId);
    } else {
      // Child categories - same parent
      return allCategories.filter((c) => c.parentId === category.parentId);
    }
  };

  const siblings = getSiblings();
  const currentIndex = siblings.findIndex((c) => c.id === category.id);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === siblings.length - 1;

  return (
    <>
      <div
        className="flex items-center justify-between hover:bg-gray-50 border-b border-gray-100"
        style={{
          paddingLeft: `${paddingLeft}px`,
          paddingRight: "16px",
          paddingTop: "12px",
          paddingBottom: "12px",
        }}
      >
        <div className="flex items-center space-x-3 flex-1">
          {/* Expand/Collapse button */}
          <button
            onClick={() => hasChildren && onToggleExpand(category.id)}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 ${
              !hasChildren ? "invisible" : ""
            }`}
          >
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ))}
          </button>

          {/* Drag handle */}
          <div className="cursor-grab">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>

          {/* Reorder buttons */}
          <div className="flex flex-col space-y-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReorder(category.id, "up")}
              disabled={isFirst}
              className="h-5 w-5 p-0 hover:bg-blue-100"
              title="Move up"
            >
              <span className="text-xs">↑</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReorder(category.id, "down")}
              disabled={isLast}
              className="h-5 w-5 p-0 hover:bg-blue-100"
              title="Move down"
            >
              <span className="text-xs">↓</span>
            </Button>
          </div>

          {/* Category info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{category.name}</span>
              {hasChildren && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {category.children.length}{" "}
                  {category.children.length === 1
                    ? "subcategory"
                    : "subcategories"}
                </span>
              )}
            </div>
            {category.description && (
              <div className="text-sm text-gray-500 mt-0.5">
                {category.description}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              Created: {new Date(category.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Action buttons */}
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
            onClick={() => onEdit(category)}
            title="Edit category"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(category.id)}
            title="Delete category"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </div>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <>
          {category.children.map((child) => (
            <CategoryRow
              key={child.id}
              category={child}
              level={level + 1}
              isExpanded={expandedCategories.has(child.id)}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              allCategories={allCategories}
              onReorder={onReorder}
              expandedCategories={expandedCategories}
            />
          ))}
        </>
      )}
    </>
  );
};

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
  });

  // Build hierarchical category tree
  const categoryTree = useMemo(() => {
    type CategoryWithChildren = Category & { children: CategoryWithChildren[] };
    const tree: CategoryWithChildren[] = [];
    const categoryMap = new Map<string, CategoryWithChildren>();

    // First pass: create map with children array
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: build tree structure
    categories.forEach((cat) => {
      const categoryWithChildren = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        } else {
          // Parent not found, treat as top-level
          tree.push(categoryWithChildren);
        }
      } else {
        tree.push(categoryWithChildren);
      }
    });

    // Sort by sortOrder at each level
    const sortTree = (items: CategoryWithChildren[]) => {
      items.sort((a, b) => a.sortOrder - b.sortOrder);
      items.forEach((item) => {
        if (item.children.length > 0) {
          sortTree(item.children);
        }
      });
    };

    sortTree(tree);
    return tree;
  }, [categories]);

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
    setFormErrors({});
  }, []);

  const handleAddCategory = async () => {
    // Clear previous errors
    setFormErrors({});

    if (!user?.businessId) {
      toast.error("Business ID not found");
      return;
    }

    // Validate using Zod schema
    const validationResult = validateCategory({
      ...newCategory,
      businessId: user.businessId,
      ...(editingCategory && { id: editingCategory.id }),
    });

    // Show all errors if any exist
    if (!validationResult.success && validationResult.errors) {
      setFormErrors(validationResult.errors);

      // Focus on the first error field after a short delay
      const errorFields = Object.keys(validationResult.errors);
      if (errorFields.length > 0) {
        setTimeout(() => {
          const firstErrorField = errorFields[0];
          const element = document.getElementById(firstErrorField);
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }

      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);

      const categoryData = {
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
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
          resetForm();
          setIsDrawerOpen(false);
        } else {
          console.error("Category update failed:", response);
          // Check if it's a duplicate error
          const errorMsg = response.message || "Failed to update category";
          console.log("Update error message:", errorMsg);
          const lowerErrorMsg = errorMsg.toLowerCase();

          if (
            (lowerErrorMsg.includes("name") &&
              lowerErrorMsg.includes("already exists")) ||
            lowerErrorMsg.includes("unique constraint failed: categories.name")
          ) {
            setFormErrors({
              name: "This category name already exists. Please use a different name.",
            });
            setTimeout(() => {
              const nameField = document.getElementById("name");
              if (nameField) {
                nameField.focus();
                nameField.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }, 100);
            toast.error("Category name already exists");
          } else {
            toast.error(errorMsg);
          }
        }
      } else {
        // Create new category
        const response = await window.categoryAPI.create(categoryData);
        if (response.success && response.category) {
          setCategories([...categories, response.category]);
          toast.success("Category created successfully");
          resetForm();
          setIsDrawerOpen(false);
        } else {
          // Check if it's a duplicate error
          console.log("Create category failed. Full response:", response);
          const errorMsg = response.message || "Failed to create category";
          console.log("Error message:", errorMsg);
          const lowerErrorMsg = errorMsg.toLowerCase();

          if (
            (lowerErrorMsg.includes("name") &&
              lowerErrorMsg.includes("already exists")) ||
            lowerErrorMsg.includes("unique constraint failed: categories.name")
          ) {
            setFormErrors({
              name: "This category name already exists. Please use a different name.",
            });
            setTimeout(() => {
              const nameField = document.getElementById("name");
              if (nameField) {
                nameField.focus();
                nameField.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }, 100);
            toast.error("Category name already exists");
          } else {
            toast.error(errorMsg);
          }
        }
      }

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
    // Find the category being moved
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    // Get siblings (categories with same parent)
    const siblings = categories.filter((c) =>
      category.parentId ? c.parentId === category.parentId : !c.parentId
    );

    // Sort siblings by sortOrder
    siblings.sort((a, b) => a.sortOrder - b.sortOrder);

    const currentIndex = siblings.findIndex((c) => c.id === categoryId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === siblings.length - 1)
    ) {
      return; // Can't move beyond boundaries
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Create new array with swapped sortOrder values
    const updatedSiblings = siblings.map((sibling, index) => {
      if (index === currentIndex) {
        return { ...sibling, sortOrder: siblings[newIndex].sortOrder };
      } else if (index === newIndex) {
        return { ...sibling, sortOrder: siblings[currentIndex].sortOrder };
      }
      return sibling;
    });

    // Update the categories array with new sortOrder values
    const updatedCategories = categories.map((cat) => {
      const updatedSibling = updatedSiblings.find((s) => s.id === cat.id);
      return updatedSibling || cat;
    });

    // Update local state immediately for better UX
    setCategories(updatedCategories);

    try {
      // Send new order to backend (all category IDs sorted by sortOrder)
      const categoryIds = [...updatedCategories]
        .sort((a, b) => a.sortOrder - b.sortOrder)
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
                {formErrors.parentId && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.parentId}
                  </p>
                )}
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
