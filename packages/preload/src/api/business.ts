import { ipcRenderer } from "electron";

export interface BusinessUpdateData {
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  vatNumber?: string;
  businessType?: "retail" | "restaurant" | "service" | "wholesale" | "other";
  currency?: string;
  timezone?: string;
}

export const businessAPI = {
  update: (
    sessionToken: string,
    businessId: string,
    updates: BusinessUpdateData
  ) => ipcRenderer.invoke("business:update", sessionToken, businessId, updates),
};
