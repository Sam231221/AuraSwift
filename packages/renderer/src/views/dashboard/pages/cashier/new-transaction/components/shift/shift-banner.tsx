/**
 * Shift banner component - prompts user to start shift
 */

import { AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Schedule } from "../../types/shift.types";

interface ShiftTimingInfo {
  canStart: boolean;
  buttonText: string;
  reason: string;
}

interface ShiftBannerProps {
  isOperationsDisabled: boolean;
  todaySchedule: Schedule | null;
  shiftTimingInfo: ShiftTimingInfo;
  onStartShift: () => void;
}

export function ShiftBanner({
  isOperationsDisabled,
  todaySchedule,
  shiftTimingInfo,
  onStartShift,
}: ShiftBannerProps) {
  if (!isOperationsDisabled) return null;

  return (
    <div className="bg-amber-50 border-b-2 border-amber-300 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
      <div className="flex items-start sm:items-center gap-2 sm:gap-3">
        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <p className="font-semibold text-amber-900 text-sm sm:text-base">
            Start Your Shift to Begin Transactions
          </p>
          <p className="text-xs sm:text-sm text-amber-700">
            {todaySchedule
              ? `Scheduled: ${new Date(
                  todaySchedule.startTime
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })} - ${new Date(todaySchedule.endTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}. ${shiftTimingInfo.reason}`
              : "You have a scheduled shift today. Please start your shift to perform transactions."}
          </p>
        </div>
      </div>
      <Button
        onClick={onStartShift}
        className={`bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto min-h-[44px] h-10 sm:h-11 text-xs sm:text-base touch-manipulation ${
          !shiftTimingInfo.canStart ? "opacity-50" : ""
        }`}
        size="lg"
        disabled={!todaySchedule || !shiftTimingInfo.canStart}
        title={shiftTimingInfo.reason}
      >
        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
        <span className="truncate">{shiftTimingInfo.buttonText}</span>
      </Button>
    </div>
  );
}
