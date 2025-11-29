import { useState } from "react";
import { toast } from "sonner";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('use-delete-user');

export function useDeleteUser() {
  const [isLoading, setIsLoading] = useState(false);

  const deleteStaffUser = async (userId: string, userName: string) => {
    setIsLoading(true);

    try {
      logger.info(`Deleting user: ${userName} (${userId})`);

      // Get session token for authentication
      const sessionToken = await window.authStore.get("token");
      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const response = await window.authAPI.deleteUser(sessionToken, userId);

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
      logger.error("Error deleting user:", error);
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
