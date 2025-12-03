/**
 * Start shift dialog component with adaptive keyboard integration
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { AdaptiveKeyboard } from "@/features/adaptive-keyboard/adaptive-keyboard";
import { useKeyboardWithRHF } from "@/features/adaptive-keyboard/hooks/use-keyboard-with-react-hook-form";
import { configuredZodResolver } from "@/shared/validation/resolvers";
import {
  startShiftSchema,
  type StartShiftFormData,
} from "@/features/sales/schemas/shift-schema";

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
  // Initialize form with React Hook Form and Zod validation
  const form = useForm<StartShiftFormData>({
    resolver: configuredZodResolver(startShiftSchema),
    defaultValues: {
      startingCash: "" as any, // Schema will coerce string to number
    },
    mode: "onChange",
  });

  // Initialize adaptive keyboard integration
  const keyboard = useKeyboardWithRHF({
    setValue: form.setValue,
    watch: form.watch,
    fieldConfigs: {
      startingCash: { keyboardMode: "numeric" },
    },
  });

  // Sync external startingCash prop with form
  useEffect(() => {
    form.setValue("startingCash", (startingCash || "") as any, {
      shouldValidate: true,
    });
  }, [startingCash, form]);

  // Sync form value back to parent component
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.startingCash !== undefined) {
        onStartingCashChange(String(value.startingCash));
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onStartingCashChange]);

  // Reset form and open keyboard when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ startingCash: "" as any });
      // Auto-open keyboard when dialog opens
      setTimeout(() => {
        keyboard.handleFieldFocus("startingCash");
      }, 100);
    } else {
      keyboard.handleCloseKeyboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = form.handleSubmit(() => {
    onConfirm();
    keyboard.handleCloseKeyboard();
  });

  const handleCancel = () => {
    onOpenChange(false);
    onStartingCashChange("");
    form.reset({ startingCash: "" as any });
    keyboard.handleCloseKeyboard();
  };

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
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3 sm:gap-4">
                <Label
                  htmlFor="starting-cash"
                  className="text-left sm:text-right text-sm sm:text-base"
                >
                  Starting Cash
                </Label>
                <div className="col-span-1 sm:col-span-3">
                  <Input
                    id="starting-cash"
                    type="text"
                    inputMode="none"
                    {...form.register("startingCash")}
                    onFocus={() => keyboard.handleFieldFocus("startingCash")}
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    placeholder="0.00"
                    autoComplete="off"
                    readOnly
                  />
                  {form.formState.errors.startingCash && (
                    <p className="text-xs text-red-600 mt-1">
                      {form.formState.errors.startingCash.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Adaptive Keyboard */}
            {keyboard.showKeyboard && (
              <div className="mt-4">
                <AdaptiveKeyboard
                  onInput={keyboard.handleInput}
                  onBackspace={keyboard.handleBackspace}
                  onClear={keyboard.handleClear}
                  onEnter={handleSubmit}
                  initialMode={
                    keyboard.activeFieldConfig?.keyboardMode || "numeric"
                  }
                  inputType="number"
                  visible={keyboard.showKeyboard}
                  onClose={keyboard.handleCloseKeyboard}
                />
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="w-full sm:w-auto min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                Start Shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
