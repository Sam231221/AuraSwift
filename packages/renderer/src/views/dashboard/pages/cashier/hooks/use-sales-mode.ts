/**
 * useSalesMode Hook
 *
 * Detects and provides sales mode information (admin vs cashier)
 * based on user's RBAC roles and login response.
 */

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import type { Shift } from "@/types/domain/shift";
import { getLogger } from "@/shared/utils/logger";
import {
  getUserRoleName,
  userRequiresShift,
} from "@/shared/utils/rbac-helpers";

const logger = getLogger("use-sales-mode");

export interface SalesMode {
  mode: "admin" | "cashier";
  requiresShift: boolean;
  canMakeSales: boolean;
  activeShift: Shift | null;
  isLoading: boolean;
}

/**
 * Hook to detect sales mode and shift requirements
 * @returns Sales mode information
 */
export function useSalesMode(): SalesMode {
  const { user } = useAuth();
  const [mode, setMode] = useState<"admin" | "cashier">("cashier");
  const [requiresShift, setRequiresShift] = useState(true);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detect mode from stored login response or user data
  useEffect(() => {
    const detectMode = async () => {
      if (!user) {
        setMode("cashier");
        setRequiresShift(true);
        setIsLoading(false);
        return;
      }

      try {
        // Use RBAC system to determine role and shift requirements
        const roleName = getUserRoleName(user);
        const requiresShiftForUser = userRequiresShift(user);

        // Determine mode based on role
        // Admin/Owner roles = admin mode (no shift required)
        // Cashier/Manager/Supervisor roles = cashier mode (shift required)
        let detectedMode: "admin" | "cashier";
        let detectedRequiresShift: boolean;

        if (roleName === "admin" || roleName === "owner") {
          detectedMode = "admin";
          detectedRequiresShift = false;
        } else {
          // Cashier mode for all other roles (cashier, manager, supervisor)
          detectedMode = "cashier";
          // According to TransactionManager: Cashiers/Managers MUST have an active shift
          // Use userRequiresShift helper which checks shiftRequired field if available,
          // or defaults based on role. For managers, always require shift.
          if (roleName === "manager") {
            // Managers always require shifts (per TransactionManager requirement)
            detectedRequiresShift = true;
          } else {
            // Use the helper function for other roles (cashier, supervisor)
            detectedRequiresShift = requiresShiftForUser;
          }
        }

        setMode(detectedMode);
        setRequiresShift(detectedRequiresShift);

        logger.info(
          `[useSalesMode] Mode detected from RBAC - Role: ${roleName}, Mode: ${detectedMode}, requiresShift: ${detectedRequiresShift}`
        );

        // Clear shift if shift is no longer required
        if (!detectedRequiresShift) {
          setActiveShift(null);
        } else if (user.id) {
          // Load active shift if required
          try {
            const shiftResponse = await window.shiftAPI.getActive(user.id);
            if (shiftResponse.success && shiftResponse.data) {
              setActiveShift(shiftResponse.data as Shift);
            } else {
              setActiveShift(null);
            }
          } catch (error) {
            logger.error("[useSalesMode] Error loading active shift:", error);
            setActiveShift(null);
          }
        }
      } catch (error) {
        logger.error("[useSalesMode] Error detecting mode:", error);
        // Default to cashier mode (conservative)
        setMode("cashier");
        setRequiresShift(true);
      } finally {
        setIsLoading(false);
      }
    };

    detectMode();
  }, [user]);

  // Update active shift when it changes
  useEffect(() => {
    if (!requiresShift || !user?.id) {
      setActiveShift(null);
      return;
    }

    const loadActiveShift = async () => {
      try {
        const shiftResponse = await window.shiftAPI.getActive(user.id);
        if (shiftResponse.success && shiftResponse.data) {
          setActiveShift(shiftResponse.data as Shift);
        } else {
          setActiveShift(null);
        }
      } catch (error) {
        logger.error("[useSalesMode] Error loading active shift:", error);
        setActiveShift(null);
      }
    };

    loadActiveShift();

    // Poll for active shift updates (every 30 seconds)
    const interval = setInterval(loadActiveShift, 30000);
    return () => clearInterval(interval);
  }, [requiresShift, user?.id]);

  const canMakeSales = useMemo(() => {
    if (!requiresShift) return true; // Admin mode - can always make sales
    return !!activeShift; // Cashier mode - requires active shift
  }, [requiresShift, activeShift]);

  return {
    mode,
    requiresShift,
    canMakeSales,
    activeShift,
    isLoading,
  };
}
