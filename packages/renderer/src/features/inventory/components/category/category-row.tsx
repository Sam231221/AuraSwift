import type React from "react";
import type {
  CategoryRowProps,
  CategoryWithChildren,
} from "@/features/inventory/utils";
import { ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  level,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  allCategories,
  expandedCategories,
}) => {
  const hasChildren = category.children && category.children.length > 0;
  const paddingLeft = level * 24 + 16;

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

          {/* Category info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {category.name.length > 40 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-gray-900 truncate cursor-help max-w-[300px]">
                      {category.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs bg-gray-900 text-white"
                  >
                    <p className="whitespace-normal">{category.name}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="font-medium text-gray-900">
                  {category.name}
                </span>
              )}
              {hasChildren && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded shrink-0">
                  {category.children.length}{" "}
                  {category.children.length === 1
                    ? "subcategory"
                    : "subcategories"}
                </span>
              )}
            </div>
            {category.description &&
              (category.description.length > 50 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-sm text-gray-500 mt-0.5 truncate cursor-help max-w-[400px]">
                      {category.description}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs bg-gray-900 text-white"
                  >
                    <p className="whitespace-normal">{category.description}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div className="text-sm text-gray-500 mt-0.5">
                  {category.description}
                </div>
              ))}
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
              expandedCategories={expandedCategories}
            />
          ))}
        </>
      )}
    </>
  );
};
