import type React from "react";
import type { CategoryRowProps, CategoryWithChildren } from ".";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  GripVertical,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const CategoryRow: React.FC<CategoryRowProps> = ({
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
          {category.children.map((child: CategoryWithChildren) => (
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
