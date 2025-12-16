import { ipcRenderer } from "electron";

export const categoryAPI = {
  create: (categoryData: {
    name: string;
    description?: string;
    businessId: string;
    sortOrder?: number;
  }) => ipcRenderer.invoke("categories:create", categoryData),

  getByBusiness: (businessId: string) =>
    ipcRenderer.invoke("categories:getByBusiness", businessId),

  getStats: (businessId: string) =>
    ipcRenderer.invoke("categories:getStats", businessId),

  getById: (id: string) => ipcRenderer.invoke("categories:getById", id),

  update: (id: string, updates: any) =>
    ipcRenderer.invoke("categories:update", id, updates),

  delete: (id: string) => ipcRenderer.invoke("categories:delete", id),

  reorder: (businessId: string, categoryIds: string[]) =>
    ipcRenderer.invoke("categories:reorder", businessId, categoryIds),

  getVatCategories: (businessId: string) =>
    ipcRenderer.invoke("categories:getVatCategories", businessId),

  /**
   * Get direct children of a category with pagination
   * @param businessId - Business ID
   * @param parentId - Parent category ID (null for root categories)
   * @param pagination - Pagination parameters
   */
  getChildren: (
    businessId: string,
    parentId: string | null,
    pagination: {
      page: number;
      pageSize: number;
    }
  ) =>
    ipcRenderer.invoke(
      "categories:getChildren",
      businessId,
      parentId,
      pagination
    ),
};
