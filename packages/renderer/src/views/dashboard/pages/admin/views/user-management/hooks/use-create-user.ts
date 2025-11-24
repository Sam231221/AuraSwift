import { useState } from "react";
import { toast } from "sonner";
import type { UserCreateFormData } from "../schemas/user-schema";
import { useAuth } from "@/shared/hooks/use-auth";

export function useCreateUser() {
  const { createUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createStaffUser = async (data: UserCreateFormData) => {
    setIsLoading(true);

    try {
      if (!data.businessId) {
        toast.error("Business ID not found. Cannot create user.");
        return {
          success: false,
          errors: ["Business ID not found"],
        };
      }

      const userData = {
        businessId: data.businessId,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        avatar: data.avatar || undefined,
        address: data.address || undefined,
        username: data.email, // Use email as username
        pin: "1234", // Default PIN, should be changed by admin/user later
      };

      const response = await createUser(userData);

      if (response.success) {
        toast.success("Staff member created successfully");
        return { success: true };
      } else {
        toast.error(response.message || "Failed to create staff member");
        if (response.errors && response.errors.length > 0) {
          response.errors.forEach((error) => toast.error(error));
        }
        return {
          success: false,
          errors: response.errors || [response.message || "Creation failed"],
        };
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create staff member");
      return {
        success: false,
        errors: ["An unexpected error occurred"],
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createStaffUser,
    isLoading,
  };
}
