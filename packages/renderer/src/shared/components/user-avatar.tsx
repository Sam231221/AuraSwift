import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Building2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface UserAvatarProps {
  user?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

interface BusinessAvatarProps {
  business?: {
    name?: string;
    avatar?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeConfig = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

const iconSizeConfig = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const getInitials = () => {
    if (!user?.firstName && !user?.lastName) return "U";
    return `${user?.firstName?.[0] || ""}${
      user?.lastName?.[0] || ""
    }`.toUpperCase();
  };

  return (
    <Avatar className={cn(sizeConfig[size], className)}>
      <AvatarImage
        src={user?.avatar}
        alt={
          `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User"
        }
      />
      <AvatarFallback className="bg-primary/10 text-primary">
        {user?.avatar ? (
          getInitials()
        ) : (
          <User className={iconSizeConfig[size]} />
        )}
      </AvatarFallback>
    </Avatar>
  );
}

export function BusinessAvatar({
  business,
  size = "md",
  className,
}: BusinessAvatarProps) {
  const getInitials = () => {
    if (!business?.name) return "B";
    return business.name
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Avatar className={cn(sizeConfig[size], className)}>
      <AvatarImage src={business?.avatar} alt={business?.name || "Business"} />
      <AvatarFallback className="bg-blue-100 text-blue-600">
        {business?.avatar ? (
          getInitials()
        ) : (
          <Building2 className={iconSizeConfig[size]} />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
