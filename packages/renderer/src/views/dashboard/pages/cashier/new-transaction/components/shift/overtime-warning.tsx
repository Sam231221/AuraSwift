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
    <div className="bg-red-50 border-b-2 border-red-300 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <div>
          <h3 className="font-semibold text-red-800">Shift Overtime Warning</h3>
          <p className="text-sm text-red-700">
            Your shift is {minutes} minutes past the scheduled end time. Please
            end your shift as soon as possible.
          </p>
        </div>
      </div>
    </div>
  );
}

