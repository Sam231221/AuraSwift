import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, User as UserIcon, Mail, Building2 } from "lucide-react";
import { useUsersByRole } from "../hooks/useRoles";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("view-role-users-dialog");

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
}

interface User {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  businessName: string;
  isActive: boolean;
}

interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: number;
  isActive: boolean;
  user: User;
}

interface ViewRoleUsersDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewRoleUsersDialog({
  role,
  open,
  onOpenChange,
}: ViewRoleUsersDialogProps) {
  const { getUsersByRole, isLoading, error } = useUsersByRole();
  const [users, setUsers] = useState<UserRole[]>([]);

  useEffect(() => {
    if (open && role) {
      loadUsers();
    } else {
      setUsers([]);
    }
  }, [open, role]);

  const loadUsers = async () => {
    if (!role) return;

    logger.info("[ViewRoleUsersDialog] Loading users for role:", role.id);
    const result = await getUsersByRole(role.id);
    if (result) {
      setUsers(result as UserRole[]);
    }
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users with Role: {role.displayName}
          </DialogTitle>
          <DialogDescription>
            {role.description || `Users assigned to the "${role.name}" role`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadUsers}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No users are assigned to this role.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((userRole) => (
                <div
                  key={userRole.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-semibold">
                          {userRole.user.firstName} {userRole.user.lastName}
                        </h4>
                        {!userRole.user.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                        {userRole.isActive ? (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Inactive Role
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground ml-6">
                        {userRole.user.username && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Username:</span>
                            <span>{userRole.user.username}</span>
                          </div>
                        )}
                        {userRole.user.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{userRole.user.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3" />
                          <span>{userRole.user.businessName}</span>
                        </div>
                        <div className="text-xs mt-2">
                          Assigned:{" "}
                          {new Date(userRole.assignedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

