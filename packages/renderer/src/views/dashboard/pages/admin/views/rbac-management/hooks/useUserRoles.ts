import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { UserRoleAssignFormData } from "../schemas";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('useUserRoles');

interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: number;
  expiresAt: number | null;
  isActive: boolean;
  role?: {
    id: string;
    name: string;
    displayName: string;
    permissions: string[];
  };
}

export function useUserRoles(userId?: string) {
  const [data, setData] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRoles = useCallback(async () => {
    if (!userId) {
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sessionToken = await window.authStore.get("token");
      if (!sessionToken) throw new Error("Not authenticated");

      logger.info("[useUserRoles] Fetching roles for userId:", userId);
      const response = await window.rbacAPI.userRoles.getUserRoles(
        sessionToken,
        userId
      );

      logger.info("[useUserRoles] Response:", response);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch user roles");
      }

      setData(response.data as UserRole[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error(`[useUserRoles] Error: ${errorMessage}`, err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

  return { data, isLoading, error, refetch: fetchUserRoles };
}

export function useAssignRole() {
  const [isPending, setIsPending] = useState(false);

  const assignRole = useCallback(
    async (
      roleData: UserRoleAssignFormData,
      callbacks?: { onSuccess?: () => void }
    ) => {
      setIsPending(true);

      try {
        const sessionToken = await window.authStore.get("token");
        if (!sessionToken) throw new Error("Not authenticated");

        const response = await window.rbacAPI.userRoles.assign(
          sessionToken,
          roleData.userId,
          roleData.roleId
        );

        if (!response.success) {
          throw new Error(response.message || "Failed to assign role");
        }

        toast.success("Role assigned successfully");
        callbacks?.onSuccess?.();
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to assign role", {
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return { mutate: assignRole, isPending };
}

export function useRevokeRole() {
  const [isPending, setIsPending] = useState(false);

  const revokeRole = useCallback(
    async (
      {
        userId,
        roleId,
      }: {
        userId: string;
        roleId: string;
      },
      callbacks?: { onSuccess?: () => void }
    ) => {
      setIsPending(true);

      try {
        const sessionToken = await window.authStore.get("token");
        if (!sessionToken) throw new Error("Not authenticated");

        const response = await window.rbacAPI.userRoles.revoke(
          sessionToken,
          userId,
          roleId
        );

        if (!response.success) {
          throw new Error(response.message || "Failed to revoke role");
        }

        toast.success("Role revoked successfully");
        callbacks?.onSuccess?.();
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to revoke role", {
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return { mutate: revokeRole, isPending };
}

export function useSetPrimaryRole() {
  const [isPending, setIsPending] = useState(false);

  const setPrimaryRole = useCallback(
    async (
      {
        userId,
        roleId,
      }: {
        userId: string;
        roleId: string;
      },
      callbacks?: { onSuccess?: () => void }
    ) => {
      setIsPending(true);

      try {
        const sessionToken = await window.authStore.get("token");
        if (!sessionToken) throw new Error("Not authenticated");

        const response = await window.rbacAPI.userRoles.setPrimaryRole(
          sessionToken,
          userId,
          roleId
        );

        if (!response.success) {
          throw new Error(response.message || "Failed to set primary role");
        }

        toast.success("Primary role updated successfully");
        callbacks?.onSuccess?.();
        return response.data;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to set primary role", {
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return { mutate: setPrimaryRole, isPending };
}
