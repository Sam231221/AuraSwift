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
}

export function StartShiftDialog({
  open,
  onOpenChange,
  startingCash,
  onStartingCashChange,
  onConfirm,
  lateStartMinutes,
}: StartShiftDialogProps) {
  return (
    <>
      {/* Late Start Confirmation Dialog */}
      {lateStartMinutes !== undefined && lateStartMinutes > 0 && (
        <Dialog open={false} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Late Shift Start</DialogTitle>
              <DialogDescription>
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
            <div className="py-4">
              <p>
                Do you want to start your shift now and mark it as a late start?
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={onConfirm}>Start Late</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Start Shift Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Shift</DialogTitle>
            <DialogDescription>
              Enter the starting cash amount for your shift.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="starting-cash" className="text-right">
                Starting Cash
              </Label>
              <Input
                id="starting-cash"
                type="number"
                step="0.01"
                value={startingCash}
                onChange={(e) => onStartingCashChange(e.target.value)}
                className="col-span-3"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onStartingCashChange("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={onConfirm}>Start Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

