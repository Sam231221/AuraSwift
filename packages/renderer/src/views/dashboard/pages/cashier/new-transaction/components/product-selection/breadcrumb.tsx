/**
 * Breadcrumb navigation component
 */

import React from "react";
import { ChevronRight, Home } from "lucide-react";
import type { BreadcrumbItem } from "../../types/transaction.types";

interface BreadcrumbProps {
  breadcrumb: BreadcrumbItem[];
  onBreadcrumbClick: (index: number) => void;
}

export function Breadcrumb({
  breadcrumb,
  onBreadcrumbClick,
}: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-1 text-sm">
      {breadcrumb.map((item, index) => (
        <React.Fragment key={item.id || "root"}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          <button
            onClick={() => onBreadcrumbClick(index)}
            className={`px-2 py-1 rounded transition-colors ${
              index === breadcrumb.length - 1
                ? "bg-sky-100 text-sky-700 font-medium"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {index === 0 ? <Home className="h-4 w-4" /> : item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

