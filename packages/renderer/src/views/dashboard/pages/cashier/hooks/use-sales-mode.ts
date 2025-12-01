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
        // Check if mode is stored in auth store (from login response)
        const storedMode = await window.authStore.get("salesMode");
        const storedRequiresShift = await window.authStore.get("requiresShift");

        if (
          storedMode &&
          (storedMode === "admin" || storedMode === "cashier")
        ) {
          setMode(storedMode);
          setRequiresShift(storedRequiresShift === "true");
          logger.info(
            `[useSalesMode] Mode detected from store: ${storedMode}, requiresShift: ${storedRequiresShift}`
          );
        } else {
          // Fallback: Check user's shiftRequired field
          // This is a temporary fallback until we have an API endpoint
          const userShiftRequired = (user as any).shiftRequired;
          if (userShiftRequired === false) {
            setMode("admin");
            setRequiresShift(false);
          } else {
            setMode("cashier");
            setRequiresShift(true);
          }
          logger.info(
            `[useSalesMode] Mode detected from user field: ${mode}, requiresShift: ${requiresShift}`
          );
        }

        // Load active shift if required
        if (requiresShift && user.id) {
          try {
            const shiftResponse = await window.shiftAPI.getActive(user.id);
            if (shiftResponse.success && shiftResponse.data) {
              setActiveShift(shiftResponse.data as Shift);
            }
          } catch (error) {
            logger.error("[useSalesMode] Error loading active shift:", error);
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
