import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";
import { Label } from "@/components/ui/label";

interface AdaptiveTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  onFocus?: () => void;
}

export const AdaptiveTextarea = forwardRef<
  HTMLTextAreaElement,
  AdaptiveTextareaProps
>(({ label, error, className, onFocus, ...props }, ref) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[100px] w-full rounded-lg border-2 bg-input px-4 py-3",
          "text-lg font-medium placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-150 resize-none",
          error
            ? "border-destructive focus-visible:ring-destructive"
            : "border-border focus-visible:border-primary",
          className
        )}
        onFocus={onFocus}
        {...props}
      />
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
});

AdaptiveTextarea.displayName = "AdaptiveTextarea";
