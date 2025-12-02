/**
 * Product Management Wrapper
 *
 * Wrapper component that provides shared state and navigation
 * for Product Management nested views.
 */

import { useNestedNavigation } from "../hooks/use-nested-navigation";
import ProductManagementView from "@/views/dashboard/pages/manager/views/stock/manage-product-view";

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
