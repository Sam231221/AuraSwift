import { ipcRenderer } from "electron";

export interface CreateSupplierData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  businessId: string;
  isActive?: boolean;
}

export const suppliersAPI = {
  create: (supplierData: CreateSupplierData) =>
    ipcRenderer.invoke("suppliers:create", supplierData),

  getById: (supplierId: string) =>
    ipcRenderer.invoke("suppliers:getById", supplierId),

  getByBusiness: (businessId: string, includeInactive?: boolean) =>
    ipcRenderer.invoke("suppliers:getByBusiness", businessId, includeInactive),

  update: (supplierId: string, updates: Partial<CreateSupplierData>) =>
    ipcRenderer.invoke("suppliers:update", supplierId, updates),

  delete: (supplierId: string) =>
    ipcRenderer.invoke("suppliers:delete", supplierId),
};

