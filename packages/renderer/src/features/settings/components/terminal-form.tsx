import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getLogger } from "@/shared/utils/logger";
import { useAuth } from "@/shared/hooks/use-auth";
import { AdaptiveFormField } from "@/features/adaptive-keyboard/adaptive-form-field";
import { AdaptiveKeyboard } from "@/features/adaptive-keyboard/adaptive-keyboard";
import { useKeyboardWithRHF } from "@/features/adaptive-keyboard/hooks/use-keyboard-with-react-hook-form";
import type { KeyboardMode } from "@/features/adaptive-keyboard/keyboard-layouts";
import type { Terminal } from "@/types/api/terminals";

const logger = getLogger("terminal-form");

interface TerminalFormData {
  name: string;
  type: "pos" | "kiosk" | "handheld" | "kitchen_display" | "server";
  status: "active" | "inactive" | "maintenance" | "decommissioned";
  ipAddress: string;
  macAddress: string;
}

const TERMINAL_TYPES = [
  { value: "pos", label: "POS Terminal" },
  { value: "kiosk", label: "Kiosk" },
  { value: "handheld", label: "Handheld Device" },
  { value: "kitchen_display", label: "Kitchen Display" },
  { value: "server", label: "Server" },
] as const;

const TERMINAL_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "maintenance", label: "Maintenance" },
  { value: "decommissioned", label: "Decommissioned" },
] as const;

interface TerminalFormProps {
  terminal: Terminal | null;
  onCancel?: () => void;
  onUpdate?: (terminal: Terminal) => void;
}

export function TerminalForm({
  terminal,
  onCancel,
  onUpdate,
}: TerminalFormProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TerminalFormData>({
    defaultValues: {
      name: "",
      type: "pos",
      status: "active",
      ipAddress: "",
      macAddress: "",
    },
    mode: "onChange",
  });

  // Configure keyboard modes for different field types
  const fieldConfigs: Partial<
    Record<keyof TerminalFormData, { keyboardMode?: KeyboardMode }>
  > = {
    ipAddress: { keyboardMode: "numeric" },
    macAddress: { keyboardMode: "qwerty" },
  };

  const keyboard = useKeyboardWithRHF({
    setValue: form.setValue,
    watch: form.watch,
    fieldConfigs,
  });

  // Load terminal data when terminal prop changes
  useEffect(() => {
    if (terminal) {
      logger.info("Loading terminal data:", terminal);
      form.reset({
        name: terminal.name ?? "",
        type: terminal.type ?? "pos",
        status: terminal.status ?? "active",
        ipAddress: terminal.ip_address ?? "",
        macAddress: terminal.mac_address ?? "",
      });
    } else {
      form.reset({
        name: "",
        type: "pos",
        status: "active",
        ipAddress: "",
        macAddress: "",
      });
    }
  }, [terminal, form]);

  const onSubmit = async (data: TerminalFormData) => {
    if (!user?.businessId || !terminal) {
      toast.error("Business ID or terminal not found");
      return;
    }

    // Get session token
    const token = await window.authStore.get("token");
    if (!token) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    try {
      setIsSaving(true);

      logger.info("Submitting terminal update:", {
        terminalId: terminal.id,
        data,
        fieldCount: Object.keys(data).length,
      });

      const response = await window.terminalsAPI.update(token, terminal.id, {
        name: data.name,
        type: data.type,
        status: data.status,
        ipAddress: data.ipAddress || undefined,
        macAddress: data.macAddress || undefined,
      });

      logger.info("Terminal update response:", response);

      if (!response.success) {
        throw new Error(response.message || "Failed to update terminal");
      }

      // Reload terminal data to show updated values
      const reloadResponse = await window.terminalsAPI.getById(
        token,
        terminal.id
      );

      if (reloadResponse.success && reloadResponse.terminal) {
        const updatedTerminal = reloadResponse.terminal;
        form.reset({
          name: updatedTerminal.name ?? "",
          type: updatedTerminal.type ?? "pos",
          status: updatedTerminal.status ?? "active",
          ipAddress: updatedTerminal.ip_address ?? "",
          macAddress: updatedTerminal.mac_address ?? "",
        });
        // Notify parent component of update
        if (onUpdate) {
          onUpdate(updatedTerminal);
        }
      }

      toast.success("Terminal information updated successfully");
    } catch (error) {
      logger.error("Error saving terminal:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update terminal information"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const activeInputType = keyboard.activeField === "ipAddress" ? "tel" : "text";

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Terminal Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <AdaptiveFormField
                  label="Terminal Name"
                  id="name"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                  onFocus={() => keyboard.handleFieldFocus("name")}
                  error={form.formState.errors.name?.message}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Terminal Type and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terminal Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select terminal type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TERMINAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TERMINAL_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* IP Address and MAC Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ipAddress"
              render={({ field }) => (
                <FormItem>
                  <AdaptiveFormField
                    label="IP Address"
                    id="ipAddress"
                    type="tel"
                    placeholder="192.168.1.100"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    onFocus={() => keyboard.handleFieldFocus("ipAddress")}
                    error={form.formState.errors.ipAddress?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="macAddress"
              render={({ field }) => (
                <FormItem>
                  <AdaptiveFormField
                    label="MAC Address"
                    id="macAddress"
                    placeholder="00:1B:44:11:3A:B7"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    onFocus={() => keyboard.handleFieldFocus("macAddress")}
                    error={form.formState.errors.macAddress?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSaving || !terminal}>
              {isSaving ? "Saving..." : "Save Terminal Information"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Adaptive Keyboard */}
      {keyboard.showKeyboard && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
          <AdaptiveKeyboard
            onInput={keyboard.handleInput}
            onBackspace={keyboard.handleBackspace}
            onClear={keyboard.handleClear}
            onEnter={() => {
              // Move to next field or submit if last field
              const fields: (keyof TerminalFormData)[] = [
                "name",
                "ipAddress",
                "macAddress",
              ];
              const currentIndex = fields.findIndex(
                (f) => f === keyboard.activeField
              );
              if (currentIndex < fields.length - 1) {
                keyboard.handleFieldFocus(fields[currentIndex + 1]);
              } else {
                form.handleSubmit(onSubmit)();
              }
            }}
            onTab={() => {
              // Same as enter for tab navigation
              const fields: (keyof TerminalFormData)[] = [
                "name",
                "ipAddress",
                "macAddress",
              ];
              const currentIndex = fields.findIndex(
                (f) => f === keyboard.activeField
              );
              if (currentIndex < fields.length - 1) {
                keyboard.handleFieldFocus(fields[currentIndex + 1]);
              }
            }}
            initialMode={
              keyboard.activeFieldConfig?.keyboardMode ||
              (activeInputType === "tel" ? "numeric" : "qwerty")
            }
            inputType={activeInputType}
            onClose={keyboard.handleCloseKeyboard}
            visible={keyboard.showKeyboard}
          />
        </div>
      )}
    </div>
  );
}
