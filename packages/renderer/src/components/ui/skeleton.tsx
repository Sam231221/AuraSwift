import { cn } from "@/shared/utils/cn";

interface SkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Apply shimmer effect animation
   * @default false
   */
  shimmer?: boolean;
}

/**
 * Skeleton Component
 *
 * A flexible skeleton loader component for displaying placeholder content
 * while data is loading. Supports standard pulse animation and optional
 * shimmer effect for enhanced visual feedback.
 *
 * Features:
 * - Pulse animation (default)
 * - Optional shimmer effect
 * - Accessible with proper ARIA attributes
 * - Fully customizable via className prop
 *
 * @param shimmer - Enable shimmer animation instead of pulse
 * @param className - Additional CSS classes
 *
 * @example
 * ```tsx
 * <Skeleton className="w-full h-4" />
 * <Skeleton className="w-12 h-12 rounded-full" shimmer />
 * ```
 */
function Skeleton({ className, shimmer = false, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      role="status"
      aria-label="Loading"
      aria-live="polite"
      className={cn(
        "bg-gray-300 rounded-md",
        shimmer
          ? "animate-shimmer bg-linear-to-r from-gray-300 via-gray-200 to-gray-300 bg-size-[200%_100%]"
          : "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
