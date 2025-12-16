/**
 * Skeleton Loading Components
 *
 * Provides visual placeholders while data is loading to improve perceived performance.
 * Uses CSS animations for smooth pulsing effect.
 */

/**
 * Product Table Skeleton
 *
 * Displays a skeleton version of the product table with animated placeholders.
 * Shows 10 rows by default to fill the viewport.
 */
export function ProductTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Table Header */}
      <div className="overflow-x-auto border-b bg-gray-50">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr>
              <th className="text-left p-4 font-semibold text-gray-900 w-20">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[800px]">
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {/* Image */}
                <td className="p-4 w-20">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
                </td>

                {/* Name */}
                <td className="p-4 min-w-[150px] max-w-[300px]">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                  </div>
                </td>

                {/* Category */}
                <td className="p-4 min-w-[120px]">
                  <div className="h-6 bg-blue-100 rounded-full w-24 animate-pulse" />
                </td>

                {/* Price */}
                <td className="p-4 w-32">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </td>

                {/* Stock */}
                <td className="p-4 w-32">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                  </div>
                </td>

                {/* SKU */}
                <td className="p-4 min-w-[100px]">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </td>

                {/* Status */}
                <td className="p-4 w-32">
                  <div className="h-6 bg-green-100 rounded-full w-16 animate-pulse" />
                </td>

                {/* Actions */}
                <td className="p-4 w-40">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Category List Skeleton
 *
 * Displays a skeleton version of the category list.
 * Shows hierarchical structure with indentation.
 */
export function CategoryListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, index) => {
        // Vary indentation levels for visual hierarchy
        const level = index % 3 === 0 ? 0 : index % 3 === 1 ? 1 : 2;
        const paddingLeft = level * 24 + 16;

        return (
          <div
            key={index}
            className="p-4 hover:bg-gray-50"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Expand icon placeholder */}
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse shrink-0" />

                {/* Category name */}
                <div className="flex-1 min-w-0">
                  <div className="h-5 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>

                {/* Product count */}
                <div className="h-6 bg-blue-100 rounded-full w-12 animate-pulse" />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 ml-4">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Dashboard Stats Skeleton
 *
 * Displays skeleton placeholders for dashboard stat cards.
 */
export function DashboardStatsSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Product Grid Skeleton
 *
 * Displays skeleton for product grid (sales view).
 */
export function ProductGridSkeleton({ items = 12 }: { items?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4"
        >
          {/* Image placeholder */}
          <div className="w-full aspect-square bg-gray-200 rounded-lg mb-3 animate-pulse" />

          {/* Product name */}
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />

          {/* Price */}
          <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/**
 * List Item Skeleton
 *
 * Generic skeleton for list items (transactions, batches, etc.).
 */
export function ListItemSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
