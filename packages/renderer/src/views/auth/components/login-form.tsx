import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

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
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const pin = formData.get("pin") as string;

    await onSubmit(username, pin, rememberMe);
  };

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm sm:text-base">Username</Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="Enter your username"
            className="h-10 sm:h-11 text-sm sm:text-base"
            autoComplete="username"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin" className="text-sm sm:text-base">PIN</Label>
          <div className="relative">
            <Input
              id="pin"
              name="pin"
              type={showPin ? "text" : "password"}
              placeholder="Enter your PIN"
              className="h-10 sm:h-11 pr-10 text-sm sm:text-base"
              maxLength={6}
              autoComplete="off"
              required
            />
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
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="text-muted-foreground">Remember me</span>
          </label>
          <Button variant="link" className="p-0 h-auto text-xs sm:text-sm">
            Forgot password?
          </Button>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium touch-manipulation"
            disabled={isLoading}
          >
            {isLoading ? (
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
    </>
  );
}
