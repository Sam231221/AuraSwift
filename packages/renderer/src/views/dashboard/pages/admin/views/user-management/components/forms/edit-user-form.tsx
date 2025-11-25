import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/shared/components/avatar-upload";
import { AdaptiveFormField } from "@/components/adaptive-keyboard/adaptive-form-field";
import { AdaptiveKeyboard } from "@/components/adaptive-keyboard/adaptive-keyboard";
import { useKeyboardWithRHF } from "@/shared/hooks";
import { cn } from "@/shared/utils/cn";
import {
  userUpdateSchema,
  type UserUpdateFormData,
} from "../../schemas/user-schema";
import type { StaffUser } from "../../schemas/types";

interface EditUserFormProps {
  user: StaffUser;
  onSubmit: (data: UserUpdateFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  isOpen?: boolean; // Dialog open state to close keyboard when dialog closes
}

export function EditUserForm({
  user,
  onSubmit,
  onCancel,
  isLoading,
  isOpen = true,
}: EditUserFormProps) {
  const form = useForm<UserUpdateFormData>({
    resolver: zodResolver(userUpdateSchema),
    mode: "onChange", // Enable real-time validation for better UX with keyboard
    defaultValues: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar || "",
      address: user.address || "",
      isActive: user.isActive,
      businessId: user.businessId,
    },
  });

  // Keyboard integration hook
  const keyboard = useKeyboardWithRHF({
    setValue: form.setValue,
    watch: form.watch,
    fieldConfigs: {
      firstName: { keyboardMode: "qwerty" },
      lastName: { keyboardMode: "qwerty" },
      address: { keyboardMode: "qwerty" },
    },
  });

  // Close keyboard when dialog closes
  useEffect(() => {
    if (!isOpen) {
      keyboard.handleCloseKeyboard();
    }
  }, [isOpen, keyboard]);

  // Update form when user changes
  useEffect(() => {
    console.log("Setting form values for user:", {
      id: user.id,
      businessId: user.businessId,
      firstName: user.firstName,
    });
    form.reset({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar || "",
      address: user.address || "",
      isActive: user.isActive,
      businessId: user.businessId,
    });
  }, [user, form]);

  const handleSubmit = async (data: UserUpdateFormData) => {
    console.log("Edit form submitted with data:", data);
    console.log("ID value:", data.id, "Type:", typeof data.id);
    console.log(
      "BusinessId value:",
      data.businessId,
      "Type:",
      typeof data.businessId
    );

    // Ensure id and businessId are strings and not empty
    if (!data.id || typeof data.id !== "string") {
      console.error("Invalid id value:", data.id);
      form.setError("id", { message: "Invalid user ID" });
      return;
    }
    if (!data.businessId || typeof data.businessId !== "string") {
      console.error("Invalid businessId value:", data.businessId);
      form.setError("businessId", { message: "Invalid business ID" });
      return;
    }

    try {
      await onSubmit(data);
      // Close keyboard on successful submit
      keyboard.handleCloseKeyboard();
    } catch (error) {
      console.error("Error submitting form:", error);
      form.setError("root", {
        message: "Failed to update staff member. Please try again.",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, (errors) => {
          console.error("Form validation errors:", errors);
          // Show first error message
          const firstError = Object.values(errors)[0];
          if (firstError?.message) {
            // Error will be shown by FormMessage components
          }
        })}
        className="space-y-4"
      >
        {/* Form Errors */}
        {form.formState.errors.root && (
          <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Hidden fields for id and businessId - required for validation but not displayed */}
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => <input type="hidden" {...field} />}
        />
        <FormField
          control={form.control}
          name="businessId"
          render={({ field }) => <input type="hidden" {...field} />}
        />

        {/* Avatar Upload */}
        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <AvatarUpload
                  label="Profile Picture (Optional)"
                  value={field.value}
                  onChange={field.onChange}
                  type="user"
                  size="md"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>

                <FormControl>
                  <AdaptiveFormField
                    {...form.register("firstName")}
                    label="First Name *"
                    value={keyboard.formValues.firstName || ""}
                    error={form.formState.errors.firstName?.message}
                    onFocus={() => keyboard.handleFieldFocus("firstName")}
                    placeholder="John"
                    className={cn(
                      "text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10",
                      keyboard.activeField === "firstName" &&
                        "ring-2 ring-primary border-primary"
                    )}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <AdaptiveFormField
                    {...form.register("lastName")}
                    label="Last Name *"
                    value={keyboard.formValues.lastName || ""}
                    error={form.formState.errors.lastName?.message}
                    onFocus={() => keyboard.handleFieldFocus("lastName")}
                    placeholder="Smith"
                    className={cn(
                      "text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10",
                      keyboard.activeField === "lastName" &&
                        "ring-2 ring-primary border-primary"
                    )}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email (Read-only) */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  disabled
                  className="bg-gray-50 text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                  {...field}
                />
              </FormControl>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500">
                Email cannot be changed
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <AdaptiveFormField
                  {...form.register("address")}
                  label="Address"
                  value={keyboard.formValues.address || ""}
                  error={form.formState.errors.address?.message}
                  onFocus={() => keyboard.handleFieldFocus("address")}
                  placeholder="123 Main Street, City, State"
                  className={cn(
                    "text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10",
                    keyboard.activeField === "address" &&
                      "ring-2 ring-primary border-primary"
                  )}
                  readOnly
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                Role *
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || "cashier"}
              >
                <FormControl>
                  <SelectTrigger className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cashier">
                    <div className="flex flex-col items-start">
                      <span className="text-xs sm:text-sm md:text-base lg:text-base">
                        Cashier
                      </span>
                      <span className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500">
                        Process sales and view basic reports
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex flex-col items-start">
                      <span className="text-xs sm:text-sm md:text-base lg:text-base">
                        Manager
                      </span>
                      <span className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500">
                        Full sales management and inventory control
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                Status
              </FormLabel>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="rounded"
                />
                <Label
                  htmlFor="editIsActive"
                  className="text-xs sm:text-sm md:text-base lg:text-base"
                >
                  Active (user can log in)
                </Label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div
          className={cn(
            "flex flex-col sm:flex-row gap-2 sm:gap-2 pt-4",
            keyboard.showKeyboard && "pb-[340px]"
          )}
        >
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
          >
            {isLoading ? "Updating..." : "Update Staff Member"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              keyboard.handleCloseKeyboard();
              onCancel();
            }}
            className="flex-1 text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
          >
            Cancel
          </Button>
        </div>

        {/* Adaptive Keyboard - Positioned at bottom of form */}
        {keyboard.showKeyboard && (
          <div className="sticky bottom-0 left-0 right-0 z-50 mt-4 bg-background">
            <AdaptiveKeyboard
              onInput={keyboard.handleInput}
              onBackspace={keyboard.handleBackspace}
              onClear={keyboard.handleClear}
              onEnter={() => {
                // Move to next field or submit if last field
                if (keyboard.activeField === "address") {
                  form.handleSubmit(handleSubmit)();
                }
              }}
              initialMode={keyboard.activeFieldConfig?.keyboardMode || "qwerty"}
              visible={keyboard.showKeyboard}
              onClose={keyboard.handleCloseKeyboard}
            />
          </div>
        )}
      </form>
    </Form>
  );
}
