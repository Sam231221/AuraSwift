import type { Category } from "../../../../../../../../../../types/db";
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
  onReorder: (id: string, direction: "up" | "down") => void;
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

// Helper: Build hierarchical category tree
export function buildCategoryTree(
  categories: Category[]
): CategoryWithChildren[] {
  const tree: CategoryWithChildren[] = [];
  const categoryMap = new Map<string, CategoryWithChildren>();
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });
  categories.forEach((cat) => {
    const categoryWithChildren = categoryMap.get(cat.id)!;
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(categoryWithChildren);
      } else {
        tree.push(categoryWithChildren);
      }
    } else {
      tree.push(categoryWithChildren);
    }
  });
  // Sort by sortOrder at each level, without mutating original arrays
  const sortTree = (items: CategoryWithChildren[]) => {
    const sorted = items
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    items.length = 0;
    items.push(...sorted);
    items.forEach((item) => {
      if (item.children.length > 0) {
        sortTree(item.children);
      }
    });
  };
  sortTree(tree);
  return tree;
}
