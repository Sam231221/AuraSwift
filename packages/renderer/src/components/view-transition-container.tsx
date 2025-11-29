import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode } from "react";

interface ViewTransitionContainerProps {
  /**
   * The current active view key
   */
  currentView: string;
  
  /**
   * Map of view keys to their React components
   */
  views: Record<string, ReactNode>;
  
  /**
   * Default animation direction for dashboard view
   * @default "right"
   */
  defaultDirection?: "left" | "right";
  
  /**
   * Animation duration in seconds
   * @default 0.3
   */
  animationDuration?: number;
  
  /**
   * Additional CSS classes
   * @default "w-full"
   */
  className?: string;
  
  /**
   * Custom function to determine animation direction based on view
   * If provided, overrides defaultDirection logic
   */
  getDirection?: (view: string) => "left" | "right";
}

/**
 * Reusable container component for animated view transitions
 * 
 * Provides consistent slide animations between views using framer-motion
 * 
 * @example
 * ```tsx
 * const views = {
 *   dashboard: <DashboardView />,
 *   settings: <SettingsView />,
 * };
 * 
 * <ViewTransitionContainer
 *   currentView={currentView}
 *   views={views}
 * />
 * ```
 */
export function ViewTransitionContainer({
  currentView,
  views,
  defaultDirection = "right",
  animationDuration = 0.3,
  className = "w-full",
  getDirection,
}: ViewTransitionContainerProps) {
  const determineDirection = (view: string): "left" | "right" => {
    if (getDirection) {
      return getDirection(view);
    }
    // Default logic: dashboard slides from right, others from left
    return view === "dashboard" ? defaultDirection : "left";
  };

  const direction = determineDirection(currentView);

  return (
    <div className="grid gap-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{
            x: direction === "right" ? 300 : -300,
            opacity: 0,
          }}
          animate={{ x: 0, opacity: 1 }}
          exit={{
            x: direction === "right" ? -300 : 300,
            opacity: 0,
          }}
          transition={{ duration: animationDuration, ease: "easeInOut" }}
          className={className}
        >
          {views[currentView] || null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

