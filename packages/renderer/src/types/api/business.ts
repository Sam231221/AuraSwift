import type { APIResponse } from "./common";

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

export interface BusinessAPI {
  update: (
    sessionToken: string,
    businessId: string,
    updates: BusinessUpdateData
  ) => Promise<APIResponse & { business?: any }>;
}
