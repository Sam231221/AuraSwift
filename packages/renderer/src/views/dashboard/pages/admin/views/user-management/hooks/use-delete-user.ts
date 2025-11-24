import { useState } from "react";
import { toast } from "sonner";

export function useDeleteUser() {
  const [isLoading, setIsLoading] = useState(false);

  const deleteStaffUser = async (userId: string, userName: string) => {
    setIsLoading(true);

    try {
      console.log(`Deleting user: ${userName} (${userId})`);
      const response = await window.authAPI.deleteUser(userId);

      if (response.success) {
        toast.success("Staff member deleted successfully");
        return { success: true };
      } else {
        toast.error(response.message || "Failed to delete staff member");
        return {
          success: false,
          errors: [response.message || "Delete failed"],
        };
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete staff member");
      return {
        success: false,
        errors: ["An unexpected error occurred"],
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteStaffUser,
    isLoading,
  };
}
