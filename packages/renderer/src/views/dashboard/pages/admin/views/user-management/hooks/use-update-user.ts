import { useState } from "react";
import { toast } from "sonner";
import type { UserUpdateFormData } from "../schemas/user-schema";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('use-update-user');

export function useUpdateUser() {
  const [isLoading, setIsLoading] = useState(false);

  const updateStaffUser = async (data: UserUpdateFormData) => {
    setIsLoading(true);

    try {
      const updates: Record<string, string | number | boolean> = {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive,
        address: data.address || "",
      };

      // Include avatar if it has a value
      if (data.avatar && data.avatar.trim() !== "") {
        updates.avatar = data.avatar;
      }

      const response = await window.authAPI.updateUser(data.id, updates);

      if (response.success) {
        toast.success("Staff member updated successfully");
        return { success: true };
      } else {
        toast.error(response.message || "Failed to update staff member");
        return {
          success: false,
          errors: [response.message || "Update failed"],
        };
      }
    } catch (error) {
      logger.error("Error updating user:", error);
      toast.error("Failed to update staff member");
      return {
        success: false,
        errors: ["An unexpected error occurred"],
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateStaffUser,
    isLoading,
  };
}
