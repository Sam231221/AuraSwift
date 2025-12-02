/**
 * Inventory Feature Public API
 *
 * Export all public APIs for the inventory feature.
 * Other parts of the app should import from here.
 *
 * @module features/inventory
 */

// ============================================================================
// Config
// ============================================================================
export { inventoryFeature, inventoryViews } from "./config/feature-config";
export { INVENTORY_PERMISSIONS } from "./config/permissions";
export { INVENTORY_ROUTES } from "./config/navigation";
export type { InventoryPermission } from "./config/permissions";
export type { InventoryRoute } from "./config/navigation";

// ============================================================================
// Hooks
// ============================================================================
// Feature-level hooks
export { useInventoryAccess } from "./hooks/use-inventory-access";
export { useInventoryNavigation } from "./hooks/use-inventory-navigation";

// Data hooks
export { useProductData } from "./hooks/use-product-data";
export { useBatchData } from "./hooks/use-batch-data";
export { useExpiryAlerts } from "./hooks/use-expiry-alerts";

// Form hooks
export { useProductForm } from "./hooks/use-product-form";
export { useBatchForm } from "./hooks/use-batch-form";
export { useCategoryForm } from "./hooks/use-category-form";

// Re-export types from hooks
export type { Category, VatCategory } from "./hooks/use-product-data";

// ============================================================================
// Views
// ============================================================================
export { default as ProductManagementView } from "./views/product-management-view";
export { default as CategoryManagementView } from "./views/category-management-view";
export { default as BatchManagementView } from "./views/batch-management-view";
export { default as InventoryDashboardView } from "./views/inventory-dashboard-view";
export { default as ProductDetailsView } from "./views/product-details-view";
export { ExpiryDashboardView } from "./views/expiry-dashboard-view";
export { default as StockMovementHistoryView } from "./views/stock-movement-history-view";

// ============================================================================
// Components
// ============================================================================
// Batch components
export { default as BatchList } from "./components/batch/batch-list";
export { default as BatchFormDrawer } from "./components/batch/batch-form-drawer";
export { default as BatchAdjustmentModal } from "./components/batch/batch-adjustment-modal";

// Category components
export { CategoryFormDrawer } from "./components/category/category-form-drawer";
export { CategoryRow } from "./components/category/category-row";

// Product components
export { default as ProductFormDrawer } from "./components/product/product-form-drawer";

// Shared components
export { default as ExpiryAlertCenter } from "./components/shared/expiry-alert-center";
export { ImportBookerModal } from "./components/shared/import-booker-modal";
export { default as StockAdjustmentModal } from "./components/shared/stock-adjustment-modal";

// ============================================================================
// Types
// ============================================================================
// Batch types
export type {
  ProductBatch,
  Supplier,
  ExpirySettings,
  ExpiryNotification,
  ExpiryAlert,
  BatchStockMovement,
  BatchAnalytics,
  BatchResponse,
  ExpirySettingsResponse,
  ExpiryNotificationResponse,
  SupplierResponse,
  BatchStatus,
  NotificationType,
  NotificationStatus,
  NotificationChannel,
  StockRotationMethod,
} from "./types/batch.types";

// Age restriction types
export type {
  AgeRestrictionLevel,
  VerificationMethod,
  AgeRestrictionConfig,
  AgeVerificationData,
  AgeVerificationRecord,
} from "./types/age-restriction.types";
export { AGE_RESTRICTIONS } from "./types/age-restriction.types";

// Import types
export type {
  ImportProgress,
  ImportResult,
  ImportOptions,
} from "./types/import.types";

// ============================================================================
// Utils
// ============================================================================
// Category utils
export {
  buildCategoryTree,
  focusFirstErrorField,
} from "./utils";
export type {
  CategoryWithChildren,
  CategoryRowProps,
} from "./utils";

// Product utils
export {
  filterProducts,
  getLowStockProducts,
  paginateProducts,
} from "./utils/product-filters";

// Age restriction utils
export {
  getMinimumAge,
  calculateAge,
  meetsAgeRequirement,
  getHighestAgeRestriction,
  getAgeRestrictionLabel,
  getAgeRestrictionColor,
} from "./utils/age-restriction";

// Expiry calculations
export {
  calculateDaysUntilExpiry,
  getExpiryStatus,
  generateExpiryAlert,
  filterBatchesByExpiryStatus,
  getBatchesExpiringInRange,
  sortBatchesByExpiry,
  calculateTotalStockFromBatches,
  formatExpiryDate,
  generateBatchNumber,
  canSellBatch,
  getExpiryStatusColor,
} from "./utils/expiry-calculations";

// ============================================================================
// Schemas
// ============================================================================
// Product schemas
export {
  productCreateSchema,
  productUpdateSchema,
  salesUnitSchema,
  productTypeSchema,
  stockRotationMethodSchema,
  ageRestrictionLevelSchema,
} from "./schemas/product-schema";
export type {
  ProductFormData,
  ProductUpdateData,
} from "./schemas/product-schema";

// Category schemas
export {
  categoryCreateSchema,
  categoryUpdateSchema,
} from "./schemas/category-schema";
export type {
  CategoryFormData,
  CategoryUpdateData,
} from "./schemas/category-schema";

// Batch schemas
export {
  batchCreateSchema,
  batchUpdateSchema,
} from "./schemas/batch-schema";
export type {
  BatchFormData,
  BatchUpdateData,
} from "./schemas/batch-schema";
