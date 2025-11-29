import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, UserCog } from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssignRoleDialog, UserRolesList } from "./rbac-management/components";
import {
  useRoles,
  useUserRoles,
  useAssignRole,
  useRevokeRole,
} from "./rbac-management/hooks";
import { useStaffUsers } from "./user-management/hooks";

export default function UserRoleAssignmentView({
  onBack,
}: {
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { data: roles } = useRoles();
  const { staffUsers } = useStaffUsers();
  const { mutate: assignRole, isPending: isAssigning } = useAssignRole();
  const { mutate: revokeRole, isPending: isRevoking } = useRevokeRole();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const { data: userRoles, refetch: refetchUserRoles } =
    useUserRoles(selectedUserId);

  const handleAssignRole = (data: { userId: string; roleId: string }) => {
    assignRole(
      {
        userId: data.userId,
        roleId: data.roleId,
      },
      {
        onSuccess: () => {
          setIsAssignDialogOpen(false);
          refetchUserRoles();
        },
      }
    );
  };

  const handleRevokeRole = (userId: string, roleId: string) => {
    revokeRole(
      {
        userId,
        roleId,
      },
      {
        onSuccess: () => {
          refetchUserRoles();
        },
      }
    );
  };

  const selectedUser = staffUsers?.find((u) => u.id === selectedUserId);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-[1600px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <UserCog className="h-7 w-7" />
              User Role Assignment
            </h1>
            <p className="text-muted-foreground mt-1">
              Assign and manage roles for users
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select User</CardTitle>
            <CardDescription>
              Choose a user to manage their roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {staffUsers?.map((staffUser) => (
                  <SelectItem key={staffUser.id} value={staffUser.id}>
                    {staffUser.firstName} {staffUser.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedUser && (
              <div className="space-y-2 p-4 bg-accent rounded-lg">
                <div className="font-medium">
                  {selectedUser.firstName} {selectedUser.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedUser.email}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Roles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assigned Roles</CardTitle>
                <CardDescription>
                  {selectedUser
                    ? `Roles for ${selectedUser.firstName} ${selectedUser.lastName}`
                    : "Select a user to view their roles"}
                </CardDescription>
              </div>
              {selectedUserId && (
                <Button onClick={() => setIsAssignDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Role
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedUserId ? (
              <div className="text-center py-12 text-muted-foreground">
                Please select a user from the list
              </div>
            ) : userRoles ? (
              <UserRolesList
                userRoles={userRoles}
                onRevoke={handleRevokeRole}
                isRevoking={isRevoking}
                currentUserId={user?.id || ""}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Loading roles...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Role Dialog */}
      {selectedUserId && (
        <AssignRoleDialog
          users={staffUsers || []}
          roles={roles || []}
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          onSubmit={handleAssignRole}
          isLoading={isAssigning}
          preselectedUserId={selectedUserId}
        />
      )}
    </div>
  );
}
