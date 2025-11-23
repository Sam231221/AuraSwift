import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { AvatarUpload } from "@/shared/components/avatar-upload";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRegisterForm } from "../hooks/use-register-form";

interface RegisterFormProps {
  onSubmit: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    avatar?: string;
    businessAvatar?: string;
  }) => Promise<void>;
  error: string;
  success: string;
  isLoading: boolean;
}

export function RegisterForm({
  onSubmit,
  error,
  success,
  isLoading,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [businessAvatar, setBusinessAvatar] = useState<string | null>(null);

  const { form, handleSubmit, isSubmitting } = useRegisterForm({
    onSubmit: async (data) => {
      await onSubmit({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        avatar: data.avatar || undefined,
        businessAvatar: data.businessAvatar || undefined,
      });
    },
  });

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">
                    First Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John"
                      className="h-10 sm:h-11 text-sm sm:text-base"
                      disabled={isSubmitting || isLoading}
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
                  <FormLabel className="text-sm sm:text-base">
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Doe"
                      className="h-10 sm:h-11 text-sm sm:text-base"
                      disabled={isSubmitting || isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">
                  Business Name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Your Store Name"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    disabled={isSubmitting || isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3 sm:space-y-4">
            <AvatarUpload
              value={businessAvatar || undefined}
              onChange={setBusinessAvatar}
              type="business"
              label="Business Logo (Optional)"
              size="md"
              disabled={isSubmitting || isLoading}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="store@example.com"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    disabled={isSubmitting || isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="h-10 sm:h-11 pr-10 text-sm sm:text-base"
                      disabled={isSubmitting || isLoading}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <FormDescription className="text-[10px] sm:text-xs">
                  Password must be at least 8 characters with uppercase,
                  lowercase, number, and special character.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium touch-manipulation"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                />
              ) : (
                "Create Account"
              )}
            </Button>
          </motion.div>
        </form>
      </Form>
    </>
  );
}
