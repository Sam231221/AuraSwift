import { Button } from "@/components/ui/button";
import { Clock, Timer } from "lucide-react";
import type { UserForLogin } from "../types/auth.types";

interface ClockInOutButtonsProps {
  user: UserForLogin;
  isLoading: boolean;
  isClockingIn: boolean;
  isClockingOut: boolean;
  clockMessage: string;
  onClockIn: () => Promise<void>;
  onClockOut: () => Promise<void>;
}

export function ClockInOutButtons({
  user,
  isLoading,
  isClockingIn,
  isClockingOut,
  clockMessage,
  onClockIn,
  onClockOut,
}: ClockInOutButtonsProps) {
  // Only show for cashiers and managers
  if (user.role !== "cashier" && user.role !== "manager") {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Button
          onClick={onClockIn}
          disabled={isLoading || isClockingIn || isClockingOut}
          className="h-11 sm:h-12 text-xs sm:text-sm font-medium bg-green-100 hover:bg-green-200 text-green-700 border-0 rounded-lg disabled:opacity-50 touch-manipulation"
        >
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">
            {isClockingIn ? "CLOCKING IN..." : "CLOCK IN"}
          </span>
          <span className="sm:hidden">{isClockingIn ? "IN..." : "IN"}</span>
        </Button>
        <Button
          onClick={onClockOut}
          disabled={isLoading || isClockingIn || isClockingOut}
          className="h-11 sm:h-12 text-xs sm:text-sm font-medium bg-orange-100 hover:bg-orange-200 text-orange-700 border-0 rounded-lg disabled:opacity-50 touch-manipulation"
        >
          <Timer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">
            {isClockingOut ? "CLOCKING OUT..." : "CLOCK OUT"}
          </span>
          <span className="sm:hidden">{isClockingOut ? "OUT..." : "OUT"}</span>
        </Button>
      </div>

      {clockMessage && (
        <div
          className={`mt-2 p-2 rounded-lg text-xs text-center ${
            clockMessage.startsWith("✓")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {clockMessage}
        </div>
      )}
    </>
  );
}
