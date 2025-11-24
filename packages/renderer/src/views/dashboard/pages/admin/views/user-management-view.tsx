import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Shield } from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import {
  UserStatsCards,
  UserFilters,
  UserTable,
  AddUserDialog,
  EditUserDialog,
  ViewUserDialog,
} from "./user-management/components";
import {
  useStaffUsers,
  useUserFilters,
  useUserDialogs,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "./user-management/hooks";
import type {
  UserCreateFormData,
  UserUpdateFormData,
} from "./user-management/schemas";

export default function UserManagementView({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const { staffUsers, isLoading: isLoadingUsers, refetch } = useStaffUsers();
  const {
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    filteredUsers,
  } = useUserFilters(staffUsers);
  const {
    isAddDialogOpen,
    isEditDialogOpen,
    isViewDialogOpen,
    selectedUser,
    openAddDialog,
    closeAddDialog,
    openEditDialog,
    closeEditDialog,
    openViewDialog,
    closeViewDialog,
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    setIsViewDialogOpen,
  } = useUserDialogs();
  const { createStaffUser, isLoading: isCreating } = useCreateUser();
  const { updateStaffUser, isLoading: isUpdating } = useUpdateUser();
  const { deleteStaffUser } = useDeleteUser();

  const isAdmin = user?.role === "admin";

  // Handle loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Handle access denied
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-xs sm:text-sm md:text-base lg:text-base text-gray-600">
            You don't have permission to access user management.
          </p>
        </div>
      </div>
    );
  }

  // Handle create user
  const handleCreateUser = async (data: UserCreateFormData) => {
    console.log("handleCreateUser called with:", data);
    try {
      const result = await createStaffUser(data);
      console.log("Create result:", result);
      if (result.success) {
        await refetch();
        closeAddDialog();
      } else {
        console.error("Create failed:", result.errors);
        // Error is already shown by the hook via toast
      }
    } catch (error) {
      console.error("Error in handleCreateUser:", error);
      // Error handling is done in the hook
    }
  };

  // Handle update user
  const handleUpdateUser = async (data: UserUpdateFormData) => {
    console.log("handleUpdateUser called with:", data);
    const result = await updateStaffUser(data);
    console.log("Update result:", result);
    if (result.success) {
      await refetch();
      closeEditDialog();
    } else {
      // Error is already shown by the hook via toast
      console.error("Update failed:", result.errors);
    }
  };

  // Handle delete user with confirmation
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${userName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    const result = await deleteStaffUser(userId, userName);
    if (result.success) {
      await refetch();
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 px-2 sm:px-4 md:px-6">
      {/* Back button */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
        >
          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 break-words">
            User Management
          </h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 mt-1 break-words">
            Manage staff members and their permissions
          </p>
        </div>

        <AddUserDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={handleCreateUser}
          isLoading={isCreating}
          trigger={
            <Button className="text-xs sm:text-sm md:text-base lg:text-base w-full sm:w-auto h-8 sm:h-9 md:h-10">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Staff Member</span>
              <span className="sm:hidden">Add Staff</span>
            </Button>
          }
        />
      </div>

      {/* Stats Cards */}
      <UserStatsCards staffUsers={staffUsers} />

      {/* Filters */}
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterRole={filterRole}
        onRoleFilterChange={setFilterRole}
      />

      {/* Staff Table */}
      <UserTable
        users={filteredUsers}
        isLoading={isLoadingUsers}
        searchTerm={searchTerm}
        filterRole={filterRole}
        onViewUser={openViewDialog}
        onEditUser={openEditDialog}
        onDeleteUser={handleDeleteUser}
        onAddUser={openAddDialog}
      />

      {/* Edit Dialog */}
      {selectedUser && (
        <EditUserDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          user={selectedUser}
          onSubmit={handleUpdateUser}
          isLoading={isUpdating}
        />
      )}

      {/* View Dialog */}
      {selectedUser && (
        <ViewUserDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          user={selectedUser}
          onEdit={() => {
            closeViewDialog();
            openEditDialog(selectedUser);
          }}
        />
      )}
    </div>
  );
}
