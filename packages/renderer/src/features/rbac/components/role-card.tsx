import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Edit, Trash2, Lock } from "lucide-react";

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  permissions: string[];
  businessId: string;
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface RoleCardProps {
  role: Role;
  userCount?: number;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onViewUsers: (role: Role) => void;
  canEdit?: boolean;
}

export function RoleCard({
  role,
  userCount = 0,
  onEdit,
  onDelete,
  onViewUsers,
  canEdit = false,
}: RoleCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{role.displayName}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {role.name}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            {role.isSystemRole && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                System
              </Badge>
            )}
            <Badge variant={role.isActive ? "default" : "outline"}>
              {role.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {role.description && (
          <p className="text-sm text-muted-foreground">{role.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Permissions:</span>
            <Badge variant="outline">{role.permissions.length}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Users with role:</span>
            <Badge variant="outline">{userCount}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
          {role.permissions.slice(0, 5).map((permission) => (
            <Badge key={permission} variant="secondary" className="text-xs">
              {permission}
            </Badge>
          ))}
          {role.permissions.length > 5 && (
            <Badge variant="secondary" className="text-xs">
              +{role.permissions.length - 5} more
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onViewUsers(role);
          }}
        >
          <Users className="h-4 w-4 mr-1" />
          Users
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(role);
          }}
          disabled={!canEdit}
          title={
            !canEdit
              ? "Only administrators can edit roles"
              : role.isSystemRole
              ? "System roles have limited editing"
              : "Edit role"
          }
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(role);
          }}
          disabled={role.isSystemRole}
          className="text-destructive hover:text-destructive"
          title={
            role.isSystemRole ? "Cannot delete system roles" : "Delete role"
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
