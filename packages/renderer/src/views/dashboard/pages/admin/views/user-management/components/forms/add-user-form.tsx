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
import { AvatarUpload } from "@/shared/components/avatar-upload";
import {
  userCreateSchema,
  type UserCreateFormData,
} from "../../schemas/user-schema";
import { useAuth } from "@/shared/hooks/use-auth";

interface AddUserFormProps {
  onSubmit: (data: UserCreateFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function AddUserForm({
  onSubmit,
  onCancel,
  isLoading,
}: AddUserFormProps) {
  const { user } = useAuth();

  const form = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
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

  const handleSubmit = async (data: UserCreateFormData) => {
    console.log("Add form submitted with data:", data);

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
    } catch (error) {
      console.error("Error in add form submit:", error);
      form.setError("root", {
        message: "Failed to create staff member. Please try again.",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, (errors) => {
          console.error("Add form validation errors:", errors);
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
              <FormLabel>Profile Picture (Optional)</FormLabel>
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
                <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                  First Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="John"
                    className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                    {...field}
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
                <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                  Last Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Smith"
                    className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                    {...field}
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
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                Email *
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john.smith@example.com"
                  className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                  {...field}
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
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                Address
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main Street, City, State"
                  className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                  {...field}
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
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                  Password *
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm md:text-base lg:text-base">
                  Confirm Password *
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-4">
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
            onClick={onCancel}
            className="flex-1 text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
