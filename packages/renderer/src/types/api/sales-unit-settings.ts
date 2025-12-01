import type { SalesUnitSetting } from "@/types/domain/sales-unit";

export interface SalesUnitSettingsResponse {
  success: boolean;
  settings?: SalesUnitSetting;
  message?: string;
}

export interface SalesUnitSettingsAPI {
  get: (businessId: string) => Promise<SalesUnitSettingsResponse>;
  createOrUpdate: (
    businessId: string,
    settingsData: Partial<
      Omit<SalesUnitSetting, "id" | "businessId" | "createdAt" | "updatedAt">
    >
  ) => Promise<SalesUnitSettingsResponse>;
}
