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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/avatar-upload";
import { AdaptiveFormField } from "@/features/adaptive-keyboard/adaptive-form-field";
import { AdaptiveKeyboard } from "@/features/adaptive-keyboard/adaptive-keyboard";
import { useKeyboardWithRHF } from "@/shared/hooks";
import { cn } from "@/shared/utils/cn";
import {
  userCreateSchema,
  type UserCreateFormData,
} from "../../schemas/user-schema";
import { useAuth } from "@/shared/hooks/use-auth";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('add-user-form');

interface AddUserFormProps {
  onSubmit: (data: UserCreateFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  isOpen?: boolean; // Dialog open state to close keyboard when dialog closes
}

export function AddUserForm({
  onSubmit,
  onCancel,
  isLoading,
  isOpen = true,
}: AddUserFormProps) {
  const { user } = useAuth();

  const form = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
    mode: "onChange", // Enable real-time validation for better UX with keyboard
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "cashier",
      avatar: "",
      address: "",
      businessId: user?.businessId || "",
    },
  });

  // Keyboard integration hook
  const keyboard = useKeyboardWithRHF({
    setValue: form.setValue,
    watch: form.watch,
    fieldConfigs: {
      firstName: { keyboardMode: "qwerty" },
      lastName: { keyboardMode: "qwerty" },
      email: { keyboardMode: "qwerty" },
      address: { keyboardMode: "qwerty" },
      password: { keyboardMode: "qwerty" },
      confirmPassword: { keyboardMode: "qwerty" },
    },
  });

  // Close keyboard when dialog closes
  useEffect(() => {
    if (!isOpen) {
      keyboard.handleCloseKeyboard();
    }
  }, [isOpen, keyboard]);

  const handleSubmit = async (data: UserCreateFormData) => {
    logger.info("Add form submitted with data:", data);

    if (!user?.businessId) {
      form.setError("root", { message: "Business ID not found" });
      return;
    }

    const formData = {
      ...data,
      businessId: user.businessId,
    };

    try {
      await onSubmit(formData);
      // Close keyboard on successful submit
      keyboard.handleCloseKeyboard();
    } catch (error) {
      logger.error("Error in add form submit:", error);
      form.setError("root", {
        message: "Failed to create staff member. Please try again.",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, (errors) => {
          logger.error("Add form validation errors:", errors);
        })}
        className="space-y-4"
      >
        {/* Form Errors */}
        {form.formState.errors.root && (
          <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
            {form.formState.errors.root.message}
          </div>
        )}
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
            render={() => (
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
            render={() => (
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

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={() => (
            <FormItem>
              <FormControl>
                <AdaptiveFormField
                  {...form.register("email")}
                  label="Email *"
                  value={keyboard.formValues.email || ""}
                  error={form.formState.errors.email?.message}
                  onFocus={() => keyboard.handleFieldFocus("email")}
                  placeholder="john.smith@example.com"
                  className={cn(
                    "text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10",
                    keyboard.activeField === "email" &&
                      "ring-2 ring-primary border-primary"
                  )}
                  readOnly
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={() => (
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10">
                    <SelectValue />
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

        {/* Password Fields */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="password"
            render={() => (
              <FormItem>
                <FormControl>
                  <AdaptiveFormField
                    {...form.register("password")}
                    label="Password *"
                    type="password"
                    value={keyboard.formValues.password || ""}
                    error={form.formState.errors.password?.message}
                    onFocus={() => keyboard.handleFieldFocus("password")}
                    placeholder="Minimum 8 characters"
                    className={cn(
                      "text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10",
                      keyboard.activeField === "password" &&
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
            name="confirmPassword"
            render={() => (
              <FormItem>
                <FormControl>
                  <AdaptiveFormField
                    {...form.register("confirmPassword")}
                    label="Confirm Password *"
                    type="password"
                    value={keyboard.formValues.confirmPassword || ""}
                    error={form.formState.errors.confirmPassword?.message}
                    onFocus={() => keyboard.handleFieldFocus("confirmPassword")}
                    placeholder="Confirm password"
                    className={cn(
                      "text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10",
                      keyboard.activeField === "confirmPassword" &&
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
            {isLoading ? "Creating..." : "Create Staff Member"}
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
                if (keyboard.activeField === "confirmPassword") {
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
