import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, LogOut } from "lucide-react";

interface ClockOutWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onClockOutAndLogout: () => void;
  onLogoutOnly: () => void;
  clockInTime?: string;
}

export function ClockOutWarningDialog({
  open,
  onClose,
  onClockOutAndLogout,
  onLogoutOnly,
  clockInTime,
}: ClockOutWarningDialogProps) {
  const formatTime = (timeString?: string) => {
    if (!timeString) return "unknown time";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] mx-4">
        <DialogHeader>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-semibold">
              You're Still Clocked In
            </DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            <span className="text-xs sm:text-sm text-gray-600 mb-3 block">
              You're currently clocked in since{" "}
              <span className="font-semibold">
                {formatTime(clockInTime)}
              </span>
              . Would you like to clock out before logging out?
            </span>
          </DialogDescription>
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3 flex items-start gap-2 mt-3">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mt-0.5 shrink-0" />
            <div className="text-[10px] sm:text-xs text-gray-600">
              <p className="font-medium mb-1">Time tracking will continue</p>
              <p>
                If you log out without clocking out, your time will continue
                to be tracked until you clock out.
              </p>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onLogoutOnly}
            className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Logout Only
          </Button>
          <Button
            onClick={onClockOutAndLogout}
            className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base bg-orange-600 hover:bg-orange-700 touch-manipulation"
          >
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Clock Out & Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

