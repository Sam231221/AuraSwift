/**
 * Batch Management Wrapper Components
 *
 * Wrapper components for Batch Management nested views.
 * These components provide the necessary props to nested views.
 */

import { useNestedNavigation } from "../hooks/use-nested-navigation";
import BatchManagementView from "@/features/inventory/views/batch-management-view";

/**
 * Batch Management Wrapper
 *
 * Wraps BatchManagementView and provides nested navigation context.
 */
export function BatchManagementWrapper() {
  const { goBack } = useNestedNavigation("batchManagement");

  // Get initial product ID from navigation params if provided
  const { currentNestedParams } = useNestedNavigation("batchManagement");
  const initialProductId = currentNestedParams?.productId as string | undefined;

  return (
    <BatchManagementView onBack={goBack} initialProductId={initialProductId} />
  );
}
