/**
 * Hook for managing products
 * Handles loading, filtering, and managing product state
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import type { Product } from "@/features/products/types/product.types";

/**
 * Hook for managing products
 * @param businessId - Business ID to load products for
 * @returns Products state and loading functions
 */
export function useProducts(businessId: string | undefined) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load products from backend
   */
  const loadProducts = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await window.productAPI.getByBusiness(businessId);

      if (response.success && response.products) {
        // Filter to only active products
        const activeProducts = response.products.filter(
          (product) => product.isActive
        );
        setProducts(activeProducts);
      } else {
        const errorMessage =
          "message" in response
            ? String(response.message)
            : "Failed to load products";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setError("Failed to load products");
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  /**
   * Load products on mount and when businessId changes
   */
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /**
   * Filtered products based on search query
   * Note: This is a placeholder - search query should be passed as a parameter
   * when implementing search functionality
   */
  const filteredProducts = useMemo(() => {
    // For now, return all products
    // Search functionality will be added in a future update
    return products;
  }, [products]);

  /**
   * Filter products by search query
   * @param searchQuery - Search query string
   * @returns Filtered products
   */
  const getFilteredProducts = useCallback(
    (searchQuery: string): Product[] => {
      if (!searchQuery.trim()) {
        return products;
      }

      const query = searchQuery.toLowerCase();
      return products.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.plu?.includes(query) ||
          product.sku.toLowerCase().includes(query)
      );
    },
    [products]
  );

  return {
    products,
    loading,
    error,
    loadProducts,
    filteredProducts,
    getFilteredProducts,
  };
}

