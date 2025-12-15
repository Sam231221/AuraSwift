import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCardSkeleton } from "./user-card-skeleton";

interface UserGridSkeletonProps {
  /**
   * Number of skeleton user cards to display
   * @default 6
   */
  count?: number;
}

/**
 * UserGridSkeleton Component
 *
 * A skeleton loader for the user selection grid on the auth page.
 * Displays a grid of UserCardSkeleton components with a loading header.
 *
 * Features:
 * - Responsive grid layout (2-3 columns based on viewport)
 * - Header skeleton for title and description
 * - Configurable number of skeleton cards
 * - Matches exact layout of UserSelectionGrid
 *
 * @param count - Number of user card skeletons to display (default: 6)
 *
 * @example
 * ```tsx
 * <UserGridSkeleton count={6} />
 * ```
 */
export function UserGridSkeleton({ count = 6 }: UserGridSkeletonProps) {
  return (
    <Card className="border-0 shadow-none bg-transparent rounded-3xl overflow-hidden">
      <div className="p-4 sm:p-6">
        {/* Header skeleton - matches "Select User" title and subtitle */}
        <div className="text-center mb-4 sm:mb-6">
          <Skeleton className="h-7 sm:h-8 lg:h-9 w-48 mx-auto mb-2" />
          <Skeleton className="h-3 sm:h-4 w-36 mx-auto" />
        </div>

        {/* Grid skeleton - matches responsive grid layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: count }).map((_, index) => (
            <UserCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </Card>
  );
}
