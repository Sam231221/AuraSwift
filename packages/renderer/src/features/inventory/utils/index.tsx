import type { Category } from "../hooks/use-product-data";
export type CategoryWithChildren = Category & {
  children: CategoryWithChildren[];
};

export interface CategoryRowProps {
  category: CategoryWithChildren;
  level: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  allCategories: Category[];
  expandedCategories: Set<string>;
}

// Helper: Focus the first error field
export function focusFirstErrorField(errors: Record<string, string>) {
  const errorFields = Object.keys(errors);
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
}

/**
 * Build hierarchical category tree from flat array
 * Optimized algorithm: O(n) time complexity using Map lookups
 *
 * Performance improvements:
 * - Single pass to create Map (O(n))
 * - Single pass to build relationships (O(n))
 * - In-place sorting per level (O(n log n) per level)
 *
 * Previous: O(n²) with nested loops
 * Current: O(n) for tree building + O(n log n) for sorting
 *
 * @param categories - Flat array of categories
 * @returns Hierarchical tree with sorted children at each level
 */
export function buildCategoryTree(
  categories: Category[]
): CategoryWithChildren[] {
  // Early return for empty input
  if (categories.length === 0) {
    return [];
  }

  const tree: CategoryWithChildren[] = [];
  const categoryMap = new Map<string, CategoryWithChildren>();

  // First pass: Create Map for O(1) lookups (O(n))
  for (const cat of categories) {
    categoryMap.set(cat.id, { ...cat, children: [] });
  }

  // Second pass: Build parent-child relationships (O(n))
  for (const cat of categories) {
    const categoryWithChildren = categoryMap.get(cat.id)!;

    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        // Parent exists - add to parent's children
        parent.children.push(categoryWithChildren);
      } else {
        // Orphaned category (parent not in list) - add to root
        tree.push(categoryWithChildren);
      }
    } else {
      // Root category (no parent) - add to tree
      tree.push(categoryWithChildren);
    }
  }

  /**
   * Recursively sort tree by sortOrder at each level
   * Uses in-place mutation for efficiency
   */
  const sortTree = (items: CategoryWithChildren[]): void => {
    // Sort current level by sortOrder (O(n log n))
    items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    // Recursively sort children
    for (const item of items) {
      if (item.children.length > 0) {
        sortTree(item.children);
      }
    }
  };

  sortTree(tree);
  return tree;
}
