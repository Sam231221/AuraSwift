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
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleCreateSchema, type RoleCreateFormData } from "../schemas";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("create-role-dialog");

// Available permissions - you can expand this list
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

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoleCreateFormData) => void;
  isLoading?: boolean;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreateRoleDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RoleCreateFormData>({
    resolver: zodResolver(roleCreateSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      permissions: [],
    },
    mode: "onChange", // Validate on change for better UX
  });

  // Sync selectedPermissions with form's permissions field
  useEffect(() => {
    setValue("permissions", selectedPermissions, { shouldValidate: true });
  }, [selectedPermissions, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedPermissions([]);
      setPermissionSearch("");
    }
  }, [open, reset]);

  const handleFormSubmit = (data: RoleCreateFormData) => {
    logger.info("[handleFormSubmit] Form data received:", data);
    logger.info(
      "[handleFormSubmit] Selected permissions:",
      selectedPermissions
    );

    // Use permissions from form data (which should match selectedPermissions)
    const permissions = data.permissions || selectedPermissions;

    // Validate permissions
    if (!permissions || permissions.length === 0) {
      logger.error("[handleFormSubmit] No permissions selected - aborting");
      return;
    }

    // Only include description if it's provided and meets minimum length
    const submitData: RoleCreateFormData = {
      name: data.name.trim(),
      displayName: data.displayName.trim(),
      permissions: permissions,
    };

    // Only add description if it's provided and has at least 10 characters
    if (data.description && data.description.trim().length >= 10) {
      submitData.description = data.description.trim();
    }

    logger.info("[handleFormSubmit] Final submit data:", submitData);
    logger.info("[handleFormSubmit] Calling onSubmit callback");

    try {
      onSubmit(submitData);
      logger.info("[handleFormSubmit] onSubmit callback completed");
    } catch (error) {
      logger.error("[handleFormSubmit] Error in onSubmit callback:", error);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Create a custom role with specific permissions
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(
            (data) => {
              logger.info(
                "[CreateRoleDialog] Form validation passed, submitting"
              );
              handleFormSubmit(data);
            },
            (errors) => {
              logger.error(
                "[CreateRoleDialog] Form validation failed:",
                errors
              );
            }
          )}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              placeholder="e.g., inventory_specialist"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use lowercase with underscores only
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
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this role... (min 10 characters if provided)"
              {...register("description")}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional. If provided, must be at least 10 characters.
            </p>
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

            {selectedPermissions.length === 0 && (
              <p className="text-sm text-destructive">
                At least one permission is required
              </p>
            )}
            {errors.permissions && (
              <p className="text-sm text-destructive">
                {errors.permissions.message}
              </p>
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
            <Button
              type="submit"
              disabled={isLoading || selectedPermissions.length === 0}
            >
              {isLoading ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
