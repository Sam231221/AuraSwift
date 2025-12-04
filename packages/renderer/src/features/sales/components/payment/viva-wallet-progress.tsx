/**
 * Viva Wallet Transaction Progress Component
 * Displays animated progress bar for transaction status
 */

import { Progress } from "@/components/ui/progress";
import { cn } from "@/shared/utils/cn";

interface VivaWalletProgressProps {
  status:
    | "pending"
    | "processing"
    | "awaiting_card"
    | "completed"
    | "failed"
    | "cancelled";
  progress?: number;
}

export function VivaWalletProgress({
  status,
  progress = 0,
}: VivaWalletProgressProps) {
  // Calculate progress based on status if not provided
  const getProgress = (): number => {
    if (progress !== undefined && progress > 0) {
      return Math.min(100, Math.max(0, progress));
    }

    switch (status) {
      case "pending":
        return 10;
      case "processing":
        return 40;
      case "awaiting_card":
        return 60;
      case "completed":
        return 100;
      case "failed":
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  };

  const getStatusLabel = (): string => {
    switch (status) {
      case "pending":
        return "Initializing...";
      case "processing":
        return "Processing...";
      case "awaiting_card":
        return "Waiting for card...";
      case "completed":
        return "Complete";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return "Processing...";
    }
  };

  const currentProgress = getProgress();
  const isActive = ["pending", "processing", "awaiting_card"].includes(status);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{getStatusLabel()}</span>
        <span>{currentProgress}%</span>
      </div>
      <Progress
        value={currentProgress}
        className={cn(
          "h-2 transition-all duration-300",
          isActive && "animate-pulse"
        )}
      />
    </div>
  );
}

