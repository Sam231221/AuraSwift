import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Clock } from "lucide-react";
import { format } from "date-fns";

interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: number;
  expiresAt: number | null;
  isActive: boolean;
  role?: {
    id: string;
    name: string;
    displayName: string;
    permissions: string[];
  };
}

interface UserRolesListProps {
  userRoles: UserRole[];
  onRevoke: (userId: string, roleId: string) => void;
  isRevoking?: boolean;
  currentUserId?: string;
}

export function UserRolesList({
  userRoles,
  onRevoke,
  isRevoking = false,
}: UserRolesListProps) {
  if (userRoles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">No Roles Assigned</CardTitle>
          <CardDescription>
            This user doesn't have any roles assigned yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {userRoles.map((userRole) => (
        <Card key={userRole.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  {userRole.role?.displayName || "Unknown Role"}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {userRole.role?.name || "N/A"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {userRole.expiresAt && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Expires {format(new Date(userRole.expiresAt), "PP")}
                  </Badge>
                )}
                <Badge variant={userRole.isActive ? "default" : "outline"}>
                  {userRole.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Assigned on {format(new Date(userRole.assignedAt), "PPP")}
            </div>

            {userRole.role && userRole.role.permissions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Permissions ({userRole.role.permissions.length}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {userRole.role.permissions.map((permission) => (
                    <Badge
                      key={permission}
                      variant="secondary"
                      className="text-xs"
                    >
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => onRevoke(userRole.userId, userRole.roleId)}
              disabled={isRevoking}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isRevoking ? "Revoking..." : "Revoke Role"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
