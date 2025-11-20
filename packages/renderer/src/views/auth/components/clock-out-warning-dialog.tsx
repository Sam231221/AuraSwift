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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              You're Still Clocked In
            </DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            <p className="text-sm text-gray-600 mb-3">
              You're currently clocked in since{" "}
              <span className="font-semibold">
                {formatTime(clockInTime)}
              </span>
              . Would you like to clock out before logging out?
            </p>
            <div className="bg-gray-50 rounded-lg p-3 flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Time tracking will continue</p>
                <p>
                  If you log out without clocking out, your time will continue
                  to be tracked until you clock out.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onLogoutOnly}
            className="w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout Only
          </Button>
          <Button
            onClick={onClockOutAndLogout}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
          >
            <Clock className="w-4 h-4 mr-2" />
            Clock Out & Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

