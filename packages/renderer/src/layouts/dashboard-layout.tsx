import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Bell, Settings } from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import { getRoleDisplayName, getUserDisplayName } from "@/shared/utils/auth";
import { UserAvatar, BusinessAvatar } from "@/shared/components/user-avatar";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const { user, logout, isLoading } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <BusinessAvatar
                business={{ name: user.businessName }}
                size="lg"
              />
              <div>
                <h1 className="text-xl font-bold">{user.businessName}</h1>
                <p className="text-xs text-muted-foreground">
                  Point of Sale System
                </p>
              </div>
            </div>
            <div className="hidden md:block h-6 w-px bg-border" />
            <div className="hidden md:block">
              <h2 className="font-semibold">{title}</h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3 pl-3 border-l">
              <div className="flex items-center gap-2">
                <UserAvatar
                  user={{
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                  }}
                  size="md"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">
                    {getUserDisplayName(user)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {getRoleDisplayName(user.role)}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}
