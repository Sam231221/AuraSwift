import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Plus, Search, Shield } from "lucide-react";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('role-management-view');
import {
  RoleCard,
  CreateRoleDialog,
  EditRoleDialog,
  DeleteRoleDialog,
} from "./rbac-management/components";
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from "./rbac-management/hooks";
import type {
  RoleCreateFormData,
  RoleUpdateFormData,
} from "./rbac-management/schemas";

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

export default function RoleManagementView({ onBack }: { onBack: () => void }) {
  const { data: roles, isLoading, refetch } = useRoles();
  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole();
  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const filteredRoles = roles?.filter((role) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      role.name.toLowerCase().includes(searchLower) ||
      role.displayName.toLowerCase().includes(searchLower) ||
      role.description?.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateRole = (data: RoleCreateFormData) => {
    createRole(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        refetch();
      },
    });
  };

  const handleEditRole = (roleId: string, data: RoleUpdateFormData) => {
    updateRole(
      { roleId, data },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedRole(null);
          refetch();
        },
      }
    );
  };

  const handleDeleteRole = (roleId: string) => {
    deleteRole(roleId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedRole(null);
        refetch();
      },
    });
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

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
              <Shield className="h-7 w-7" />
              Role Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage user roles and permissions
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Roles</div>
          <div className="text-2xl font-bold mt-1">{roles?.length || 0}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Custom Roles</div>
          <div className="text-2xl font-bold mt-1">
            {roles?.filter((r) => !r.isSystemRole).length || 0}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">System Roles</div>
          <div className="text-2xl font-bold mt-1">
            {roles?.filter((r) => r.isSystemRole).length || 0}
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading roles...
        </div>
      ) : filteredRoles && filteredRoles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
              onViewUsers={(role) => {
                // TODO: Navigate to user list filtered by this role
                logger.info("View users for role:", role);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No roles found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "No roles match your search"
              : "Get started by creating your first custom role"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateRoleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateRole}
        isLoading={isCreating}
      />

      <EditRoleDialog
        role={selectedRole}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditRole}
        isLoading={isUpdating}
      />

      <DeleteRoleDialog
        role={selectedRole}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteRole}
        isLoading={isDeleting}
      />
    </div>
  );
}
