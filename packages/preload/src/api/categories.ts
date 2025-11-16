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

  getById: (id: string) => ipcRenderer.invoke("categories:getById", id),

  update: (id: string, updates: any) =>
    ipcRenderer.invoke("categories:update", id, updates),

  delete: (id: string) => ipcRenderer.invoke("categories:delete", id),

  reorder: (businessId: string, categoryIds: string[]) =>
    ipcRenderer.invoke("categories:reorder", businessId, categoryIds),
  getVatCategories: (businessId: string) =>
    ipcRenderer.invoke("categories:getVatCategories", businessId),
};
