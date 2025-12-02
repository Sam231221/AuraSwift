/**
 * Schedule Validation Warning Component
 * Displays warnings when schedule validation fails but can proceed with approval
 */

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleValidationWarningProps {
  warnings: string[];
  requiresApproval: boolean;
  onDismiss?: () => void;
  onRequestApproval?: () => void;
}

export function ScheduleValidationWarning({
  warnings,
  requiresApproval,
  onDismiss,
  onRequestApproval,
}: ScheduleValidationWarningProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-yellow-50 border-b-2 border-yellow-300 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2 sm:gap-3 flex-1">
        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1">
          <p className="font-semibold text-yellow-900 text-sm sm:text-base">
            Schedule Validation Warning
          </p>
          <ul className="text-xs sm:text-sm text-yellow-700 mt-1 list-disc list-inside">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
          {requiresApproval && (
            <p className="text-xs sm:text-sm text-yellow-800 mt-2 font-medium">
              Manager approval may be required to proceed.
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        {onRequestApproval && requiresApproval && (
          <Button
            onClick={onRequestApproval}
            variant="outline"
            size="sm"
            className="bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-900"
          >
            Request Approval
          </Button>
        )}
        {onDismiss && (
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="text-yellow-700 hover:text-yellow-900"
          >
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}
