/**
 * No Active Shift Modal Component
 * Displays when there's no scheduled shift or when shift has ended with no future shift
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface NoActiveShiftModalProps {
  shiftHasEnded: boolean;
  onLogout: () => void;
}

export function NoActiveShiftModal({
  shiftHasEnded,
  onLogout,
}: NoActiveShiftModalProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-6">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="text-center pb-4 px-4 sm:px-6">
          <div className="mx-auto mb-4 p-2 sm:p-3 bg-amber-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
          </div>
          <h2 className="text-xl sm:text-2xl text-slate-900 font-bold mb-2">
            No Active Shift
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 mb-4">
            {shiftHasEnded
              ? "Your shift has ended and no further shifts are scheduled. Please contact your manager or logout."
              : "You don't have any shift today."}
          </p>
          <Button
            onClick={onLogout}
            variant="outline"
            size="lg"
            className="min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

