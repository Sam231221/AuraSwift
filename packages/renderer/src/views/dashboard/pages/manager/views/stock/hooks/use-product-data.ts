import { useState, useCallback, useEffect } from "react";
import type { Product } from "@/types/domain";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('use-product-data');

interface Category {
  id: string;
  name: string;
  description?: string | null;
  businessId: string;
  isActive: boolean | null;
  sortOrder: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  image?: string | null;
  color?: string | null;
  parentId?: string | null;
  vatCategoryId?: string | null;
  vatOverridePercent?: number | null;
  ageRestrictionLevel?: "NONE" | "AGE_16" | "AGE_18" | "AGE_21" | null;
  requireIdScan?: boolean | null;
  restrictionReason?: string | null;
}

interface VatCategory {
  id: string;
  name: string;
  ratePercent: number;
}

interface UseProductDataProps {
  businessId?: string;
}

export const useProductData = ({ businessId }: UseProductDataProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vatCategories, setVatCategories] = useState<VatCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!businessId) {
      logger.warn("Cannot load products: businessId is missing");
      setProducts([]);
      return;
    }
    try {
      setLoading(true);
      const response = await window.productAPI.getByBusiness(businessId);
      if (response.success && response.products) {
        setProducts(Array.isArray(response.products) ? response.products : []);
      } else {
        logger.warn("Failed to load products");
        setProducts([]);
      }
    } catch (error) {
      logger.error("Error loading products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const loadCategories = useCallback(async () => {
    if (!businessId) {
      logger.warn("Cannot load categories: businessId is missing");
      setCategories([]);
      return;
    }
    try {
      const response = await window.categoryAPI.getByBusiness(businessId);
      if (response.success && response.categories) {
        setCategories(
          Array.isArray(response.categories) ? response.categories : []
        );
      } else {
        logger.warn("Failed to load categories");
        setCategories([]);
      }
    } catch (error) {
      logger.error("Error loading categories:", error);
      setCategories([]);
    }
  }, [businessId]);

  const loadVatCategories = useCallback(async () => {
    if (!businessId) {
      setVatCategories([]);
      return;
    }
    try {
      const response = await window.categoryAPI.getVatCategories(businessId);
      if (response.success && response.vatCategories) {
        setVatCategories(response.vatCategories);
      } else {
        logger.error("Failed to load VAT categories");
        setVatCategories([]);
      }
    } catch (error) {
      logger.error("Error loading VAT categories:", error);
      setVatCategories([]);
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) {
      loadProducts();
      loadCategories();
      loadVatCategories();
    }
  }, [businessId, loadProducts, loadCategories, loadVatCategories]);

  return {
    products,
    categories,
    vatCategories,
    loading,
    setProducts,
    loadProducts,
    loadCategories,
    loadVatCategories,
  };
};

export type { Category, VatCategory };
