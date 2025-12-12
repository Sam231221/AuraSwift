/**
 * Product Management Context
 *
 * Provides shared state for Product Management nested views.
 * This allows nested views to access parent state without prop drilling.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { Product } from "@/types/domain";
import type { Category } from "@app/shared";

interface ProductManagementState {
  products: Product[];
  allProducts: Product[];
  categories: Category[];
  lowStockProducts: Product[];
  loading: boolean;
  // Filters
  searchTerm: string;
  filterCategory: string;
  filterStock: string;
  filterStatus: string;
  // Pagination
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  // Actions
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAdjustStock: (product: Product) => void;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStockFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onProductsImported: () => void;
}

const ProductManagementContext = createContext<
  ProductManagementState | undefined
>(undefined);

export function useProductManagementContext(): ProductManagementState {
  const context = useContext(ProductManagementContext);
  if (!context) {
    throw new Error(
      "useProductManagementContext must be used within ProductManagementProvider"
    );
  }
  return context;
}

interface ProductManagementProviderProps {
  children: ReactNode;
  value: ProductManagementState;
}

export function ProductManagementProvider({
  children,
  value,
}: ProductManagementProviderProps) {
  return (
    <ProductManagementContext.Provider value={value}>
      {children}
    </ProductManagementContext.Provider>
  );
}
