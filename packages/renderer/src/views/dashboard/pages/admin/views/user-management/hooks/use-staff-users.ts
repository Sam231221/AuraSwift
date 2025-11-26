import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { StaffUser } from "../schemas/types";
import { useAuth } from "@/shared/hooks/use-auth";

export function useStaffUsers() {
  const { user } = useAuth();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStaffUsers = async () => {
    if (!user?.businessId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await window.authAPI.getUsersByBusiness(user.businessId);

      if (response.success && response.users) {
        // Filter out admin users and convert to StaffUser format
        const staffUsers: StaffUser[] = response.users
          .filter((u) => u.role !== "admin")
          .map((u) => ({
            id: u.id,
            email: u.email || "",
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role as "cashier" | "manager",
            businessId: u.businessId,
            avatar: u.avatar,
            address: (u as any).address || "",
            createdAt: u.createdAt || new Date().toISOString(),
            isActive: u.isActive !== undefined ? u.isActive : true,
          }));

        setStaffUsers(staffUsers);
      } else {
        const errorMessage = response.message || "Failed to load staff users";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load staff users";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.businessId]);

  return {
    staffUsers,
    isLoading,
    error,
    refetch: loadStaffUsers,
  };
}
