/**
 * Success Message Templates
 * 
 * Centralized success messages for CRUD operations and other user actions
 */

export const successMessages = {
  /**
   * Create operation success message
   */
  create: (entity: string) => `${entity} created successfully`,

  /**
   * Update operation success message
   */
  update: (entity: string) => `${entity} updated successfully`,

  /**
   * Delete operation success message
   */
  delete: (entity: string) => `${entity} deleted successfully`,

  /**
   * Duplicate operation success message
   */
  duplicate: (entity: string) => `${entity} duplicated successfully`,

  /**
   * Archive operation success message
   */
  archive: (entity: string) => `${entity} archived successfully`,

  /**
   * Restore operation success message
   */
  restore: (entity: string) => `${entity} restored successfully`,

  /**
   * Import operation success message
   */
  import: (entity: string, count?: number) =>
    count !== undefined
      ? `${count} ${entity}${count > 1 ? "s" : ""} imported successfully`
      : `${entity} imported successfully`,

  /**
   * Export operation success message
   */
  export: (entity: string) => `${entity} exported successfully`,

  /**
   * Save operation success message (generic)
   */
  save: (entity: string) => `${entity} saved successfully`,

  /**
   * Bulk operation success message
   */
  bulkOperation: (operation: string, entity: string, count: number) =>
    `${operation} completed for ${count} ${entity}${count > 1 ? "s" : ""}`,
} as const;

