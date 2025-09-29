import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Shield } from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import { AuthHeroSection } from "@/features/auth/components/auth-hero-section";
import { LoginForm } from "@/features/auth/components/login-form";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function AuthPage() {
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const { login, registerBusiness, isLoading } = useAuth();

  const handleLoginSubmit = async (
    email: string,
    password: string,
    rememberMe: boolean
  ) => {
    setLoginError("");
    const result = await login(email, password, rememberMe);
    if (!result.success) {
      setLoginError(result.message);
    }
  };

  const handleRegisterSubmit = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    avatar?: string;
    businessAvatar?: string;
  }) => {
    setRegisterError("");
    setRegisterSuccess("");

    const result = await registerBusiness(userData);
    if (result.success) {
      setRegisterSuccess(
        "Account created successfully! You are now logged in."
      );
    } else {
      setRegisterError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Hero Section */}
      <AuthHeroSection />

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AuraSwift</h1>
              <p className="text-xs text-muted-foreground">
                Point of Sale System
              </p>
            </div>
          </div>

          {/* Auth Card */}
          <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs font-medium">
                  <Shield className="w-3 h-3 mr-1" />
                  Secure Access
                </Badge>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-balance">
                  {"Welcome back to your store"}
                </CardTitle>
                <CardDescription className="text-pretty mt-2">
                  {
                    "Sign in to access your POS dashboard and manage your business operations"
                  }
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">
                  Demo Credentials:
                </h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    <strong>Admin:</strong> admin@store.com
                  </p>
                  <p className="text-xs mt-1">Password: admin123</p>
                  <p className="text-xs mt-2 text-muted-foreground">
                    Or create a new account using the Register tab
                  </p>
                </div>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <LoginForm
                    onSubmit={handleLoginSubmit}
                    error={loginError}
                    isLoading={isLoading}
                  />
                </TabsContent>

                <TabsContent value="register">
                  <RegisterForm
                    onSubmit={handleRegisterSubmit}
                    error={registerError}
                    success={registerSuccess}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  {"By signing in, you agree to our "}
                  <Button variant="link" className="p-0 h-auto text-xs">
                    Terms of Service
                  </Button>
                  {" and "}
                  <Button variant="link" className="p-0 h-auto text-xs">
                    Privacy Policy
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {"Need help? "}
              <Button variant="link" className="p-0 h-auto text-sm">
                Contact Support
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
