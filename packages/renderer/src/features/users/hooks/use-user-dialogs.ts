import { useState } from "react";
import type { StaffUser } from "../schemas/types";

export function useUserDialogs() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);

  const openAddDialog = () => setIsAddDialogOpen(true);
  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    setSelectedUser(null);
  };

  const openEditDialog = (user: StaffUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };
  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  const openViewDialog = (user: StaffUser) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };
  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedUser(null);
  };

  return {
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
    // Direct setters for compatibility with Dialog components
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    setIsViewDialogOpen,
  };
}
