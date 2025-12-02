/**
 * Inventory Navigation Hook
 * 
 * Provides type-safe navigation for the inventory feature.
 * Use this hook in components to navigate within the feature.
 */

import { useNavigation } from "@/navigation/hooks/use-navigation";
import { INVENTORY_ROUTES } from "../config/navigation";
import type { InventoryRoute } from "../config/navigation";

export function useInventoryNavigation() {
  const { navigateTo } = useNavigation();

  return {
    /** Navigate to inventory dashboard */
    goToDashboard: () => navigateTo(INVENTORY_ROUTES.DASHBOARD),
    
    /** Navigate to product list */
    goToProducts: () => navigateTo(INVENTORY_ROUTES.PRODUCTS),
    
    /** Navigate to product details */
    goToProductDetails: (productId: string) => 
      navigateTo(INVENTORY_ROUTES.PRODUCT_DETAILS, { productId }),
    
    /** Navigate to batch management */
    goToBatches: () => navigateTo(INVENTORY_ROUTES.BATCHES),
    
    /** Navigate to category management */
    goToCategories: () => navigateTo(INVENTORY_ROUTES.CATEGORIES),
    
    /** Navigate to stock movement history */
    goToHistory: () => navigateTo(INVENTORY_ROUTES.HISTORY),
    
    /** Navigate to expiry dashboard */
    goToExpiryDashboard: () => navigateTo(INVENTORY_ROUTES.EXPIRY_DASHBOARD),
    
    /** Generic navigate function with type safety */
    navigate: (route: InventoryRoute, params?: Record<string, unknown>) => 
      navigateTo(route, params),
  };
}

