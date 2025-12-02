/**
 * Inventory Access Hook
 *
 * Provides RBAC checks for the inventory feature.
 * Use this hook in components to check permissions.
 */

import { useUserPermissions } from "@/features/dashboard/hooks/use-user-permissions";
import { INVENTORY_PERMISSIONS } from "../config/permissions";

export function useInventoryAccess() {
  const { hasPermission, hasAnyPermission } = useUserPermissions();

  return {
    /** Can read inventory data */
    canRead: hasPermission(INVENTORY_PERMISSIONS.READ),

    /** Can manage inventory (create, update, delete) */
    canManage: hasPermission(INVENTORY_PERMISSIONS.MANAGE),

    /** Can adjust stock levels */
    canAdjust: hasPermission(INVENTORY_PERMISSIONS.ADJUST),

    /** Can view stock movement history */
    canViewHistory: hasPermission(INVENTORY_PERMISSIONS.VIEW_HISTORY),

    /** Can manage categories */
    canManageCategories: hasPermission(INVENTORY_PERMISSIONS.MANAGE_CATEGORIES),

    /** Can manage batches */
    canManageBatches: hasPermission(INVENTORY_PERMISSIONS.MANAGE_BATCHES),

    /** Check if user has any inventory permission */
    hasAnyAccess: hasAnyPermission([
      INVENTORY_PERMISSIONS.READ,
      INVENTORY_PERMISSIONS.MANAGE,
      INVENTORY_PERMISSIONS.ADJUST,
    ]),
  };
}
