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
import { AdaptiveTextarea } from "@/features/adaptive-keyboard/adaptive-textarea";
import { AdaptiveKeyboard } from "@/features/adaptive-keyboard/adaptive-keyboard";
import { useKeyboardWithRHF } from "@/features/adaptive-keyboard/hooks/use-keyboard-with-react-hook-form";
import type { KeyboardMode } from "@/features/adaptive-keyboard/keyboard-layouts";

const logger = getLogger("business-form");

interface BusinessFormData {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  country: string;
  city: string;
  postalCode: string;
  vatNumber: string;
  businessType: "retail" | "restaurant" | "service" | "wholesale" | "other";
  currency: string;
  timezone: string;
}

const BUSINESS_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "restaurant", label: "Restaurant" },
  { value: "service", label: "Service" },
  { value: "wholesale", label: "Wholesale" },
  { value: "other", label: "Other" },
] as const;

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
] as const;

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Chicago", label: "America/Chicago (CST)" },
  { value: "America/Denver", label: "America/Denver (MST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
] as const;

interface BusinessFormProps {
  onCancel?: () => void;
}

export function BusinessForm({ onCancel }: BusinessFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<BusinessFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      businessName: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      country: "",
      city: "",
      postalCode: "",
      vatNumber: "",
      businessType: "retail",
      currency: "USD",
      timezone: "UTC",
    },
    mode: "onChange",
  });

  // Configure keyboard modes for different field types
  const fieldConfigs: Partial<
    Record<keyof BusinessFormData, { keyboardMode?: KeyboardMode }>
  > = {
    email: { keyboardMode: "qwerty" },
    phone: { keyboardMode: "numeric" },
    postalCode: { keyboardMode: "numeric" },
    vatNumber: { keyboardMode: "qwerty" },
    website: { keyboardMode: "qwerty" },
  };

  const keyboard = useKeyboardWithRHF({
    setValue: form.setValue,
    watch: form.watch,
    fieldConfigs,
  });

  // Load session token and business data on mount
  useEffect(() => {
    const loadBusiness = async () => {
      // Get session token from authStore
      const token = await window.authStore.get("token");
      if (!token) {
        logger.warn("No session token found");
        setIsLoading(false);
        return;
      }

      if (!user?.businessId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        logger.info("Loading business data for:", user.businessId);
        const response = await window.authAPI.getBusinessById(
          token,
          user.businessId
        );

        logger.info("Business API response:", response);

        if (response.success && response.business) {
          const business = response.business;
          logger.info("Loading business data:", business);

          // Handle null/undefined values properly
          const formData: BusinessFormData = {
            firstName: business.firstName ?? "",
            lastName: business.lastName ?? "",
            businessName: business.businessName ?? "",
            email: business.email ?? "",
            phone: business.phone ?? "",
            website: business.website ?? "",
            address: business.address ?? "",
            country: business.country ?? "",
            city: business.city ?? "",
            postalCode: business.postalCode ?? "",
            vatNumber: business.vatNumber ?? "",
            businessType:
              (business.businessType as BusinessFormData["businessType"]) ??
              "retail",
            currency: business.currency ?? "USD",
            timezone: business.timezone ?? "UTC",
          };

          logger.info("Setting form data:", formData);
          form.reset(formData);
        } else {
          logger.warn("Failed to load business data:", response);
          // Keep default values if business not found
        }
      } catch (error) {
        logger.error("Error loading business:", error);
        toast.error("Failed to load business information");
      } finally {
        setIsLoading(false);
      }
    };

    loadBusiness();
  }, [form, user?.businessId]);

  const onSubmit = async (data: BusinessFormData) => {
    if (!user?.businessId) {
      toast.error("Business ID not found");
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

      logger.info("Submitting business update:", {
        businessId: user.businessId,
        data,
        fieldCount: Object.keys(data).length,
      });

      const response = await window.businessAPI.update(
        token,
        user.businessId,
        data
      );

      logger.info("Business update response:", response);

      if (!response.success) {
        throw new Error(response.message || "Failed to update business");
      }

      // Reload business data to show updated values
      const reloadResponse = await window.authAPI.getBusinessById(
        token,
        user.businessId
      );

      if (reloadResponse.success && reloadResponse.business) {
        const business = reloadResponse.business;
        form.reset({
          firstName: business.firstName ?? "",
          lastName: business.lastName ?? "",
          businessName: business.businessName ?? "",
          email: business.email ?? "",
          phone: business.phone ?? "",
          website: business.website ?? "",
          address: business.address ?? "",
          country: business.country ?? "",
          city: business.city ?? "",
          postalCode: business.postalCode ?? "",
          vatNumber: business.vatNumber ?? "",
          businessType:
            (business.businessType as BusinessFormData["businessType"]) ??
            "retail",
          currency: business.currency ?? "USD",
          timezone: business.timezone ?? "UTC",
        });
      }

      toast.success("Business information updated successfully");
    } catch (error) {
      logger.error("Error saving business:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update business information"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Show form even while loading - data will populate when ready
  // This ensures users see the form structure immediately

  const activeInputType =
    keyboard.activeField === "email"
      ? "email"
      : keyboard.activeField === "phone" ||
        keyboard.activeField === "postalCode"
      ? "tel"
      : "text";

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading business information...</span>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Business Name */}
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <AdaptiveFormField
                  label="Business Name"
                  id="businessName"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                  onFocus={() => keyboard.handleFieldFocus("businessName")}
                  error={form.formState.errors.businessName?.message}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Owner Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <AdaptiveFormField
                    label="First Name"
                    id="firstName"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    onFocus={() => keyboard.handleFieldFocus("firstName")}
                    error={form.formState.errors.firstName?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <AdaptiveFormField
                    label="Last Name"
                    id="lastName"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    onFocus={() => keyboard.handleFieldFocus("lastName")}
                    error={form.formState.errors.lastName?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <AdaptiveFormField
                    label="Email"
                    id="email"
                    type="email"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    onFocus={() => keyboard.handleFieldFocus("email")}
                    error={form.formState.errors.email?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <AdaptiveFormField
                    label="Phone"
                    id="phone"
                    type="tel"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    onFocus={() => keyboard.handleFieldFocus("phone")}
                    error={form.formState.errors.phone?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <AdaptiveFormField
                  label="Website"
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                  onFocus={() => keyboard.handleFieldFocus("website")}
                  error={form.formState.errors.website?.message}
                />
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
                <AdaptiveTextarea
                  label="Address"
                  id="address"
                  rows={2}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                  onFocus={() => keyboard.handleFieldFocus("address")}
                  error={form.formState.errors.address?.message}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <AdaptiveFormField
                    label="Country"
                    id="country"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    onFocus={() => keyboard.handleFieldFocus("country")}
                    error={form.formState.errors.country?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <AdaptiveFormField
                    label="City"
                    id="city"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    onFocus={() => keyboard.handleFieldFocus("city")}
                    error={form.formState.errors.city?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <AdaptiveFormField
                    label="Postal Code"
                    id="postalCode"
                    type="tel"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    onFocus={() => keyboard.handleFieldFocus("postalCode")}
                    error={form.formState.errors.postalCode?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Business Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="vatNumber"
              render={({ field }) => (
                <FormItem>
                  <AdaptiveFormField
                    label="VAT Number"
                    id="vatNumber"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    onFocus={() => keyboard.handleFieldFocus("vatNumber")}
                    error={form.formState.errors.vatNumber?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
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
          </div>

          {/* Currency and Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
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
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Business Information"}
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
              const fields: (keyof BusinessFormData)[] = [
                "businessName",
                "firstName",
                "lastName",
                "email",
                "phone",
                "website",
                "address",
                "country",
                "city",
                "postalCode",
                "vatNumber",
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
              const fields: (keyof BusinessFormData)[] = [
                "businessName",
                "firstName",
                "lastName",
                "email",
                "phone",
                "website",
                "address",
                "country",
                "city",
                "postalCode",
                "vatNumber",
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
              (activeInputType === "email" || activeInputType === "tel"
                ? "qwerty"
                : "qwerty")
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
