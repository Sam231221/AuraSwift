/**
 * Overtime warning banner component
 */

import { AlertTriangle } from "lucide-react";

interface OvertimeWarningProps {
  show: boolean;
  minutes: number;
}

export function OvertimeWarning({ show, minutes }: OvertimeWarningProps) {
  if (!show) return null;

  return (
    <div className="bg-red-50 border-b-2 border-red-300 p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-3">
      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
      <div>
        <h3 className="font-semibold text-red-800 text-sm sm:text-base">Shift Overtime Warning</h3>
        <p className="text-xs sm:text-sm text-red-700">
          Your shift is {minutes} minutes past the scheduled end time. Please
          end your shift as soon as possible.
        </p>
      </div>
    </div>
  );
}

