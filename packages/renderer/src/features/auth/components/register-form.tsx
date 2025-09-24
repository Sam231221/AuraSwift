import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { AvatarUpload } from "@/shared/components/avatar-upload";

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
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [businessAvatar, setBusinessAvatar] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const userData = {
      email: formData.get("registerEmail") as string,
      password: formData.get("registerPassword") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      businessName: formData.get("businessName") as string,
      avatar: userAvatar || undefined,
      businessAvatar: businessAvatar || undefined,
    };

    await onSubmit(userData);
  };

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="John"
              className="h-11"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Doe"
              className="h-11"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            name="businessName"
            placeholder="Your Store Name"
            className="h-11"
            required
          />
        </div>

        <div className="space-y-4">
          <AvatarUpload
            value={businessAvatar || undefined}
            onChange={setBusinessAvatar}
            type="business"
            label="Business Logo (Optional)"
            size="md"
            disabled={isLoading}
          />

          <AvatarUpload
            value={userAvatar || undefined}
            onChange={setUserAvatar}
            type="user"
            label="Your Profile Photo (Optional)"
            size="md"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registerEmail">Email Address</Label>
          <Input
            id="registerEmail"
            name="registerEmail"
            type="email"
            placeholder="store@example.com"
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registerPassword">Password</Label>
          <div className="relative">
            <Input
              id="registerPassword"
              name="registerPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="h-11 pr-10"
              required
            />
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
          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters with uppercase, lowercase,
            number, and special character.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="w-full h-11 text-base font-medium"
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
              "Create Account"
            )}
          </Button>
        </motion.div>
      </form>
    </>
  );
}
