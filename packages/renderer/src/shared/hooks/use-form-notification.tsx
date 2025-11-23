/**
 * Form Notification Hook
 * 
 * Provides consistent toast notification handling for form operations.
 * Use this hook to display success and error messages for CRUD operations.
 */

import { toast } from "sonner";
import { useCallback } from "react";
import { successMessages } from "@/shared/validation/messages";

export type NotificationType = "success" | "error" | "info" | "warning";

export type CrudOperation = "create" | "update" | "delete" | "duplicate" | "archive" | "restore";

interface UseFormNotificationOptions {
  /**
   * The entity name (e.g., "Product", "Category", "User")
   * Used in default success messages
   */
  entityName: string;

  /**
   * Custom operation messages
   * Override default success messages if needed
   */
  operations?: Partial<Record<CrudOperation, string>>;
}

interface NotificationHelpers {
  /**
   * Notify successful CRUD operation
   */
  notifySuccess: (operation: CrudOperation, customMessage?: string) => void;

  /**
   * Notify error
   */
  notifyError: (message: string) => void;

  /**
   * Notify info
   */
  notifyInfo: (message: string) => void;

  /**
   * Notify warning
   */
  notifyWarning: (message: string) => void;
}

/**
 * Hook for form notifications
 * 
 * @example
 * ```tsx
 * const { notifySuccess, notifyError } = useFormNotification({ entityName: "Product" });
 * 
 * // After successful creation
 * notifySuccess("create"); // Shows: "Product created successfully"
 * 
 * // On error
 * notifyError("Failed to save product");
 * ```
 */
export function useFormNotification({
  entityName,
  operations = {},
}: UseFormNotificationOptions): NotificationHelpers {
  const getSuccessMessage = useCallback(
    (operation: CrudOperation): string => {
      // Check for custom message first
      if (operations[operation]) {
        return operations[operation]!;
      }

      // Use default messages
      switch (operation) {
        case "create":
          return successMessages.create(entityName);
        case "update":
          return successMessages.update(entityName);
        case "delete":
          return successMessages.delete(entityName);
        case "duplicate":
          return successMessages.duplicate(entityName);
        case "archive":
          return successMessages.archive(entityName);
        case "restore":
          return successMessages.restore(entityName);
        default:
          return successMessages.save(entityName);
      }
    },
    [entityName, operations]
  );

  const notifySuccess = useCallback(
    (operation: CrudOperation, customMessage?: string) => {
      const message = customMessage || getSuccessMessage(operation);
      toast.success(message);
    },
    [getSuccessMessage]
  );

  const notifyError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const notifyInfo = useCallback((message: string) => {
    toast.info(message);
  }, []);

  const notifyWarning = useCallback((message: string) => {
    toast.warning(message);
  }, []);

  return {
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
  };
}

/**
 * Helper function to extract error message from various error types
 * Useful for displaying error messages from API calls or validation
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "An error occurred";
}

