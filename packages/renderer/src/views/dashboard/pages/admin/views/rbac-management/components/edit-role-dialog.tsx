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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleUpdateSchema, type RoleUpdateFormData } from "../schemas";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("edit-role-dialog");

const AVAILABLE_PERMISSIONS = [
  "*:*", // All permissions (admin)
  "read:sales",
  "write:sales",
  "manage:inventory",
  "read:reports",
  "write:reports",
  "manage:users",
  "manage:settings",
  "override:transactions",
  "view:analytics",
  "manage:products",
  "manage:categories",
  "manage:suppliers",
  "manage:customers",
  "refund:transactions",
  "discount:apply",
];

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  permissions: string[];
  isActive: boolean;
  isSystemRole?: boolean;
}

interface EditRoleDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (roleId: string, data: RoleUpdateFormData) => void;
  isLoading?: boolean;
}

export function EditRoleDialog({
  role,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: EditRoleDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [isActive, setIsActive] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RoleUpdateFormData>({
    resolver: zodResolver(roleUpdateSchema),
  });

  useEffect(() => {
    if (role && open) {
      logger.info("[EditRoleDialog] Setting role data:", role);
      setValue("displayName", role.displayName);
      setValue("description", role.description || "");
      setSelectedPermissions(role.permissions || []);
      setIsActive(role.isActive);
      setPermissionSearch("");
    } else if (!open) {
      // Reset form when dialog closes
      reset();
      setSelectedPermissions([]);
      setPermissionSearch("");
      setIsActive(true);
    }
  }, [role, open, setValue, reset]);

  const handleFormSubmit = (data: RoleUpdateFormData) => {
    if (!role) return;

    // Validate that at least one permission is selected
    if (selectedPermissions.length === 0) {
      return;
    }

    onSubmit(role.id, {
      ...data,
      permissions: selectedPermissions,
      isActive,
    });
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const filteredPermissions = AVAILABLE_PERMISSIONS.filter((p) =>
    p.toLowerCase().includes(permissionSearch.toLowerCase())
  );

  if (!role) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Role: {role.displayName}</DialogTitle>
          <DialogDescription>
            {role.isSystemRole
              ? "System roles have limited editing. You can update display name, description, and permissions, but the role name cannot be changed."
              : "Update role details and permissions"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Role Name</Label>
            <Input value={role.name} disabled />
            <p className="text-xs text-muted-foreground">
              Role name cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="e.g., Inventory Specialist"
              {...register("displayName")}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">
                {errors.displayName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this role..."
              {...register("description")}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Role is active</Label>
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <Input
              placeholder="Search permissions..."
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
            />

            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {filteredPermissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded"
                  onClick={() => togglePermission(permission)}
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">{permission}</span>
                </div>
              ))}
            </div>

            {selectedPermissions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedPermissions.map((permission) => (
                  <Badge key={permission} variant="secondary">
                    {permission}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => togglePermission(permission)}
                    />
                  </Badge>
                ))}
              </div>
            )}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
