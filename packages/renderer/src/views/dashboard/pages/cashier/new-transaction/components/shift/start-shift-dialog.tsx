/**
 * Start shift dialog component
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StartShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startingCash: string;
  onStartingCashChange: (value: string) => void;
  onConfirm: () => void;
  lateStartMinutes?: number;
  showLateStartConfirm?: boolean;
  onLateStartConfirm?: () => void;
  onLateStartCancel?: () => void;
}

export function StartShiftDialog({
  open,
  onOpenChange,
  startingCash,
  onStartingCashChange,
  onConfirm,
  lateStartMinutes,
  showLateStartConfirm = false,
  onLateStartConfirm,
  onLateStartCancel,
}: StartShiftDialogProps) {
  return (
    <>
      {/* Late Start Confirmation Dialog */}
      {lateStartMinutes !== undefined && lateStartMinutes > 0 && (
        <Dialog 
          open={showLateStartConfirm} 
          onOpenChange={(isOpen) => {
            if (!isOpen && onLateStartCancel) {
              onLateStartCancel();
            }
          }}
        >
          <DialogContent className="max-w-[calc(100vw-2rem)] mx-4 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Late Shift Start
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                You are{" "}
                {(() => {
                  const hours = Math.floor(lateStartMinutes / 60);
                  const minutes = lateStartMinutes % 60;

                  if (hours > 0) {
                    if (minutes === 0) {
                      return hours === 1 ? "1 hour" : `${hours} hours`;
                    } else {
                      return `${hours}h ${minutes}m`;
                    }
                  } else {
                    return `${lateStartMinutes} minutes`;
                  }
                })()}{" "}
                late for your scheduled shift.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-xs sm:text-sm">
              <p>
                Do you want to start your shift now and mark it as a late start?
              </p>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  if (onLateStartCancel) {
                    onLateStartCancel();
                  }
                }}
                className="w-full sm:w-auto min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (onLateStartConfirm) {
                    onLateStartConfirm();
                  }
                }}
                className="w-full sm:w-auto min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
              >
                Start Late
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Start Shift Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100vw-2rem)] mx-4 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Start Shift
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Enter the starting cash amount for your shift.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3 sm:gap-4">
              <Label
                htmlFor="starting-cash"
                className="text-left sm:text-right text-sm sm:text-base"
              >
                Starting Cash
              </Label>
              <Input
                id="starting-cash"
                type="number"
                step="0.01"
                value={startingCash}
                onChange={(e) => onStartingCashChange(e.target.value)}
                className="col-span-1 sm:col-span-3 h-10 sm:h-11 text-sm sm:text-base"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onStartingCashChange("");
              }}
              className="w-full sm:w-auto min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="w-full sm:w-auto min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
            >
              Start Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
