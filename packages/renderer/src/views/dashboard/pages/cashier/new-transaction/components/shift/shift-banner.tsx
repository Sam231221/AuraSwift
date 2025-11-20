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
    <div className="bg-amber-50 border-b-2 border-amber-300 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <div>
          <p className="font-semibold text-amber-900">
            Start Your Shift to Begin Transactions
          </p>
          <p className="text-sm text-amber-700">
            {todaySchedule
              ? `Scheduled: ${new Date(
                  todaySchedule.startTime
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })} - ${new Date(todaySchedule.endTime).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }
                )}. ${shiftTimingInfo.reason}`
              : "You have a scheduled shift today. Please start your shift to perform transactions."}
          </p>
        </div>
      </div>
      <Button
        onClick={onStartShift}
        className={`bg-amber-600 hover:bg-amber-700 text-white ${
          !shiftTimingInfo.canStart ? "opacity-50" : ""
        }`}
        size="lg"
        disabled={!todaySchedule || !shiftTimingInfo.canStart}
        title={shiftTimingInfo.reason}
      >
        <Clock className="h-4 w-4 mr-2" />
        {shiftTimingInfo.buttonText}
      </Button>
    </div>
  );
}

