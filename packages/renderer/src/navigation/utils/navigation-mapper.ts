/**
 * Navigation Mapper
 *
 * Maps feature actions to view IDs for navigation.
 * Centralizes the mapping between dashboard feature actions and views.
 */

/**
 * Map feature ID and action ID to view ID
 *
 * @param featureId - Feature identifier
 * @param actionId - Action identifier
 * @returns View ID or undefined if no mapping exists
 */
export function mapActionToView(
  featureId: string,
  actionId: string
): string | undefined {
  const mapping: Record<string, Record<string, string>> = {
    "user-management": {
      "manage-users": "userManagement",
      "role-permissions": "roleManagement",
      "user-role-assignment": "userRoleAssignment",
      "staff-schedules": "staffSchedules",
    },
    "management-actions": {
      "new-sale": "newTransaction",
      "manage-inventory": "productManagement",
      "manage-users": "userManagement",
      "staff-schedules": "staffSchedules",
    },
    "quick-actions": {
      "quick-new-sale": "newTransaction",
      "quick-manage-users": "userManagement",
    },
    "system-settings": {
      "general-settings": "generalSettings",
    },
  };

  return mapping[featureId]?.[actionId];
}

/**
 * Check if an action maps to a view
 *
 * @param featureId - Feature identifier
 * @param actionId - Action identifier
 * @returns Whether the action maps to a view
 */
export function hasViewMapping(featureId: string, actionId: string): boolean {
  return mapActionToView(featureId, actionId) !== undefined;
}
