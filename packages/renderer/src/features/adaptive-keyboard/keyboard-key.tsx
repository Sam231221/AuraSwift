import { cn } from "@/shared/utils/cn";
import type { ReactNode } from "react";

export type KeyVariant =
  | "default"
  | "action"
  | "special"
  | "danger"
  | "success"
  | "wide"
  | "extra-wide";

interface KeyboardKeyProps {
  children: ReactNode;
  onClick: () => void;
  variant?: KeyVariant;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const variantStyles: Record<KeyVariant, string> = {
  default:
    "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:bg-slate-400 dark:active:bg-slate-500 text-slate-900 dark:text-white",
  action:
    "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 active:bg-slate-500 dark:active:bg-slate-400 text-slate-900 dark:text-white",
  special:
    "bg-teal-500 dark:bg-teal-600 hover:bg-teal-400 dark:hover:bg-teal-500 active:bg-teal-300 dark:active:bg-teal-400 text-white font-semibold",
  danger:
    "bg-red-500 dark:bg-red-600 hover:bg-red-400 dark:hover:bg-red-500 active:bg-red-300 dark:active:bg-red-400 text-white font-semibold",
  success:
    "bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-400 dark:hover:bg-emerald-500 active:bg-emerald-300 dark:active:bg-emerald-400 text-white font-semibold",
  wide: "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:bg-slate-400 dark:active:bg-slate-500 text-slate-900 dark:text-white col-span-2",
  "extra-wide":
    "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:bg-slate-400 dark:active:bg-slate-500 text-slate-900 dark:text-white col-span-4",
};

export function KeyboardKey({
  children,
  onClick,
  variant = "default",
  className,
  disabled = false,
  ariaLabel,
}: KeyboardKeyProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        ariaLabel || (typeof children === "string" ? children : undefined)
      }
      className={cn(
        "flex items-center justify-center rounded-lg border border-slate-300/50 dark:border-slate-500/50",
        // Small screens (default)
        "min-h-[44px] min-w-[32px] px-1.5 py-2 text-xs",
        // Medium screens (md: 768px+)
        "md:min-h-[48px] md:min-w-[36px] md:px-2 md:py-2.5 md:text-sm",
        // Large screens (lg: 1024px+)
        "lg:min-h-[52px] lg:min-w-[40px] lg:px-2 lg:py-3 lg:text-sm",
        "font-medium transition-all duration-150 ease-out",
        "select-none touch-manipulation",
        "shadow-sm hover:shadow-md active:shadow-none active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
