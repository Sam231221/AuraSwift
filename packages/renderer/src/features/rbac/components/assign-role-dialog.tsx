import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  username?: string;
  firstName: string;
  lastName: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
}

interface AssignRoleDialogProps {
  users: User[];
  roles: Role[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { userId: string; roleId: string }) => void;
  isLoading?: boolean;
  preselectedUserId?: string;
}

export function AssignRoleDialog({
  users,
  roles,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  preselectedUserId,
}: AssignRoleDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  useEffect(() => {
    if (preselectedUserId) {
      setSelectedUserId(preselectedUserId);
    }
  }, [preselectedUserId]);

  const handleSubmit = () => {
    if (!selectedUserId || !selectedRoleId) return;

    onSubmit({
      userId: selectedUserId,
      roleId: selectedRoleId,
    });

    // Reset form
    setSelectedUserId(preselectedUserId || "");
    setSelectedRoleId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Role to User</DialogTitle>
          <DialogDescription>
            Select a user and role to assign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={!!preselectedUserId}
            >
              <SelectTrigger id="user">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                    {user.username && ` (@${user.username})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedUserId || !selectedRoleId}
          >
            {isLoading ? "Assigning..." : "Assign Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
