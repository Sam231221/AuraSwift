import type { Product } from "@/types/domain";

interface FilterOptions {
  searchTerm: string;
  filterCategory: string;
  filterStock: string;
}

export const filterProducts = (
  products: Product[],
  options: FilterOptions
): Product[] => {
  const { searchTerm, filterCategory, filterStock } = options;

  return products.filter((product) => {
    const matchesSearch =
      (product.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (product.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (product.sku || "").toLowerCase().includes(searchTerm.toLowerCase());

    const productCategoryId =
      ((product as unknown as Record<string, unknown>).categoryId as
        | string
        | undefined) || product.category;
    const matchesCategory =
      filterCategory === "all" || productCategoryId === filterCategory;

    const matchesStock =
      filterStock === "all" ||
      (filterStock === "low" &&
        product.stockLevel <= product.minStockLevel) ||
      (filterStock === "in_stock" &&
        product.stockLevel > product.minStockLevel) ||
      (filterStock === "out_of_stock" && product.stockLevel === 0);

    return matchesSearch && matchesCategory && matchesStock;
  });
};

export const getLowStockProducts = (products: Product[]): Product[] => {
  return Array.isArray(products)
    ? products.filter((p) => p.stockLevel <= p.minStockLevel && p.isActive)
    : [];
};

export const paginateProducts = (
  products: Product[],
  page: number,
  perPage: number
) => {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  return {
    paginatedProducts: products.slice(startIndex, endIndex),
    startIndex,
    totalPages: Math.ceil(products.length / perPage),
  };
};

