/**
 * Product Management Wrapper Component
 *
 * Wrapper component that provides shared state and navigation
 * for Product Management nested views.
 *
 * This wrapper lives in the inventory feature to keep features self-contained.
 */

import { useNestedNavigation } from "@/navigation/hooks/use-nested-navigation";
import ProductManagementView from "@/features/inventory/views/product-management-view";

/**
 * Product Management Wrapper
 *
 * Wraps ProductManagementView and provides nested navigation context.
 * ProductManagementView will use nested navigation internally.
 */
export function ProductManagementWrapper() {
  const { goBack } = useNestedNavigation("productManagement");

  // ProductManagementView will handle its own state and use nested navigation
  // We pass navigation functions via context
  return <ProductManagementView onBack={goBack} />;
}
