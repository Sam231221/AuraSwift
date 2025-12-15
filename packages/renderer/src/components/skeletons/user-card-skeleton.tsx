import { Skeleton } from "@/components/ui/skeleton";

/**
 * UserCardSkeleton Component
 *
 * A skeleton loader that mimics the structure of a user card in the auth page.
 * Matches the dimensions and layout of the actual UserCard component.
 *
 * Features:
 * - Circular avatar skeleton (responsive sizes)
 * - Two-line name text skeleton
 * - Matches padding and spacing of real cards
 * - Pulse animation from base Skeleton component
 *
 * @example
 * ```tsx
 * <UserCardSkeleton />
 * ```
 */
export function UserCardSkeleton() {
  return (
    <div className="flex flex-col items-center p-2 sm:p-3">
      {/* Avatar skeleton - matches user card avatar sizes */}
      <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full mb-2" />

      {/* Name skeleton - two lines to match first name + last name */}
      <div className="w-full space-y-1">
        <Skeleton className="h-3 sm:h-4 w-3/4 mx-auto" />
        <Skeleton className="h-3 sm:h-4 w-1/2 mx-auto" />
      </div>
    </div>
  );
}
