import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useLoginForm } from "../hooks/use-login-form";

interface LoginFormProps {
  onSubmit: (
    username: string,
    pin: string,
    rememberMe: boolean
  ) => Promise<void>;
  error: string;
  isLoading: boolean;
}

export function LoginForm({ onSubmit, error, isLoading }: LoginFormProps) {
  const [showPin, setShowPin] = useState(false);

  const { form, handleSubmit, isSubmitting } = useLoginForm({
    onSubmit: async (data) => {
      await onSubmit(data.username, data.pin, data.rememberMe);
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

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">Username</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Enter your username"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    autoComplete="username"
                    disabled={isSubmitting || isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pin"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm sm:text-base">PIN</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={showPin ? "text" : "password"}
                      placeholder="Enter your PIN"
                      className="h-10 sm:h-11 pr-10 text-sm sm:text-base"
                      maxLength={6}
                      autoComplete="off"
                      disabled={isSubmitting || isLoading}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting || isLoading}
                      />
                    </FormControl>
                    <FormLabel className="text-muted-foreground cursor-pointer">
                      Remember me
                    </FormLabel>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs sm:text-sm"
                  >
                    Forgot password?
                  </Button>
                </div>
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
                "Sign In"
              )}
            </Button>
          </motion.div>
        </form>
      </Form>
    </>
  );
}
