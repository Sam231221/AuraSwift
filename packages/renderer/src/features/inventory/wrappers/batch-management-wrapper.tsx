/**
 * Batch Management Wrapper Component
 *
 * Wrapper component for Batch Management nested views.
 * This component provides the necessary navigation context to nested views.
 *
 * This wrapper lives in the inventory feature to keep features self-contained.
 */

import { useNestedNavigation } from "@/navigation/hooks/use-nested-navigation";
import BatchManagementView from "@/features/inventory/views/batch-management-view";

/**
 * Batch Management Wrapper
 *
 * Wraps BatchManagementView and provides nested navigation context.
 */
export function BatchManagementWrapper() {
  const { goBack, currentNestedParams } =
    useNestedNavigation("batchManagement");

  // Get initial product ID from navigation params if provided
  const initialProductId = currentNestedParams?.productId as string | undefined;

  return (
    <BatchManagementView onBack={goBack} initialProductId={initialProductId} />
  );
}
